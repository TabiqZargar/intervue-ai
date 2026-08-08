import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center">
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          The Interview Agent
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Intervue AI
        </h1>
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
          Adaptive AI Technical Interview Agent
        </p>
        <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Personalized technical interviews based on your AI engineering learning
          journey.
        </p>
        <Link
          href="/interview"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        >
          Start an interview
        </Link>
      </div>
    </main>
  );
}
