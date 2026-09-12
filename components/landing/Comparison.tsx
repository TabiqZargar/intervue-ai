import { CheckCircle, CrossCircle } from "@/components/ui/icons";

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
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-24"
    >
      <div className="max-w-2xl">
        <p className="kicker text-indigo-600 dark:text-indigo-400">
          Why Intervue AI
        </p>
        <h2
          id="why-intervue-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          Why it works better
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-2">
          A scripted quiz repeats the same questions. Intervue AI interviews —
          it reads your journey and adapts as you answer.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface-2/70 p-7">
          <h3 className="kicker text-ink-3">Scripted quiz</h3>
          <ul className="mt-6 flex flex-col gap-4">
            {comparison.scripted.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] leading-6 text-ink-2"
              >
                <CrossCircle className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.05] p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(111,95,242,0.16),transparent)]"
          />
          <h3 className="kicker text-indigo-600 dark:text-indigo-300">
            Intervue AI
          </h3>
          <ul className="mt-6 flex flex-col gap-4">
            {comparison.adaptive.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] font-medium leading-6 text-ink"
              >
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}