import { Brand } from "@/components/ui/brand";
import { experienceLabel, initials } from "./types";
import type { CandidateOption } from "./types";

interface InterviewHeaderProps {
  candidate: CandidateOption | null;
}

export function InterviewHeader({ candidate }: InterviewHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Brand subtitle="Technical Interview" />
        {candidate ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-xs font-semibold text-ink-2">
              {initials(candidate.name)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-medium text-ink">
                {candidate.name}
              </p>
              <p className="truncate text-xs text-ink-3">
                {candidate.jobRole} ·{" "}
                {experienceLabel(candidate.yearsExperience)}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}