import type { AnswerEvaluation } from "@/types/llm";
import type { FinalFeedback, InterviewSession } from "@/types/interview";

/**
 * Deterministic final-feedback aggregation. Built entirely from the stored
 * per-answer evaluations (no extra LLM call): a summary from the average
 * score, aggregate strengths, aggregate gaps, and actionable next steps from
 * the weakest topics.
 */

const MAX_STRENGTHS = 4;
const MAX_GAPS = 4;
const MAX_NEXT = 3;

export function buildFinalFeedback(session: InterviewSession): FinalFeedback {
  const evaluations = session.turns
    .map((turn) => ({ turn, evaluation: turn.evaluation }))
    .filter(
      (entry): entry is { turn: (typeof session.turns)[number]; evaluation: AnswerEvaluation } =>
        entry.evaluation !== null,
    );

  if (evaluations.length === 0) {
    return {
      summary: "The interview completed without any evaluable answers.",
      strengths: [],
      gaps: [],
      next: [],
    };
  }

  const averageScore =
    evaluations.reduce((sum, entry) => sum + entry.evaluation.score, 0) /
    evaluations.length;

  const weakest = evaluations
    .filter((entry) => entry.evaluation.score <= 2)
    .map((entry) => entry.turn.curriculumTitle);

  const summary = buildSummary(averageScore, evaluations.length);

  return {
    summary,
    strengths: uniqueTop(
      evaluations.flatMap((entry) => entry.evaluation.strengths),
      MAX_STRENGTHS,
    ),
    gaps: uniqueTop(
      evaluations.flatMap((entry) => entry.evaluation.gaps),
      MAX_GAPS,
    ),
    next: uniqueTop(weakest, MAX_NEXT).map((topic) => `Revisit ${topic}`),
  };
}

function buildSummary(averageScore: number, answerCount: number): string {
  const rounded = Math.round(averageScore * 10) / 10;
  const verdict =
    rounded >= 4 ? "strong" : rounded >= 3 ? "adequate" : "weak";
  return `You answered ${answerCount} interview question${answerCount === 1 ? "" : "s"} with an average score of ${rounded} out of 5 (overall: ${verdict}).`;
}

function uniqueTop(items: readonly string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed === "" || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}
