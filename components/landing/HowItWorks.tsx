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
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-24"
    >
      <div className="max-w-2xl">
        <p className="kicker text-indigo-600 dark:text-indigo-400">Process</p>
        <h2
          id="how-it-works-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          How it works
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-2">
          A guided, three-stage flow that turns raw learning data into a
          practice interview.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {steps.map((step) => (
          <div
            key={step.number}
            className="group relative flex flex-col rounded-2xl border border-line bg-surface p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
          >
            <div
              aria-hidden="true"
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />
            <span className="font-mono text-xs font-medium tracking-[0.2em] text-ink-3">
              {step.number}
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-2">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}