"use client";

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
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <label
        htmlFor="interview-answer"
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Your answer
      </label>
      <textarea
        id="interview-answer"
        rows={7}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Type your answer here. Enter adds a new line."
        className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base leading-6 text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {disabled ? "Sending your answer…" : "Enter adds a new line."}
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || empty}
          className="min-h-[44px] rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 disabled:cursor-not-allowed disabled:bg-indigo-300 dark:disabled:bg-indigo-800"
        >
          {disabled ? "Sending…" : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}
