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

  return (
    <section
      aria-labelledby="feedback-heading"
      className="flex w-full flex-col gap-5"
    >
      <div>
        <h1
          id="feedback-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
        >
          Interview complete
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Here is the interviewer&apos;s assessment based on your answers.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <ScoreCard statistics={statistics} />
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-5 py-5 dark:border-indigo-900 dark:bg-indigo-950/30">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Overall summary
          </h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-zinc-900 dark:text-zinc-100">
            {feedback.summary}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SubScoresCard statistics={statistics} />
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            By difficulty
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {DIFFICULTIES.map((difficulty) => {
              const performance = byDifficulty[difficulty];
              return (
                <div key={difficulty} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm capitalize text-zinc-600 dark:text-zinc-300">
                    {difficulty}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(performance.averageScore / 5) * 100}%`,
                        backgroundColor: scoreBarColor(performance.averageScore),
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatScore(performance.averageScore)}
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <FeedbackSection
          title="Strengths"
          items={feedback.strengths}
          marker="+"
          markerClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <FeedbackSection
          title="Areas to improve"
          items={feedback.gaps}
          marker="!"
          markerClass="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
        />
      </div>

      <FeedbackSection
        title="Next steps"
        items={feedback.next}
        marker="→"
        markerClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
      />

      <button
        type="button"
        onClick={onRestart}
        className="mt-1 min-h-[44px] w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 sm:w-auto"
      >
        Interview another candidate
      </button>
    </section>
  );
}

const DIFFICULTIES: readonly QuestionDifficulty[] = ["easy", "medium", "hard"];

export function ScoreCard({ statistics }: { statistics: DetailedStatistics }) {
  const { percentage, overall, answeredQuestions, totalQuestions } = statistics;
  const level = overall.charAt(0).toUpperCase() + overall.slice(1);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-900">
      <ScoreRing percentage={percentage} level={level} />
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {answeredQuestions} of {totalQuestions} questions answered
        </p>
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Average {formatScore(statistics.overallScore)} / 5
        </p>
      </div>
      <ScoreProgression scores={statistics.scoreProgression} />
    </div>
  );
}

function ScoreRing({ percentage, level }: { percentage: number; level: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const stroke = ringStrokeClass(percentage);

  return (
    <div className="relative h-36 w-36" role="img" aria-label={`${percentage}% overall, ${level}`}>
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-zinc-200 dark:stroke-zinc-800"
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
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
          {percentage}%
        </span>
        <span className="mt-0.5 text-xs capitalize text-zinc-500 dark:text-zinc-400">
          {level}
        </span>
      </div>
    </div>
  );
}

function ScoreProgression({ scores }: { scores: number[] }) {
  if (scores.length === 0) {
    return null;
  }
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Per question
        </p>
        <p className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
          {scores.length} score{scores.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex h-2.5 items-end gap-1">
        {scores.map((score, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm"
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

export function SubScoresCard({ statistics }: { statistics: DetailedStatistics }) {
  const { averageSubScores: sub } = statistics;
  const rows: Array<{ label: string; value: number }> = [
    { label: "Correctness", value: sub.correctness },
    { label: "Depth", value: sub.depth },
    { label: "Reasoning", value: sub.reasoning },
    { label: "Communication", value: sub.communication },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Sub-scores (avg)
      </h2>
      <div className="mt-4 flex flex-col gap-3.5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatScore(row.value)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(row.value / 5) * 100}%`,
                  backgroundColor: scoreBarColor(row.value),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicPerformanceCard({ topics }: { topics: TopicPerformance[] }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Performance by topic
        </h2>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Best on {qualifiedName(topics[0]?.title)} · Needs work on{" "}
          {qualifiedName(topics[topics.length - 1]?.title)}
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {topics.map((topic) => (
          <div key={topic.day}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-200">
                {topic.title}
              </span>
              <span className="ml-3 shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatScore(topic.averageScore)}
                <span className="ml-1.5 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                  {topic.questionCount}×
                </span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(topic.averageScore / 5) * 100}%`,
                  backgroundColor: scoreBarColor(topic.averageScore),
                }}
              />
            </div>
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
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-zinc-400 dark:text-zinc-500">
          No items recorded.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex gap-3 border-b border-zinc-100 py-2.5 text-base leading-6 text-zinc-900 last:border-b-0 last:pb-0 first:pt-0 dark:border-zinc-800 dark:text-zinc-100"
            >
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${markerClass}`}
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

function ringStrokeClass(percentage: number): string {
  if (percentage >= 75) return "stroke-emerald-500 dark:stroke-emerald-400";
  if (percentage >= 60) return "stroke-indigo-500 dark:stroke-indigo-400";
  if (percentage >= 40) return "stroke-amber-500 dark:stroke-amber-400";
  return "stroke-rose-500 dark:stroke-rose-400";
}

function scoreBarColor(score: number): string {
  if (score >= 4) return "#10b981";
  if (score >= 3) return "#6366f1";
  if (score >= 2) return "#f59e0b";
  return "#f43f5e";
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}