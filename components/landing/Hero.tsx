import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { buttonPrimary } from "@/components/ui/styles";

export function Hero() {
  return (
    <section className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-24 pt-24 text-center sm:pb-32 sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[26rem] w-[46rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(111,95,242,0.12),transparent_70%)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(111,95,242,0.2),transparent_70%)]"
      />
      <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-medium text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
        ABTalks AI Cohort
      </span>
      <h1 className="mt-7 max-w-2xl animate-fade-in text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-ink sm:text-[3.25rem] sm:leading-[1.04]">
        Turn your learning into interview confidence.
      </h1>
      <p className="mt-5 max-w-xl animate-fade-in text-pretty text-base leading-7 text-ink-2 [animation-delay:40ms] sm:text-lg sm:leading-8">
        Intervue AI is your AI technical interviewer for the ABTalks AI Cohort.
        It runs a personalized interview from your actual journey — completed
        missions, attempts, skipped topics, and learning signals — then adapts
        to how you answer.
      </p>
      <div className="mt-9 flex animate-fade-in flex-col items-center gap-4 [animation-delay:80ms] sm:flex-row">
        <Link href="/interview" className={`${buttonPrimary} group px-7`}>
          Start Your Interview
          <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <p className="mt-6 animate-fade-in text-sm text-ink-3 [animation-delay:120ms]">
        8 questions · Adaptive follow-ups · Actionable feedback
      </p>
    </section>
  );
}