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
      className="mx-auto w-full max-w-5xl px-4 py-12"
    >
      <h2
        id="how-it-works-heading"
        className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50"
      >
        How it works
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {step.number}
            </p>
            <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
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
