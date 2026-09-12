import type { ReactNode } from "react";
import { ArrowRight } from "@/components/ui/icons";
import { buttonPrimary } from "@/components/ui/styles";
import { cn } from "@/lib/utils";
import type {
  DetailedStatistics,
  FinalFeedback,
  TopicPerformance,
} from "@/types/interview";
import type { QuestionDifficulty } from "@/types/planner";

interface FeedbackPanelProps {
  feedback: FinalFeedback;
  statistics: DetailedStatistics;
  onRestart: () => void;
}

export function FeedbackPanel({
  feedback,
  statistics,
  onRestart,
}: FeedbackPanelProps) {
  const { byDifficulty } = statistics;
  const chips = [
    `${statistics.answeredQuestions} of ${statistics.totalQuestions} answered`,
    statistics.totalTimeLabel,
    `Avg ${formatScore(statistics.overallScore)} / 5`,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <section
      aria-labelledby="feedback-heading"
      className="flex w-full animate-fade-in flex-col"
    >
      <div>
        <p className="kicker text-indigo-600 dark:text-indigo-400">
          Assessment
        </p>
        <h1
          id="feedback-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          Interview complete
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-7 text-ink-2">
          Here is the interviewer&apos;s assessment based on your answers.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2"
          >
            <span
              className="h-1 w-1 rounded-full bg-indigo-500/70"
              aria-hidden="true"
            />
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[15.5rem_1fr]">
        <ScoreCard statistics={statistics} />
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.05] px-5 py-6 sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(111,95,242,0.16),transparent)]"
          />
          <h2 className="kicker text-indigo-600 dark:text-indigo-300">
            Overall summary
          </h2>
          <p className="mt-3 max-w-2xl whitespace-pre-wrap break-words text-base leading-7 text-ink">
            {feedback.summary}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <SubScoresCard statistics={statistics} />
        <div className="rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
          <SectionTitle>By difficulty</SectionTitle>
          <div className="mt-5 flex flex-col gap-4">
            {DIFFICULTIES.map((difficulty) => {
              const performance = byDifficulty[difficulty];
              return (
                <div key={difficulty} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm capitalize text-ink-2">
                    {difficulty}
                  </span>
                  <Bar score={performance.averageScore} className="flex-1" />
                  <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
                    {formatScore(performance.averageScore)}
                  </span>
                  <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-3">
                    {performance.questionCount}×
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {statistics.byTopic.length > 0 ? (
        <TopicPerformanceCard topics={statistics.byTopic} />
      ) : null}

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <FeedbackSection
          title="Strengths"
          items={feedback.strengths}
          marker="+"
          markerClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        />
        <FeedbackSection
          title="Areas to improve"
          items={feedback.gaps}
          marker="!"
          markerClass="bg-amber-500/15 text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="mt-5">
        <FeedbackSection
          title="Next steps"
          items={feedback.next}
          marker="→"
          markerClass="bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
        />
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRestart}
          className={`${buttonPrimary} group w-full px-7 sm:w-auto`}
        >
          Interview another candidate
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
        <p className="text-xs text-ink-3 sm:max-w-[17rem]">
          Start a fresh session with a different candidate profile.
        </p>
      </div>
    </section>
  );
}

const DIFFICULTIES: readonly QuestionDifficulty[] = ["easy", "medium", "hard"];

export function ScoreCard({ statistics }: { statistics: DetailedStatistics }) {
  const { percentage, overall, answeredQuestions, totalQuestions } = statistics;
  const level = overall.charAt(0).toUpperCase() + overall.slice(1);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-7">
      <ScoreRing percentage={percentage} level={level} />
      <div className="mt-3 flex flex-col items-center gap-0.5">
        <p className="text-sm leading-6 tabular-nums text-ink-2">
          {answeredQuestions} of {totalQuestions} questions answered
        </p>
        <p className="text-[11px] uppercase tracking-[0.12em] text-ink-3">
          Average {formatScore(statistics.overallScore)} / 5
        </p>
      </div>
      <ScoreProgression scores={statistics.scoreProgression} />
    </div>
  );
}

function ScoreRing({
  percentage,
  level,
}: {
  percentage: number;
  level: string;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const stroke = ringStrokeClass(percentage);

  return (
    <div
      className="relative h-36 w-36"
      role="img"
      aria-label={`${percentage}% overall, ${level}`}
    >
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-ink-3/15"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-700 ease-out ${stroke}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums text-ink">
          {percentage}%
        </span>
        <span className="mt-0.5 text-xs capitalize text-ink-3">{level}</span>
      </div>
    </div>
  );
}

function ScoreProgression({ scores }: { scores: number[] }) {
  if (scores.length === 0) {
    return null;
  }
  return (
    <div className="mt-5 flex w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="kicker text-ink-3">Per question</p>
        <p className="text-[11px] tabular-nums text-ink-3">
          {scores.length} score{scores.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex h-12 items-end gap-1 rounded-xl bg-ink-3/[0.07] px-2.5 pb-1.5 pt-2.5">
        {scores.map((score, index) => (
          <div
            key={index}
            className="flex-1 rounded-md transition-all duration-500"
            style={{
              height: `${(score / 5) * 100}%`,
              backgroundColor: scoreBarColor(score),
            }}
            title={`Question ${index + 1}: ${score}/5`}
          />
        ))}
      </div>
    </div>
  );
}

export function SubScoresCard({
  statistics,
}: {
  statistics: DetailedStatistics;
}) {
  const { averageSubScores: sub } = statistics;
  const rows: Array<{ label: string; value: number }> = [
    { label: "Correctness", value: sub.correctness },
    { label: "Depth", value: sub.depth },
    { label: "Reasoning", value: sub.reasoning },
    { label: "Communication", value: sub.communication },
  ];

  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
      <SectionTitle>Sub-scores (avg)</SectionTitle>
      <div className="mt-5 flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-ink-2">{row.label}</span>
              <span className="font-semibold tabular-nums text-ink">
                {formatScore(row.value)}
              </span>
            </div>
            <Bar score={row.value} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicPerformanceCard({ topics }: { topics: TopicPerformance[] }) {
  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>Performance by topic</SectionTitle>
        <p className="text-[11px] leading-5 text-ink-3">
          Best on{" "}
          <span className="font-medium text-ink-2">
            {qualifiedName(topics[0]?.title)}
          </span>{" "}
          · Needs work on{" "}
          <span className="font-medium text-ink-2">
            {qualifiedName(topics[topics.length - 1]?.title)}
          </span>
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {topics.map((topic) => (
          <div key={topic.day}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-2">{topic.title}</span>
              <span className="shrink-0 font-semibold tabular-nums text-ink">
                {formatScore(topic.averageScore)}
                <span className="ml-1.5 text-xs font-normal text-ink-3">
                  {topic.questionCount}×
                </span>
              </span>
            </div>
            <Bar score={topic.averageScore} />
          </div>
        ))}
      </div>
    </div>
  );
}

function qualifiedName(title: string | undefined | null): string {
  return title ?? "—";
}

interface FeedbackSectionProps {
  title: string;
  items: string[];
  marker: string;
  markerClass: string;
}

export function FeedbackSection({
  title,
  items,
  marker,
  markerClass,
}: FeedbackSectionProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>{title}</SectionTitle>
        <span className="rounded-full bg-ink-3/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-ink-3">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-ink-3">No items recorded.</p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex gap-3 border-b border-line py-3 text-[15px] leading-6 text-ink first:pt-0 last:border-0 last:pb-0"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${markerClass}`}
                aria-hidden="true"
              >
                {marker}
              </span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="kicker text-ink-3">{children}</h2>;
}

function ringStrokeClass(percentage: number): string {
  if (percentage >= 75) return "stroke-emerald-500 dark:stroke-emerald-400";
  if (percentage >= 60) return "stroke-indigo-500 dark:stroke-indigo-400";
  if (percentage >= 40) return "stroke-amber-500 dark:stroke-amber-400";
  return "stroke-rose-500 dark:stroke-rose-400";
}

function scoreBarColor(score: number): string {
  if (score >= 4) return "#10b981";
  if (score >= 3) return "#6f5ff2";
  if (score >= 2) return "#f59e0b";
  return "#f43f5e";
}

function Bar({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-ink-3/15",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${(score / 5) * 100}%`,
          backgroundColor: scoreBarColor(score),
        }}
      />
    </div>
  );
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}