import { experienceLabel } from "./types";
import type { CandidateOption } from "./types";

interface InterviewHeaderProps {
  candidate: CandidateOption | null;
}

export function InterviewHeader({ candidate }: InterviewHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Intervue AI
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Technical Interview
          </p>
        </div>
        {candidate ? (
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {candidate.name}
            </p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {candidate.jobRole} · {experienceLabel(candidate.yearsExperience)}
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}
