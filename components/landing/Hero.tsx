import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        ABTalks AI Cohort
      </span>
      <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl sm:leading-tight dark:text-zinc-50">
        Turn your learning into interview confidence.
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8 dark:text-zinc-400">
        Intervue AI is your AI technical interviewer for the ABTalks AI Cohort.
        It runs a personalized interview from your actual journey — completed
        missions, attempts, skipped topics, and learning signals — then adapts
        to how you answer.
      </p>
      <Link
        href="/interview"
        className="mt-8 inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
      >
        Start Your Interview
      </Link>
      <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
        8 questions · Adaptive follow-ups · Actionable feedback
      </p>
    </section>
  );
}
