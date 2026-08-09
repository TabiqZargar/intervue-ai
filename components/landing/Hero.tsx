import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
        ABTalks AI Cohort
      </span>
      <h1 className="mt-6 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight dark:text-zinc-50">
        Turn your learning into interview confidence.
      </h1>
      <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-zinc-400">
        Intervue AI is your AI technical interviewer for the ABTalks AI Cohort.
        It runs a personalized interview from your actual journey — completed
        missions, attempts, skipped topics, and learning signals — then adapts
        to how you answer.
      </p>
      <Link
        href="/interview"
        className="mt-10 inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
      >
        Start Your Interview
      </Link>
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        8 questions · Adaptive follow-ups · Actionable feedback
      </p>
    </section>
  );
}
