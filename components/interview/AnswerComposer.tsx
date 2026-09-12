"use client";

import { buttonPrimary } from "@/components/ui/styles";
import { Spinner } from "./Spinner";

interface AnswerComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function AnswerComposer({
  value,
  onChange,
  onSubmit,
  disabled,
}: AnswerComposerProps) {
  const empty = value.trim().length === 0;

  return (
    <div className="rounded-2xl border border-line bg-surface p-3 transition-[border-color,box-shadow] duration-150 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 sm:p-4">
      <label
        htmlFor="interview-answer"
        className="kicker mb-2 block px-1 text-ink-3"
      >
        Your answer
      </label>
      <textarea
        id="interview-answer"
        rows={7}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-describedby="interview-answer-help"
        placeholder="Type your answer here. Enter adds a new line."
        className="w-full resize-y rounded-[10px] border-0 bg-transparent px-3.5 py-3 text-[15px] leading-7 text-ink outline-none transition-colors duration-150 placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <p
          id="interview-answer-help"
          className="text-xs leading-5 text-ink-3"
        >
          {disabled ? "Evaluating your answer…" : "Enter adds a new line."}
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || empty}
          className={buttonPrimary}
        >
          {disabled ? (
            <>
              <Spinner className="h-4 w-4" />
              Evaluating…
            </>
          ) : (
            "Submit Answer"
          )}
        </button>
      </div>
    </div>
  );
}