const steps = [
  {
    number: "01",
    title: "Understand Your Journey",
    description:
      "Intervue AI uses the candidate's cohort progress and learning signals.",
  },
  {
    number: "02",
    title: "Interview Naturally",
    description:
      "Questions adapt to the candidate's experience and previous answers.",
  },
  {
    number: "03",
    title: "Learn From the Result",
    description: "Receive strengths, gaps, and practical next steps.",
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="mx-auto w-full max-w-5xl px-4 py-16 sm:py-20"
    >
      <div className="max-w-2xl">
        <h2
          id="how-it-works-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
        >
          How it works
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7 dark:text-zinc-400">
          A guided, three-stage flow that turns raw learning data into a
          practice interview.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold tabular-nums text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              {step.number}
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
