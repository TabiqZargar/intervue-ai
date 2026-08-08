import { analyzeCandidate } from "@/lib/candidates";
import { createInterviewPlan } from "@/services/planner";
import { createMemory, type MemoryStore } from "@/services/memory";
import type { Candidate } from "@/types/candidate";
import type { PlannedQuestion, InterviewPlan } from "@/types/planner";
import type {
  ConversationTurn,
  ContinueInterviewResult,
  EngineErrorCode,
  InterviewSession,
  StartInterviewResult,
} from "@/types/interview";

/**
 * The Interview Engine owns the interview lifecycle:
 * start, continue, complete. It never generates natural-language question
 * text (that is the future LLM service's job); it returns PlannedQuestion
 * specifications and stores candidate answers as conversation turns.
 *
 * The engine is deterministic: for a given candidate the sequence of question
 * specifications is fully determined by analyzeCandidate + createInterviewPlan
 * plus index-based progression.
 */
export interface InterviewEngine {
  startInterview(candidate: Candidate): StartInterviewResult;
  continueInterview(sessionId: string, answer: string): ContinueInterviewResult;
  getSession(sessionId: string): InterviewSession | undefined;
  deleteSession(sessionId: string): boolean;
}

export function createInterviewEngine(memory: MemoryStore): InterviewEngine {
  return {
    startInterview(candidate) {
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

      const session: InterviewSession = {
        sessionId: generateSessionId(),
        candidate,
        analysis,
        plan,
        currentQuestionIndex: 0,
        turns: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "active",
      };

      memory.createSession(session);

      return {
        ok: true,
        sessionId: session.sessionId,
        totalQuestions: plan.totalQuestions,
        question,
      };
    },

    continueInterview(sessionId, answer) {
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

      const question = session.plan.questions[session.currentQuestionIndex];
      if (!question) {
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

      const turn = buildTurn(question, answer);
      const updated = memory.appendTurn(sessionId, turn);
      if (!updated) {
        return error(
          "session-not-found",
          `no interview session found for "${sessionId}"`,
        );
      }

      const nextIndex = updated.currentQuestionIndex + 1;
      const next = updated.plan.questions[nextIndex];
      if (!next) {
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

      memory.updateSession({ ...updated, currentQuestionIndex: nextIndex });
      return { ok: true, done: false, question: next };
    },

    getSession(sessionId) {
      return memory.getSession(sessionId);
    },

    deleteSession(sessionId) {
      return memory.deleteSession(sessionId);
    },
  };
}

function buildTurn(question: PlannedQuestion, answer: string): ConversationTurn {
  return {
    questionNumber: question.questionNumber,
    curriculumDay: question.curriculumDay,
    curriculumTitle: question.curriculumTitle,
    objective: question.objective,
    purpose: question.purpose,
    difficulty: question.difficulty,
    answer,
    answeredAt: new Date().toISOString(),
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
