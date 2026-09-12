import { CheckCircle } from "@/components/ui/icons";
import { buttonPrimary } from "@/components/ui/styles";
import { experienceLabel, initials } from "./types";
import type { CandidateOption } from "./types";
import { Spinner } from "./Spinner";

interface CandidateSelectorProps {
  candidates: CandidateOption[];
  selectedId: string | null;
  onSelect: (candidate: CandidateOption) => void;
  onStart: () => void;
  starting: boolean;
}

export function CandidateSelector({
  candidates,
  selectedId,
  onSelect,
  onStart,
  starting,
}: CandidateSelectorProps) {
  return (
    <section
      aria-labelledby="candidate-selector-heading"
      className="flex w-full flex-col"
    >
      <div className="animate-slide-up">
        <p className="kicker text-indigo-600 dark:text-indigo-400">Start</p>
        <h1
          id="candidate-selector-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
        >
          Choose a candidate
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-7 text-ink-2">
          Pick a profile and Intervue AI will run a personalized 8-question
          technical interview built from that candidate&apos;s learning journey
          — with adaptive follow-ups along the way.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3" aria-label="Candidate profiles">
        {candidates.map((candidate) => {
          const selected = candidate.id === selectedId;
          return (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(candidate)}
              className={`group flex w-full items-center gap-4 rounded-2xl border bg-surface px-4 py-4 text-left transition-[border-color,background-color,transform] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                selected
                  ? "border-indigo-500/60 bg-indigo-500/[0.05]"
                  : "border-line hover:border-line-strong hover:bg-surface-2/60"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors duration-150 ${
                  selected
                    ? "bg-indigo-600 text-white"
                    : "bg-surface-2 text-ink-2 ring-1 ring-inset ring-line"
                }`}
              >
                {initials(candidate.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-ink">
                    {candidate.name}
                  </span>
                  <span className="text-xs text-ink-3">
                    {candidate.jobRole} ·{" "}
                    {experienceLabel(candidate.yearsExperience)} ·{" "}
                    {candidate.yearsExperience} yrs
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-ink-3">
                  {candidate.education} · {candidate.missionsCompleted} missions
                  completed
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                  selected
                    ? "border-indigo-600 bg-indigo-600"
                    : "border-line-strong group-hover:border-ink-3"
                }`}
              >
                {selected ? <CheckCircle className="h-3.5 w-3.5" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onStart}
          disabled={starting || selectedId === null}
          className={`${buttonPrimary} w-full px-7 sm:w-auto`}
        >
          {starting ? (
            <>
              <Spinner className="h-4 w-4" />
              Starting interview…
            </>
          ) : (
            "Start Interview"
          )}
        </button>
        <p className="text-xs text-ink-3 sm:ml-2">
          The interview adapts to each answer in real time.
        </p>
      </div>
    </section>
  );
}