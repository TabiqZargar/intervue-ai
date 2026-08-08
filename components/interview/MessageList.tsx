"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "./Spinner";
import type { ChatMessage } from "./types";

interface MessageListProps {
  messages: ChatMessage[];
  pending?: string;
}

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
      {pending ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Spinner className="h-4 w-4" />
          <span>{pending}</span>
        </div>
      ) : null}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "interviewer") {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Interviewer
        </p>
        <p className="whitespace-pre-wrap text-base leading-7 text-zinc-900 dark:text-zinc-100">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[88%] rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Your answer
        </p>
        <p className="whitespace-pre-wrap text-base leading-6 text-zinc-900 dark:text-zinc-100">
          {message.content}
        </p>
      </div>
    </div>
  );
}
