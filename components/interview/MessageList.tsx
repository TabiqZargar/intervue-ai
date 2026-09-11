"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "./Spinner";
import type { ChatMessage } from "./types";

interface MessageListProps {
  messages: ChatMessage[];
  pending?: string;
}

/** Status steps shown while the interview service processes an answer. */
const PENDING_STEPS = [
  "Reading your answer",
  "Analyzing your response",
  "Preparing the next question",
];

export function MessageList({ messages, pending }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="flex flex-col gap-4"
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {pending ? <PendingStatus /> : null}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}

/**
 * Rotates through the processing steps so the plain "Evaluating…" state
 * communicates momentum without blank screens or artificial delays. Purely
 * cosmetic; the cycles simply repeat while the real request is in flight.
 */
function PendingStatus() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % PENDING_STEPS.length);
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const label = PENDING_STEPS[step] ?? PENDING_STEPS[0];

  return (
    <div className="inline-flex max-w-full items-center gap-2.5 self-start rounded-xl border border-dashed border-zinc-300 bg-white pl-4 pr-5 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      <Spinner className="h-4 w-4 shrink-0" />
      <span className="min-w-0">{label}…</span>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "interviewer") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500"
          />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Interviewer
          </p>
        </div>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-2xl rounded-br-md border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-900/70 dark:bg-indigo-950/50">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Your answer
        </p>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-zinc-900 dark:text-zinc-100">
          {message.content}
        </p>
      </div>
    </div>
  );
}
