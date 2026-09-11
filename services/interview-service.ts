import { getDay } from "@/lib/curriculum";
import {
  parseInterviewRequest,
  type ParsedInterviewRequest,
} from "@/lib/validators";
import {
  evaluateAndGenerateNext,
  evaluateAnswer,
} from "@/services/evaluator";
import { buildDetailedStatistics, buildFinalFeedback } from "@/services/feedback";
import {
  resolveContinueState,
  type InterviewEngine,
} from "@/services/interview-engine";
import { isMemoryStoreError } from "@/services/memory";
import {
  generateInterviewQuestion,
  type LlmClient,
} from "@/services/llm";
import type { EngineError } from "@/types/interview";
import type {
  AnswerEvaluation,
  CombinedEvaluationResult,
  CombinedPromptInput,
  EvaluatorPromptInput,
  InterviewerPromptInput,
  LlmServiceError,
} from "@/types/llm";
import type { PlannedQuestion } from "@/types/planner";
import type { InterviewSession } from "@/types/interview";
import type {
  InterviewErrorResponse,
  InterviewServiceResult,
} from "@/types/api";

/**
 * Thin orchestration between the HTTP route, the deterministic engine, and the
 * runtime LLM services. The route stays thin; all decision logic lives here.
 *
 * Turn semantics:
 * - Start (candidate provided): welcome reply, no LLM call, no question asked.
 * - First message (no question phrased yet): phrase Q1 and reply with it.
 * - Later messages: a single combined LLM call evaluates the answer AND phrases
 *   the next question (halving provider round-trips). The deterministic engine
 *   then decides whether the follow-up text or the next planned question text
 *   becomes the next message; the final answer completes the interview with
 *   aggregate feedback and derived statistics.
 *
 * The engine commits state only after evaluation and phrasing succeed, so a
 * provider failure can be retried with the same message without double-counting.
 */

export const WELCOME_REPLY = "Welcome. Let's begin your interview.";
export const COMPLETED_REPLY = "Interview completed.";

export interface InterviewServiceOptions {
  engine: InterviewEngine;
  client: LlmClient;
}

export interface InterviewService {
  handle(body: unknown): Promise<InterviewServiceResult>;
}

export function createInterviewService(
  options: InterviewServiceOptions,
): InterviewService {
  return {
    async handle(body) {
      const parsed = parseInterviewRequest(body);
      if (!parsed) {
        return badRequest(
          "request body must be a session start (sessionId + candidate) or a continuation (sessionId + message)",
        );
      }
      try {
        return parsed.kind === "start"
          ? await handleStart(parsed)
          : await handleContinue(parsed);
      } catch (err) {
        // A session-store outage is a controlled 500, never "no session found".
        if (isMemoryStoreError(err)) {
          return storageError();
        }
        throw err;
      }
    },
  };

  async function handleStart(
    parsed: Extract<ParsedInterviewRequest, { kind: "start" }>,
  ): Promise<InterviewServiceResult> {
    const result = await options.engine.startInterview(parsed.candidate, {
      sessionId: parsed.sessionId,
    });
    if (!result.ok) {
      return engineErrorToHttp(result.error);
    }
    return { status: 200, body: { reply: WELCOME_REPLY, done: false } };
  }

  async function handleContinue(
    parsed: Extract<ParsedInterviewRequest, { kind: "continue" }>,
  ): Promise<InterviewServiceResult> {
    const session = await options.engine.getSession(parsed.sessionId);
    if (!session) {
      return notFound(`no interview session found for "${parsed.sessionId}"`);
    }
    if (session.status === "completed") {
      return badRequest(`interview session "${parsed.sessionId}" is completed`);
    }

    // First message: nothing has been phrased yet. Phrase Q1 and reply with it.
    if (session.turns.length === 0 && session.currentQuestionText === "") {
      return handleFirstMessage(session);
    }

    return handleAnswer(session, parsed.message);
  }

  async function handleFirstMessage(
    session: InterviewSession,
  ): Promise<InterviewServiceResult> {
    const spec = session.plan.questions[session.currentQuestionIndex];
    if (!spec) {
      return internalError("session has no active question to phrase");
    }

    const generated = await generateQuestion(options.client, session, spec, undefined);
    if (!generated.ok) {
      return generated.error;
    }

    await options.engine.setCurrentQuestionText(session.sessionId, generated.text);
    return { status: 200, body: { reply: generated.text, done: false } };
  }

  async function handleAnswer(
    session: InterviewSession,
    message: string,
  ): Promise<InterviewServiceResult> {
    const spec = session.followUpActive
      ? session.followUpSpec
      : session.plan.questions[session.currentQuestionIndex];

    if (!spec) {
      return internalError("session has no active question to answer");
    }

    // The interview is guaranteed to complete when there is no further planned
    // question, so the last answer only needs a pure evaluation (a single LLM
    // call) and no question phrasing.
    const nextSpec = nextPlannedQuestion(session);
    if (!nextSpec) {
      const evaluation = await evaluateAnswerFor(
        options.client,
        session,
        spec,
        message,
      );
      if (!evaluation.ok) {
        return evaluation.error;
      }
      const commit = await options.engine.continueInterview(
        session.sessionId,
        message,
        { evaluation: evaluation.value },
      );
      if (!commit.ok) {
        return engineErrorToHttp(commit.error);
      }
      if (!commit.done) {
        return internalError("engine did not complete the finished interview");
      }
      return finalResponse(commit.session);
    }

    // One combined LLM call: evaluate the answer and phrase the next question.
    // The engine later decides whether the follow-up text or the next planned
    // question text becomes the next message.
    const combined = await evaluateAndGenerateNextFor(
      options.client,
      session,
      spec,
      nextSpec,
      message,
    );
    if (!combined.ok) {
      return combined.error;
    }
    const { evaluation, followUpQuestionText, nextQuestionText } =
      combined.value;

    const state = resolveContinueState(session, evaluation);
    if (state.completed || !state.next) {
      // The answer completes the interview; the combined question text is unused.
      const commit = await options.engine.continueInterview(
        session.sessionId,
        message,
        { evaluation },
      );
      if (!commit.ok) {
        return engineErrorToHttp(commit.error);
      }
      if (!commit.done) {
        return internalError("engine did not complete the finished interview");
      }
      return finalResponse(commit.session);
    }

    // Choose the message text before committing so a failure here never leaves
    // a stored turn without a shown question.
    const text = state.sessionChanges.followUpActive
      ? followUpQuestionText ?? nextQuestionText
      : nextQuestionText;

    const commit = await options.engine.continueInterview(
      session.sessionId,
      message,
      { evaluation },
    );
    if (!commit.ok) {
      return engineErrorToHttp(commit.error);
    }
    if (commit.done) {
      return internalError("unexpected completion after resolving a next question");
    }
    if (!matchesSpec(commit.question, state.next)) {
      return internalError("question resolution diverged from the engine");
    }

    await options.engine.setCurrentQuestionText(session.sessionId, text);
    return { status: 200, body: { reply: text, done: false } };
  }

  function finalResponse(session: InterviewSession): InterviewServiceResult {
    return {
      status: 200,
      body: {
        reply: COMPLETED_REPLY,
        done: true,
        feedback: buildFinalFeedback(session),
        statistics: buildDetailedStatistics(session),
      },
    };
  }
}

/**
 * The planned question AFTER the currently active one, accounting for an
 * in-flight follow-up. When this returns undefined the interview is guaranteed
 * to complete after the current answer is stored.
 */
function nextPlannedQuestion(
  session: InterviewSession,
): PlannedQuestion | undefined {
  if (session.followUpActive) {
    return session.plan.questions[session.currentQuestionIndex];
  }
  return session.plan.questions[session.currentQuestionIndex + 1];
}

async function evaluateAnswerFor(
  client: LlmClient,
  session: InterviewSession,
  spec: PlannedQuestion,
  message: string,
): Promise<{ ok: true; value: AnswerEvaluation } | { ok: false; error: InterviewServiceResult }> {
  const input: EvaluatorPromptInput = {
    plannedQuestion: spec,
    generatedQuestion: {
      questionNumber: spec.questionNumber,
      text: session.currentQuestionText,
    },
    candidateAnswer: message,
    curriculumDay: dayTools(spec),
    conversation: session.turns,
  };
  const result = await evaluateAnswer(input, client);
  if (!result.ok) {
    return { ok: false, error: llmErrorToHttp(result.error) };
  }
  return { ok: true, value: result.value };
}

async function evaluateAndGenerateNextFor(
  client: LlmClient,
  session: InterviewSession,
  spec: PlannedQuestion,
  nextSpec: PlannedQuestion,
  message: string,
): Promise<
  | { ok: true; value: CombinedEvaluationResult }
  | { ok: false; error: InterviewServiceResult }
> {
  const input: CombinedPromptInput = {
    candidateProfile: session.candidate.member,
    experienceLevel: session.analysis.experienceLevel,
    generatedQuestion: {
      questionNumber: spec.questionNumber,
      text: session.currentQuestionText,
    },
    evalPlannedQuestion: spec,
    candidateAnswer: message,
    evalCurriculumDay: dayTools(spec),
    plannedQuestion: nextSpec,
    nextCurriculumDay: dayTools(nextSpec),
    conversation: session.turns,
  };
  const result = await evaluateAndGenerateNext(input, client);
  if (!result.ok) {
    return { ok: false, error: llmErrorToHttp(result.error) };
  }
  return { ok: true, value: result.value };
}

async function generateQuestion(
  client: LlmClient,
  session: InterviewSession,
  spec: PlannedQuestion,
  priorEvaluation: AnswerEvaluation | undefined,
): Promise<
  { ok: true; text: string } | { ok: false; error: InterviewServiceResult }
> {
  const input: InterviewerPromptInput = {
    candidateProfile: session.candidate.member,
    experienceLevel: session.analysis.experienceLevel,
    plannedQuestion: spec,
    curriculumDay: dayTools(spec),
    conversation: session.turns,
  };
  if (priorEvaluation) {
    input.priorEvaluation = priorEvaluation;
  }
  const result = await generateInterviewQuestion(input, client);
  if (!result.ok) {
    return { ok: false, error: llmErrorToHttp(result.error) };
  }
  return { ok: true, text: result.value.text };
}

/** Single-day curriculum context for prompts; safe fallback when the day is missing. */
function dayTools(spec: PlannedQuestion) {
  const day = getDay(spec.curriculumDay);
  return day
    ? { title: day.title, type: day.type, tools: day.tools }
    : { title: spec.curriculumTitle, type: "", tools: [] };
}

function matchesSpec(actual: PlannedQuestion, expected: PlannedQuestion): boolean {
  return (
    actual.questionNumber === expected.questionNumber &&
    actual.curriculumDay === expected.curriculumDay &&
    actual.purpose === expected.purpose
  );
}

function engineErrorToHttp(error: EngineError): InterviewServiceResult {
  switch (error.code) {
    case "session-not-found":
      return notFound(error.message);
    case "session-already-exists":
    case "interview-completed":
    case "invalid-input":
      return badRequest(error.message);
    case "internal":
      return internalError(error.message);
  }
}

function llmErrorToHttp(error: LlmServiceError): InterviewServiceResult {
  switch (error.code) {
    case "not-configured":
      return { status: 503, body: errorBody(error.message) };
    case "network":
    case "timeout":
    case "http":
      return { status: 502, body: errorBody(error.message) };
    case "malformed-json":
    case "invalid-output":
      return internalError(error.message);
  }
}

function notFound(message: string): InterviewServiceResult {
  return { status: 404, body: errorBody(message) };
}

function badRequest(message: string): InterviewServiceResult {
  return { status: 400, body: errorBody(message) };
}

function internalError(message: string): InterviewServiceResult {
  return { status: 500, body: errorBody(message) };
}

function storageError(): InterviewServiceResult {
  return {
    status: 500,
    body: errorBody("interview session store is temporarily unavailable"),
  };
}

function errorBody(message: string): InterviewErrorResponse {
  return { error: message };
}
