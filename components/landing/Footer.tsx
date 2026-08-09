export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Intervue AI
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            AI-powered technical interviews for the ABTalks AI Cohort
          </p>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Practice · Get feedback · Improve
        </p>
      </div>
    </footer>
  );
}
