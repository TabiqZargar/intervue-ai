interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
  /** Whether an in-progress interview session still exists and can be retried. */
  sessionActive?: boolean;
}

export function ErrorBanner({ message, onRetry, sessionActive }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950"
    >
      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
        Something went wrong
      </p>
      <p className="mt-1 text-sm leading-6 text-red-800 dark:text-red-200">
        {message}
      </p>
      {sessionActive ? (
        <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-300">
          Your interview session is still active — you can try again without
          losing your place.
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
      >
        Try again
      </button>
    </div>
  );
}
