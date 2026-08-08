import { analyzeCandidate } from "@/lib/candidates";
import { createInterviewPlan } from "@/services/planner";
import { createMemory, type MemoryStore } from "@/services/memory";
import type { Candidate } from "@/types/candidate";
import type { PlannedQuestion, InterviewPlan } from "@/types/planner";
import type { AnswerEvaluation } from "@/types/llm";
import type {
  ConversationTurn,
  ContinueInterviewResult,
  EngineErrorCode,
  InterviewSession,
  StartInterviewResult,
} from "@/types/interview";

/**
 * The Interview Engine owns the interview lifecycle: start, continue, complete,
 * follow-up slotting, and completion. It never generates natural-language
 * question text (that is the LLM service's job); it stores question
 * specifications and candidate answers as conversation turns and returns the
 * next question specification for the LLM service to phrase.
 *
 * The engine is deterministic: for a given candidate and a given stream of
 * `AnswerEvaluation`s the sequence of question specifications is fully
 * determined by analyzeCandidate + createInterviewPlan plus index-based
 * progression. The LLM can never control question count, completion, or
 * storage — it only supplies evaluation signals and question phrasing.
 */

/** Number of planned questions the follow-up slot is reserved at (Q8). */
const FOLLOW_UP_SLOT = 8;

export interface InterviewEngine {
  startInterview(
    candidate: Candidate,
    options?: { sessionId?: string },
  ): StartInterviewResult;
  continueInterview(
    sessionId: string,
    answer: string,
    context?: { evaluation?: AnswerEvaluation },
  ): ContinueInterviewResult;
  /** Records the natural-language text of the currently active question. */
  setCurrentQuestionText(sessionId: string, text: string): boolean;
  getSession(sessionId: string): InterviewSession | undefined;
  deleteSession(sessionId: string): boolean;
}

/**
 * Next state after a candidate answer, computed deterministically from the
 * current session and the (optional) evaluation. Used by the engine to commit
 * the answer and by the interview service to know which question to phrase.
 * Pure: never mutates the session.
 */
export interface ContinueState {
  /** Specification of the next question to ask, or undefined when the interview completes. */
  next: PlannedQuestion | undefined;
  completed: boolean;
  sessionChanges: {
    followUpActive: boolean;
    followUpUsed: boolean;
    followUpSpec: PlannedQuestion | null;
    currentQuestionIndex: number;
    currentQuestionText: string;
  };
}

export function resolveContinueState(
  session: InterviewSession,
  evaluation: AnswerEvaluation | null,
): ContinueState {
  const { followUpActive, followUpUsed, currentQuestionIndex } = session;
  const questions = session.plan.questions;
  const noText: { currentQuestionText: string } = { currentQuestionText: "" };

  if (followUpActive) {
    // The just-answered question was the synthetic follow-up. Continue with the
    // planned question that follows it; Q8 was consumed by the follow-up.
    const done = followUpUsed && currentQuestionIndex >= FOLLOW_UP_SLOT - 1;
    const completed = done || currentQuestionIndex >= questions.length;
    return {
      next: completed ? undefined : questions[currentQuestionIndex],
      completed,
      sessionChanges: {
        followUpActive: false,
        followUpUsed,
        followUpSpec: null,
        currentQuestionIndex,
        ...noText,
      },
    };
  }

  const spec = questions[currentQuestionIndex];
  if (!spec) {
    return {
      next: undefined,
      completed: true,
      sessionChanges: {
        followUpActive: false,
        followUpUsed,
        followUpSpec: null,
        currentQuestionIndex,
        ...noText,
      },
    };
  }

  const canFollowUp =
    evaluation?.followUpRecommended === true &&
    !followUpUsed &&
    spec.questionNumber !== FOLLOW_UP_SLOT;

  if (canFollowUp) {
    // The evaluator recommends probing the answered topic. The synthetic
    // follow-up replaces the planner's reserved follow-up slot (Q8).
    const followUpSpec = buildFollowUpSpec(spec);
    return {
      next: followUpSpec,
      completed: false,
      sessionChanges: {
        followUpActive: true,
        followUpUsed: true,
        followUpSpec,
        currentQuestionIndex: currentQuestionIndex + 1,
        ...noText,
      },
    };
  }

  const index = currentQuestionIndex + 1;
  const completed =
    index >= questions.length || (followUpUsed && index >= FOLLOW_UP_SLOT - 1);
  return {
    next: completed ? undefined : questions[index],
    completed,
    sessionChanges: {
      followUpActive: false,
      followUpUsed,
      followUpSpec: null,
      currentQuestionIndex: index,
      ...noText,
    },
  };
}

export function createInterviewEngine(memory: MemoryStore): InterviewEngine {
  return {
    startInterview(candidate, options) {
      const analysis = analyzeCandidate(candidate);
      const plan = createInterviewPlan(candidate);

      if (!validatePlan(plan)) {
        return error(
          "internal",
          "generated plan does not meet the 8-question / 4-day guarantees",
        );
      }

      const question = plan.questions[0];
      if (!question) {
        return error("internal", "generated plan contains no questions");
      }

      const sessionId = options?.sessionId ?? generateSessionId();
      if (options?.sessionId !== undefined && memory.getSession(sessionId)) {
        return error(
          "session-already-exists",
          `an interview session for "${sessionId}" already exists`,
        );
      }

      const session: InterviewSession = {
        sessionId,
        candidate,
        analysis,
        plan,
        currentQuestionIndex: 0,
        currentQuestionText: "",
        followUpUsed: false,
        followUpActive: false,
        followUpSpec: null,
        turns: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "active",
      };

      memory.createSession(session);

      return {
        ok: true,
        sessionId,
        totalQuestions: plan.totalQuestions,
        question,
      };
    },

    continueInterview(sessionId, answer, context) {
      const session = memory.getSession(sessionId);
      if (!session) {
        return error(
          "session-not-found",
          `no interview session found for "${sessionId}"`,
        );
      }

      if (session.status === "completed") {
        return error(
          "interview-completed",
          `interview session "${sessionId}" is already completed`,
        );
      }

      if (typeof answer !== "string") {
        return error("invalid-input", "candidate answer must be a string");
      }

      const spec = session.followUpActive
        ? session.followUpSpec
        : session.plan.questions[session.currentQuestionIndex];

      if (!spec) {
        const completed = memory.completeSession(
          sessionId,
          new Date().toISOString(),
        );
        return {
          ok: true,
          done: true,
          session: completed as InterviewSession,
        };
      }

      const evaluation = context?.evaluation ?? null;
      const turn = buildTurn(
        spec,
        session.currentQuestionText,
        answer,
        evaluation,
      );
      const updated = memory.appendTurn(sessionId, turn);
      if (!updated) {
        return error(
          "session-not-found",
          `no interview session found for "${sessionId}"`,
        );
      }

      const state = resolveContinueState(updated, evaluation);
      if (state.completed) {
        const completed = memory.completeSession(
          sessionId,
          new Date().toISOString(),
        );
        return {
          ok: true,
          done: true,
          session: completed as InterviewSession,
        };
      }

      memory.updateSession({ ...updated, ...state.sessionChanges });
      return { ok: true, done: false, question: state.next as PlannedQuestion };
    },

    setCurrentQuestionText(sessionId, text) {
      const session = memory.getSession(sessionId);
      if (!session) {
        return false;
      }
      memory.updateSession({ ...session, currentQuestionText: text });
      return true;
    },

    getSession(sessionId) {
      return memory.getSession(sessionId);
    },

    deleteSession(sessionId) {
      return memory.deleteSession(sessionId);
    },
  };
}

function buildTurn(
  spec: PlannedQuestion,
  questionText: string,
  answer: string,
  evaluation: AnswerEvaluation | null,
): ConversationTurn {
  return {
    questionNumber: spec.questionNumber,
    curriculumDay: spec.curriculumDay,
    curriculumTitle: spec.curriculumTitle,
    objective: spec.objective,
    purpose: spec.purpose,
    difficulty: spec.difficulty,
    questionText,
    answer,
    evaluation,
    answeredAt: new Date().toISOString(),
  };
}

/** A synthetic question that probes the topic of the answer that triggered it. */
function buildFollowUpSpec(trigger: PlannedQuestion): PlannedQuestion {
  return {
    questionNumber: FOLLOW_UP_SLOT,
    curriculumDay: trigger.curriculumDay,
    curriculumTitle: trigger.curriculumTitle,
    objective: trigger.objective,
    purpose: "follow-up",
    difficulty: trigger.difficulty,
  };
}

/** Defensive check backing the "valid session" guarantee. */
function validatePlan(plan: InterviewPlan): boolean {
  if (plan.questions.length < 8) {
    return false;
  }
  const distinctDays = new Set(
    plan.questions.map((question) => question.curriculumDay),
  );
  return distinctDays.size >= 4;
}

function error(
  code: EngineErrorCode,
  message: string,
): { ok: false; error: { code: EngineErrorCode; message: string } } {
  return { ok: false, error: { code, message } };
}

function generateSessionId(): string {
  return `session-${crypto.randomUUID()}`;
}

/**
 * Default in-memory engine instance for server-side use. A fresh engine (with
 * its own memory) can be created via createInterviewEngine(createMemory()).
 */
export const interviewEngine = createInterviewEngine(createMemory());
