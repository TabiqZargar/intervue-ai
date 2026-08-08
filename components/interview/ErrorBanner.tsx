interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p className="text-sm leading-6">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
      >
        Try again
      </button>
    </div>
  );
}
