import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Intervue AI
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ABTalks AI Cohort
          </p>
        </div>
        <Link
          href="/interview"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        >
          Start Interview
        </Link>
      </div>
    </header>
  );
}
