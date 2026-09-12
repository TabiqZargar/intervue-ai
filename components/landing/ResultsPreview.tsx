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
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-24"
    >
      <div className="max-w-2xl">
        <p className="kicker text-indigo-600 dark:text-indigo-400">Report</p>
        <h2
          id="results-preview-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          See the result
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-2">
          Every interview ends with a score, sub-score breakdown, topic
          analysis, strengths, gaps, and next steps. This is an illustrative
          example.
        </p>
      </div>

      <div className="mt-12 rounded-3xl border border-line bg-surface-2/60 p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker text-ink-3">Sample interview report</p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-amber-400"
              aria-hidden="true"
            />
            Example
          </span>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[15.5rem_1fr]">
          <ScoreCard statistics={exampleStatistics} />
          <div className="grid gap-5 sm:grid-cols-2">
            <SubScoresCard statistics={exampleStatistics} />
            <FeedbackSection
              title="Strengths"
              items={exampleFeedback.strengths}
              marker="+"
              markerClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}