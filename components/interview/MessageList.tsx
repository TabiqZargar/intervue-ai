"use client";

import { useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/ui/brand";
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
      className="flex flex-col gap-6"
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
    <div className="flex max-w-full animate-fade-in items-start gap-3 self-start">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-ink-3/10 text-ink-2">
        <Spinner className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="kicker mb-1.5 block text-ink-3">Assessing</span>
        <span className="text-sm text-ink-2">{label}…</span>
      </span>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "interviewer") {
    return (
      <div className="flex max-w-full animate-message-in items-start gap-3">
        <BrandMark className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="kicker mb-1.5 text-indigo-600 dark:text-indigo-300">
            Interviewer
          </p>
          <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-ink">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-message-in justify-end">
      <div className="max-w-[88%] rounded-2xl rounded-br-md bg-indigo-500/[0.07] px-4 py-3 ring-1 ring-inset ring-indigo-500/15 sm:max-w-[80%]">
        <p className="kicker mb-1 text-indigo-600 dark:text-indigo-300">
          Your answer
        </p>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-ink">
          {message.content}
        </p>
      </div>
    </div>
  );
}