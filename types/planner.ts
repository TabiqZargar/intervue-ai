/**
 * Deterministic interview planning types.
 * The planner decides WHAT to ask (day, objective, purpose, difficulty);
 * the LLM service decides HOW to phrase it in a later milestone.
 */
export type QuestionPurpose = "core" | "probe" | "follow-up" | "stretch";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface PlannedQuestion {
  questionNumber: number;
  curriculumDay: number;
  curriculumTitle: string;
  objective: string;
  purpose: QuestionPurpose;
  difficulty: QuestionDifficulty;
}

export interface InterviewPlan {
  totalQuestions: number;
  requiredCurriculumDays: number;
  coveredDays: number[];
  questions: PlannedQuestion[];
}
