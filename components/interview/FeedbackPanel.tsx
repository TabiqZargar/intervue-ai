import type { FinalFeedback } from "@/types/interview";

interface FeedbackPanelProps {
  feedback: FinalFeedback;
  onRestart: () => void;
}

export function FeedbackPanel({ feedback, onRestart }: FeedbackPanelProps) {
  return (
    <section
      aria-labelledby="feedback-heading"
      className="flex w-full flex-col gap-4"
    >
      <div>
        <h1
          id="feedback-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Interview complete
        </h1>
        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Here is the interviewer&apos;s assessment based on your answers.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Summary
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-zinc-900 dark:text-zinc-100">
            {feedback.summary}
          </p>
        </div>

        <FeedbackSection
          title="Strengths"
          items={feedback.strengths}
          marker="+"
          markerClass="text-emerald-600 dark:text-emerald-400"
        />
        <FeedbackSection
          title="Areas to improve"
          items={feedback.gaps}
          marker="!"
          markerClass="text-amber-600 dark:text-amber-400"
        />
        <FeedbackSection
          title="Next steps"
          items={feedback.next}
          marker="→"
          markerClass="text-indigo-600 dark:text-indigo-400"
        />
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="mt-2 min-h-[44px] rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
      >
        Interview another candidate
      </button>
    </section>
  );
}

interface FeedbackSectionProps {
  title: string;
  items: string[];
  marker: string;
  markerClass: string;
}

function FeedbackSection({
  title,
  items,
  marker,
  markerClass,
}: FeedbackSectionProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-zinc-400 dark:text-zinc-500">
          No items recorded.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex gap-3 text-base leading-6 text-zinc-900 dark:text-zinc-100"
            >
              <span
                className={`shrink-0 font-semibold tabular-nums ${markerClass}`}
                aria-hidden="true"
              >
                {marker}
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
