import { cn } from "@/lib/utils";
import { ChatMark } from "./icons";

interface BrandProps {
  subtitle?: string;
  className?: string;
}

export function Brand({ subtitle, className }: BrandProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-950/40">
        <ChatMark className="h-4 w-4" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight text-ink">
          Intervue AI
        </span>
        {subtitle ? (
          <span className="block truncate text-xs text-ink-3">{subtitle}</span>
        ) : null}
      </span>
    </div>
  );
}

/** Small accent avatar mark used in the conversation stream. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-500/10 text-indigo-600 ring-1 ring-inset ring-indigo-500/20 dark:text-indigo-300",
        className,
      )}
    >
      <ChatMark className="h-4 w-4" />
    </span>
  );
}