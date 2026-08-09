import { experienceLabel } from "./types";
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
      className="flex w-full flex-col gap-4"
    >
      <div>
        <h1
          id="candidate-selector-heading"
          className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Choose a candidate
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Select a candidate profile to begin a technical interview.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {candidates.map((candidate) => {
          const selected = candidate.id === selectedId;
          return (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(candidate)}
              className={`flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                selected
                  ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              }`}
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {candidate.name}
              </span>
              <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                {candidate.jobRole} · {experienceLabel(candidate.yearsExperience)}{" "}
                · {candidate.yearsExperience} yrs
              </span>
              <span className="text-xs leading-5 text-zinc-400 dark:text-zinc-500">
                {candidate.education} · {candidate.missionsCompleted} missions
                completed
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onStart}
        disabled={starting || selectedId === null}
        className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:cursor-not-allowed disabled:bg-indigo-300 disabled:shadow-none dark:disabled:bg-indigo-800"
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
    </section>
  );
}
