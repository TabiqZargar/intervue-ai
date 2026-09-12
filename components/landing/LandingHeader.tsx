import Link from "next/link";
import { Brand } from "@/components/ui/brand";
import { ArrowRight } from "@/components/ui/icons";
import { ctaPill } from "@/components/ui/styles";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Brand subtitle="ABTalks AI Cohort" />
        <Link href="/interview" className={ctaPill}>
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-transform duration-150 group-hover:translate-x-px"
            aria-hidden="true"
          >
            <ArrowRight className="h-3 w-3" />
          </span>
          Start Interview
        </Link>
      </div>
    </header>
  );
}