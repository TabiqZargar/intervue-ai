import type { ChatMessage } from "./types";

interface ProgressIndicatorProps {
  messages: ChatMessage[];
  total: number;
  completed?: boolean;
}

/**
 * Progress derived client-side from the conversation: the first interviewer
 * message is the welcome, so every interviewer message after it is a question.
 */
export function ProgressIndicator({
  messages,
  total,
  completed = false,
}: ProgressIndicatorProps) {
  const asked = Math.max(0, askedQuestions(messages));
  const current = Math.min(asked, total);
  const percentage = completed
    ? 100
    : asked === 0
      ? 0
      : Math.round((current / total) * 100);

  const label = completed
    ? "Interview complete"
    : asked === 0
      ? "Getting ready"
      : `Question ${current} of ${total}`;

  return (
    <div
      aria-label={`${label} · ${percentage}% complete`}
      className="rounded-2xl border border-line bg-surface px-4 py-3.5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold tracking-tight text-ink">
          {label}
        </p>
        <p className="shrink-0 text-sm font-medium tabular-nums text-indigo-600 dark:text-indigo-300">
          {percentage}%
        </p>
      </div>
      <div
        className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-3/15"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function askedQuestions(messages: ChatMessage[]): number {
  const interviewerMessages = messages.filter(
    (message) => message.role === "interviewer",
  ).length;
  return Math.max(0, interviewerMessages - 1);
}