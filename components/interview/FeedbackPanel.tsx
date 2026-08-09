import type { FinalFeedback } from "@/types/interview";

interface FeedbackPanelProps {
  feedback: FinalFeedback;
  onRestart: () => void;
}

export function FeedbackPanel({ feedback, onRestart }: FeedbackPanelProps) {
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

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-5 py-5 dark:border-indigo-900 dark:bg-indigo-950/30">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Overall summary
          </h2>
          <p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-zinc-900 dark:text-zinc-100">
            {feedback.summary}
          </p>
        </div>

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
        <FeedbackSection
          title="Next steps"
          items={feedback.next}
          marker="→"
          markerClass="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400"
        />
      </div>

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
