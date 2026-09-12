import { AlertCircle } from "@/components/ui/icons";

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  /** Whether an in-progress interview session still exists and can be retried. */
  sessionActive?: boolean;
}

export function ErrorBanner({
  message,
  onRetry,
  sessionActive,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex animate-fade-in flex-col gap-4 rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Something went wrong</p>
          <p className="mt-1 text-sm leading-6 text-ink-2">{message}</p>
          {sessionActive ? (
            <p className="mt-2 text-sm leading-6 text-ink-3">
              Your interview session is still active — you can try again without
              losing your place.
            </p>
          ) : null}
        </div>
      </div>
      <div className="pl-11">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/[0.08] px-4 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-500/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:text-red-400"
        >
          Try again
        </button>
      </div>
    </div>
  );
}