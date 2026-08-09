import type { AnswerEvaluation } from "@/types/llm";
import type {
  ConversationTurn,
  FinalFeedback,
  InterviewSession,
} from "@/types/interview";

/**
 * Deterministic final-feedback aggregation. Built entirely from the stored
 * per-answer evaluations (no extra LLM call): a summary from the average
 * score, aggregate strengths, aggregate gaps, and actionable next steps
 * derived from the weakest answers' evaluator-identified gaps and curriculum
 * objectives.
 */

const MAX_STRENGTHS = 4;
const MAX_GAPS = 4;
const MAX_NEXT = 3;
/** Answers at or below this score can produce an actionable next step. */
const GAP_SCORE_THRESHOLD = 3;

interface EvaluatedTurn {
  turn: ConversationTurn;
  evaluation: AnswerEvaluation;
}

export function buildFinalFeedback(session: InterviewSession): FinalFeedback {
  const evaluations = evaluatedTurns(session);

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

  return {
    summary: buildSummary(averageScore, evaluations.length),
    strengths: uniqueTop(
      evaluations.flatMap((entry) => entry.evaluation.strengths),
      MAX_STRENGTHS,
    ),
    gaps: uniqueTop(
      evaluations.flatMap((entry) => entry.evaluation.gaps),
      MAX_GAPS,
    ),
    next: buildNextStepRecommendations(evaluations),
  };
}

/**
 * Actionable, deduplicated next steps. Weakest answers first so the most
 * important gaps surface before the cap. Recommendations are grounded in the
 * evaluator's own gap phrases and the planned curriculum objective — nothing
 * is invented. Returns an empty array when no meaningful gaps exist.
 */
export function buildNextStepRecommendations(
  evaluations: readonly EvaluatedTurn[],
): string[] {
  const candidates = evaluations
    .slice()
    .sort(
      (a, b) =>
        a.evaluation.score - b.evaluation.score ||
        a.turn.questionNumber - b.turn.questionNumber,
    );

  const seen = new Set<string>();
  const recommendations: string[] = [];

  for (const entry of candidates) {
    const recommendation = nextStepFor(entry);
    if (!recommendation) {
      continue;
    }
    const key = recommendation.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    recommendations.push(recommendation);
    if (recommendations.length >= MAX_NEXT) {
      break;
    }
  }

  return recommendations;
}

function nextStepFor(entry: EvaluatedTurn): string | null {
  const { turn, evaluation } = entry;

  if (
    evaluation.score <= GAP_SCORE_THRESHOLD &&
    evaluation.gaps.length > 0
  ) {
    const gap = firstNonEmpty(evaluation.gaps);
    if (gap) {
      return `Review ${turn.curriculumTitle} — ${stripTrailingPeriod(gap)}.`;
    }
  }

  // A very weak answer with no evaluator-written gaps: fall back to the
  // planned curriculum objective so the recommendation stays grounded and
  // actionable. A weak score is itself an evaluator-identified weakness.
  if (evaluation.score <= 2 && turn.objective.trim() !== "") {
    return `Practice ${lowercaseFirst(stripTrailingPeriod(turn.objective))} in ${turn.curriculumTitle}.`;
  }

  return null;
}

/** Removes trailing sentence-ending punctuation so an appended "." never doubles. */
function stripTrailingPeriod(text: string): string {
  return text.replace(/\.+$/, "").trim();
}

function evaluatedTurns(session: InterviewSession): EvaluatedTurn[] {
  return session.turns
    .map((turn) => ({ turn, evaluation: turn.evaluation }))
    .filter(
      (
        entry,
      ): entry is {
        turn: (typeof session.turns)[number];
        evaluation: AnswerEvaluation;
      } => entry.evaluation !== null,
    );
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

function firstNonEmpty(items: readonly string[]): string | null {
  for (const item of items) {
    const trimmed = item.trim();
    if (trimmed !== "") {
      return trimmed;
    }
  }
  return null;
}

function lowercaseFirst(text: string): string {
  return text.length === 0 ? text : text.charAt(0).toLowerCase() + text.slice(1);
}
