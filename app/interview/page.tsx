import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview",
};

export default function InterviewPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex max-w-md flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Interview experience
        </h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          The adaptive interview agent is being prepared and will be available
          here next.
        </p>
      </div>
    </main>
  );
}
