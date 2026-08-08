/**
 * Domain types for the interview runtime.
 * The planner decides WHAT to ask; the engine + memory run the interview
 * lifecycle; the LLM service and evaluator consume these values to phrase
 * questions and assess answers (see types/llm.ts).
 */

import type { Candidate, CandidateAnalysis } from "@/types/candidate";
import type {
  InterviewPlan,
  PlannedQuestion,
  QuestionDifficulty,
  QuestionPurpose,
} from "@/types/planner";

export type MessageRole = "assistant" | "user";

/** A natural-language message, produced by the future LLM service / UI. */
export interface InterviewMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export type InterviewStatus = "active" | "completed";

/**
 * One answered planned question. The engine does not generate natural-language
 * question text yet, so a turn preserves the full question specification the
 * future LLM service can phrase a question from.
 */
export interface ConversationTurn {
  questionNumber: number;
  curriculumDay: number;
  curriculumTitle: string;
  objective: string;
  purpose: QuestionPurpose;
  difficulty: QuestionDifficulty;
  /** Candidate answer as submitted. Empty strings are stored safely. */
  answer: string;
  answeredAt: string;
}

/**
 * Mutable runtime state for a single interview, held in the in-memory session
 * store. Enough to continue an interview across requests.
 */
export interface InterviewSession {
  sessionId: string;
  candidate: Candidate;
  analysis: CandidateAnalysis;
  plan: InterviewPlan;
  /** Index of the next question to ask; equals `plan.questions.length` when none remain. */
  currentQuestionIndex: number;
  /** Answered turns in chronological order; the reconstructable conversation. */
  turns: ConversationTurn[];
  startedAt: string;
  completedAt: string | null;
  status: InterviewStatus;
}

export type EngineErrorCode =
  | "session-not-found"
  | "interview-completed"
  | "invalid-input"
  | "internal";

export interface EngineError {
  code: EngineErrorCode;
  message: string;
}

/**
 * Typed outcomes the future API layer can translate into HTTP responses.
 */
export type StartInterviewResult =
  | {
      ok: true;
      sessionId: string;
      totalQuestions: number;
      /** First planned question specification. */
      question: PlannedQuestion;
    }
  | { ok: false; error: EngineError };

export type ContinueInterviewResult =
  /** Interview continues: a new question specification is ready. */
  | { ok: true; done: false; question: PlannedQuestion }
  /** Every planned question has been answered: the session is completed. */
  | { ok: true; done: true; session: InterviewSession }
  | { ok: false; error: EngineError };

/** Future evaluator output; implemented in a later milestone. */
export interface QuestionFeedback {
  questionNumber: number;
  score: number;
  comment: string;
}

export interface InterviewFeedback {
  candidateId: string;
  overallScore: number;
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  perQuestion: QuestionFeedback[];
}
