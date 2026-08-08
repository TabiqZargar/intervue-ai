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
import type { AnswerEvaluation } from "@/types/llm";

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
 * One answered planned question. A turn preserves the full question
 * specification, the natural-language question that was actually shown to the
 * candidate, the candidate's answer, and the evaluation of that answer.
 */
export interface ConversationTurn {
  questionNumber: number;
  curriculumDay: number;
  curriculumTitle: string;
  objective: string;
  purpose: QuestionPurpose;
  difficulty: QuestionDifficulty;
  /** Natural-language question text shown to the candidate. */
  questionText: string;
  /** Candidate answer as submitted. Empty strings are stored safely. */
  answer: string;
  /** Per-answer assessment; null when the answer was never evaluated. */
  evaluation: AnswerEvaluation | null;
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
  /** Index of the next planned question to ask; equals `plan.questions.length` when none remain. */
  currentQuestionIndex: number;
  /** Natural-language text of the currently active question (planned or follow-up). */
  currentQuestionText: string;
  /** True once an answer-dependent follow-up has replaced the planned follow-up slot (Q8). */
  followUpUsed: boolean;
  /** True while the synthetic answer-dependent follow-up is the active question. */
  followUpActive: boolean;
  /** The synthetic follow-up specification when `followUpActive` is true. */
  followUpSpec: PlannedQuestion | null;
  /** Answered turns in chronological order; the reconstructable conversation. */
  turns: ConversationTurn[];
  startedAt: string;
  completedAt: string | null;
  status: InterviewStatus;
}

export type EngineErrorCode =
  | "session-not-found"
  | "session-already-exists"
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

/** Final aggregate feedback returned when the interview completes. */
export interface FinalFeedback {
  summary: string;
  strengths: string[];
  gaps: string[];
  next: string[];
}

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
