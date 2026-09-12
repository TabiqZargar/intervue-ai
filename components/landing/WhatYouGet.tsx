import { ChartBars, Gauge, ListChecks, Target } from "@/components/ui/icons";

const items = [
  {
    icon: Target,
    title: "Personalized Interview",
    description: "Questions based on the candidate's learning journey.",
  },
  {
    icon: Gauge,
    title: "Technical Evaluation",
    description:
      "Answers are evaluated against the relevant learning objective.",
  },
  {
    icon: ChartBars,
    title: "Score Statistics",
    description:
      "Overall score, sub-scores, and topic and difficulty breakdowns.",
  },
  {
    icon: ListChecks,
    title: "Strengths, Gaps & Next Steps",
    description:
      "See what you know, where you need more depth, and what to study next.",
  },
];

export function WhatYouGet() {
  return (
    <section
      aria-labelledby="what-you-get-heading"
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-24"
    >
      <div className="max-w-2xl">
        <p className="kicker text-indigo-600 dark:text-indigo-400">Outcomes</p>
        <h2
          id="what-you-get-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          What you get
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-2">
          Every interview ends with a clear picture of where you stand.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group flex flex-col rounded-2xl border border-line bg-surface p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 transition-colors duration-200 group-hover:bg-indigo-500/15 dark:text-indigo-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-2">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}