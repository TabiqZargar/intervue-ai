import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { buttonPrimary } from "@/components/ui/styles";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:py-24"
    >
      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-2/70 px-6 py-16 text-center sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-48 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(111,95,242,0.1),transparent_70%)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(111,95,242,0.18),transparent_70%)]"
        />
        <div className="relative">
          <p className="kicker text-indigo-600 dark:text-indigo-400">
            Get started
          </p>
          <h2
            id="final-cta-heading"
            className="mx-auto mt-4 max-w-xl text-balance text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            Ready to test what you actually know?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-ink-2">
            Your journey is the interviewer. See where you stand before the real
            thing.
          </p>
          <Link href="/interview" className={`${buttonPrimary} group mt-9 px-7`}>
            Start Interview
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}