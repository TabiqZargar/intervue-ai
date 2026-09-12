import { ChatMark } from "@/components/ui/icons";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center text-indigo-500">
            <ChatMark className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-ink">
              Intervue AI
            </p>
            <p className="mt-0.5 text-xs text-ink-3">
              AI-powered technical interviews for the ABTalks AI Cohort
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-3">Practice · Get feedback · Improve</p>
      </div>
    </footer>
  );
}