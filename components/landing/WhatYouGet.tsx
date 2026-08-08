const items = [
  {
    number: "01",
    title: "Personalized Interview",
    description: "Questions based on the candidate's journey.",
  },
  {
    number: "02",
    title: "Technical Evaluation",
    description:
      "Answers are evaluated against the relevant learning objective.",
  },
  {
    number: "03",
    title: "Strengths & Gaps",
    description: "Understand what you know and where you need more depth.",
  },
  {
    number: "04",
    title: "Next Steps",
    description:
      "Turn interview weaknesses into concrete areas to study.",
  },
];

export function WhatYouGet() {
  return (
    <section
      aria-labelledby="what-you-get-heading"
      className="mx-auto w-full max-w-5xl px-4 py-12"
    >
      <div className="max-w-2xl">
        <h2
          id="what-you-get-heading"
          className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50"
        >
          What you get
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 sm:text-base sm:leading-7 dark:text-zinc-400">
          Every interview ends with a clear picture of where you stand.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.number}
            className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {item.number}
            </p>
            <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
