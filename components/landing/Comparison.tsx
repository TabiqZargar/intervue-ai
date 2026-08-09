const comparison = {
  scripted: [
    "Same questions",
    "No context",
    "Fixed difficulty",
    "Generic feedback",
  ],
  adaptive: [
    "Personalized questions",
    "Conversation context",
    "Adaptive follow-ups",
    "Actionable feedback",
  ],
};

export function Comparison() {
  return (
    <section
      aria-labelledby="why-intervue-heading"
      className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20"
    >
      <div className="max-w-2xl">
        <h2
          id="why-intervue-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
        >
          Why Intervue AI
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7 dark:text-zinc-400">
          A scripted quiz repeats the same questions. Intervue AI interviews —
          it reads your journey and adapts as you answer.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Scripted quiz
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {comparison.scripted.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 font-semibold text-zinc-400 dark:text-zinc-500"
                >
                  ✕
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Intervue AI
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {comparison.adaptive.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm font-medium leading-6 text-zinc-900 dark:text-zinc-100"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  ✓
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
