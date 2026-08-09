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
      className="rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {label}
        </p>
        <p className="text-sm font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
          {percentage}%
        </p>
      </div>
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300 ease-out"
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
