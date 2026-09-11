/**
 * Types for the configurable runtime LLM service and the answer evaluator.
 * The provider is chosen at deployment via environment variables; no provider
 * or model is hard-coded here.
 */

import type { Member, ExperienceLevel } from "@/types/candidate";
import type { CurriculumDay } from "@/types/curriculum";
import type { ConversationTurn } from "@/types/interview";
import type { PlannedQuestion } from "@/types/planner";

export type LlmRole = "system" | "user" | "assistant";

export interface LlmChatMessage {
  role: LlmRole;
  content: string;
}

/** Resolved runtime model configuration. */
export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export type LlmConfigResult =
  | { ok: true; config: LlmConfig }
  | { ok: false; error: LlmServiceError };

export type LlmServiceErrorCode =
  | "not-configured"
  | "network"
  | "timeout"
  | "http"
  | "malformed-json"
  | "invalid-output";

export interface LlmServiceError {
  code: LlmServiceErrorCode;
  /** Safe to surface to a user; never includes secrets or stack traces. */
  message: string;
}

export type LlmCallResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: LlmServiceError };

/** Which interview step an LLM call serves; used for safe diagnostic logging. */
export type LlmOperation =
  | "question_generation"
  | "evaluation"
  | "evaluate_and_generate";

/** Natural-language question produced by the interviewer LLM. */
export interface GeneratedQuestion {
  questionNumber: number;
  text: string;
}

export type AnswerLevel = "strong" | "adequate" | "weak";

export type SubScore = 1 | 2 | 3 | 4 | 5;

/**
 * Structured, validated output of the evaluator LLM for one answer.
 */
export interface AnswerEvaluation {
  overall: AnswerLevel;
  score: SubScore;
  correctness: SubScore;
  depth: SubScore;
  reasoning: SubScore;
  communication: SubScore;
  strengths: string[];
  gaps: string[];
  followUpRecommended: boolean;
  followUpReason: string;
}

/**
 * Input for natural-language question generation. Contains only the context
 * actually required — never the full curriculum or candidate dataset.
 */
export interface InterviewerPromptInput {
  candidateProfile: Member;
  experienceLevel: ExperienceLevel;
  plannedQuestion: PlannedQuestion;
  /** Single-day curriculum context (tools/type) — never the whole curriculum. */
  curriculumDay: Pick<CurriculumDay, "title" | "type" | "tools">;
  /** Bounded recent conversation window; the caller limits the size. */
  conversation: ConversationTurn[];
  /** Present when phrasing an answer-dependent follow-up question. */
  priorEvaluation?: AnswerEvaluation;
}

/**
 * Input for answer evaluation. The objective being judged comes from the
 * planned question; only single-day curriculum context is supplied.
 */
export interface EvaluatorPromptInput {
  plannedQuestion: PlannedQuestion;
  generatedQuestion: GeneratedQuestion;
  candidateAnswer: string;
  /** Single-day curriculum context (tools) — never the whole curriculum. */
  curriculumDay: Pick<CurriculumDay, "title" | "tools">;
  /** Bounded recent conversation window; the caller limits the size. */
  conversation: ConversationTurn[];
}

/**
 * Output of a single combined LLM call that evaluates the candidate's answer
 * AND phrases the next question. This halves the number of provider
 * round-trips per answer (one call instead of two), reducing the perceived
 * evaluation latency without changing the API contract.
 */
export interface CombinedEvaluationResult {
  evaluation: AnswerEvaluation;
  /**
   * Natural-language text of the follow-up question when the evaluator
   * recommends one; null otherwise. The deterministic engine decides which
   * text to use based on the evaluation and session state.
   */
  followUpQuestionText: string | null;
  /** Natural-language text of the next planned question. */
  nextQuestionText: string;
}

/**
 * Input for the combined evaluate-and-generate call: everything the evaluator
 * needs (the question just asked, the answer, the judged objective) and
 * everything the interviewer needs to phrase the next planned question.
 */
export interface CombinedPromptInput {
  candidateProfile: Member;
  experienceLevel: ExperienceLevel;
  /** The question the candidate just answered (its text). */
  generatedQuestion: GeneratedQuestion;
  /**
   * The planned spec of the question just answered. Its curriculum objective
   * is what the evaluator judges the answer against.
   */
  evalPlannedQuestion: PlannedQuestion;
  /** The candidate's answer text. */
  candidateAnswer: string;
  /** Single-day curriculum context for the objective being judged. */
  evalCurriculumDay: Pick<CurriculumDay, "title" | "tools">;
  /** The next planned question specification to phrase. */
  plannedQuestion: PlannedQuestion;
  /** Single-day curriculum context for the next planned question. */
  nextCurriculumDay: Pick<CurriculumDay, "title" | "type" | "tools">;
  /** Bounded recent conversation window; the caller limits the size. */
  conversation: ConversationTurn[];
}
