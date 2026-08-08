import Link from "next/link";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20"
    >
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h2
          id="final-cta-heading"
          className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
        >
          Ready to test what you actually know?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Your journey is the interviewer. See where you stand before the real
          thing.
        </p>
        <Link
          href="/interview"
          className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        >
          Start Interview
        </Link>
      </div>
    </section>
  );
}
