import { ScoreCard } from "@/components/interview/FeedbackPanel";
import { SubScoresCard } from "@/components/interview/FeedbackPanel";
import { FeedbackSection } from "@/components/interview/FeedbackPanel";
import type {
  DetailedStatistics,
  FinalFeedback,
} from "@/types/interview";

/**
 * Static example of the post-interview report for the landing page.
 *
 * The visual cards ARE the real feedback components, so the example never
 * drifts from production. The data is illustrative and is labelled as such —
 * it is not a live result.
 */
const exampleStatistics: DetailedStatistics = {
  totalQuestions: 8,
  answeredQuestions: 6,
  overallScore: 3.5,
  percentage: 70,
  overall: "adequate",
  scoreProgression: [4, 3, 4, 5, 3, 2],
  averageSubScores: {
    correctness: 4,
    depth: 3,
    reasoning: 3,
    communication: 4,
  },
  byDifficulty: {
    easy: { averageScore: 4, questionCount: 2 },
    medium: { averageScore: 3.4, questionCount: 3 },
    hard: { averageScore: 3, questionCount: 1 },
  },
  byTopic: [
    {
      day: 2,
      title: "Prompt Engineering",
      averageScore: 3.5,
      questionCount: 2,
    },
    {
      day: 3,
      title: "Retrieval Augmented Generation",
      averageScore: 2.5,
      questionCount: 2,
    },
  ],
  strongestTopic: {
    day: 2,
    title: "Prompt Engineering",
    averageScore: 3.5,
    questionCount: 2,
  },
  weakestTopic: {
    day: 3,
    title: "Retrieval Augmented Generation",
    averageScore: 2.5,
    questionCount: 2,
  },
  totalTimeSeconds: 452,
  totalTimeLabel: "7m 32s",
  averageTimePerQuestionSeconds: 75,
};

const exampleFeedback: FinalFeedback = {
  summary:
    "You answered 6 interview questions with an average score of 3.5 out of 5 (overall: adequate).",
  strengths: [
    "Clear, structured explanations of core transformer concepts.",
    "Correct use of function calling and tool-use patterns.",
    "Good command of the framework data pipeline APIs.",
  ],
  gaps: ["Depth on retrieval-quality metrics was shallow in places."],
  next: [
    "Review Retrieval Augmented Generation — practice designing offline quality metrics.",
  ],
};

export function ResultsPreview() {
  return (
    <section
      aria-labelledby="results-preview-heading"
      className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20"
    >
      <div className="max-w-2xl">
        <h2
          id="results-preview-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
        >
          See the result
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7 dark:text-zinc-400">
          Every interview ends with a score, sub-score breakdown, topic
          analysis, strengths, gaps, and next steps. This is an illustrative
          example.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-6 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Sample interview report
          </p>
          <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            Example
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <ScoreCard statistics={exampleStatistics} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SubScoresCard statistics={exampleStatistics} />
            <FeedbackSection
              title="Strengths"
              items={exampleFeedback.strengths}
              marker="+"
              markerClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}