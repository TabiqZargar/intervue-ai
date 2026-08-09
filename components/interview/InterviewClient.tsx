"use client";

import { useRef, useState } from "react";
import type { Candidate } from "@/types/candidate";
import type { FinalFeedback } from "@/types/interview";
import {
  continueInterview,
  createSessionId,
  startInterview,
} from "@/lib/interview-api";
import { AnswerComposer } from "./AnswerComposer";
import { CandidateSelector } from "./CandidateSelector";
import { ErrorBanner } from "./ErrorBanner";
import { FeedbackPanel } from "./FeedbackPanel";
import { InterviewHeader } from "./InterviewHeader";
import { MessageList } from "./MessageList";
import { ProgressIndicator } from "./ProgressIndicator";
import {
  toCandidateOption,
  type CandidateOption,
  type ChatMessage,
  type InterviewPhase,
} from "./types";

/** The planner always produces exactly 8 questions (including the follow-up slot). */
const TOTAL_QUESTIONS = 8;

interface InterviewClientProps {
  candidates: Candidate[];
}

export function InterviewClient({ candidates }: InterviewClientProps) {
  const options = candidates.map(toCandidateOption);

  const [phase, setPhase] = useState<InterviewPhase>("selecting");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<FinalFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const busyRef = useRef(false);
  const messageIdRef = useRef(0);

  function nextMessageId(): string {
    messageIdRef.current += 1;
    return `m-${messageIdRef.current}`;
  }

  function selectOption(option: CandidateOption) {
    setSelected(
      candidates.find((candidate) => candidate.member.id === option.id) ?? null,
    );
  }

  async function handleStart(candidate: Candidate) {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setPhase("starting");

    const id = createSessionId();

    try {
      const result = await startInterview(id, candidate);
      if (!result.ok) {
        setError(result.message);
        setPhase("selecting");
        return;
      }
      setSessionId(id);
      setSelected(candidate);
      setMessages([
        { id: nextMessageId(), role: "interviewer", content: result.response.reply },
      ]);
      if (result.response.done) {
        setFeedback(result.response.feedback);
        setPhase("completed");
      } else {
        setPhase("active");
      }
    } finally {
      busyRef.current = false;
    }
  }

  async function handleSubmitAnswer() {
    if (busyRef.current) return;
    const answer = draft.trim();
    if (!answer || !sessionId) return;

    busyRef.current = true;
    setError(null);
    setPhase("submitting");

    try {
      const result = await continueInterview(sessionId, answer);
      if (!result.ok) {
        setError(result.message);
        setPhase("active");
        return;
      }
      const response = result.response;
      setMessages((previous) => [
        ...previous,
        { id: nextMessageId(), role: "candidate", content: answer },
        { id: nextMessageId(), role: "interviewer", content: response.reply },
      ]);
      setDraft("");
      if (response.done) {
        setFeedback(response.feedback);
        setPhase("completed");
      } else {
        setPhase("active");
      }
    } finally {
      busyRef.current = false;
    }
  }

  function resetInterview() {
    busyRef.current = false;
    setSessionId(null);
    setSelected(null);
    setMessages([]);
    setFeedback(null);
    setError(null);
    setDraft("");
    setPhase("selecting");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <InterviewHeader
        candidate={selected ? toCandidateOption(selected) : null}
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:py-8">
        {(phase === "selecting" || phase === "starting") && (
          <>
            <CandidateSelector
              candidates={options}
              selectedId={selected?.member.id ?? null}
              onSelect={selectOption}
              onStart={() => {
                if (selected) void handleStart(selected);
              }}
              starting={phase === "starting"}
            />
            {error ? (
              <ErrorBanner
                message={error}
                onRetry={() => {
                  if (selected) void handleStart(selected);
                }}
              />
            ) : null}
          </>
        )}

        {(phase === "active" || phase === "submitting") && selected && (
          <>
            <ProgressIndicator messages={messages} total={TOTAL_QUESTIONS} />
            {error ? (
              <ErrorBanner
                message={error}
                sessionActive={phase === "active"}
                onRetry={() => void handleSubmitAnswer()}
              />
            ) : null}
            <MessageList
              messages={messages}
              pending={
                phase === "submitting" ? "Evaluating your answer…" : undefined
              }
            />
            <AnswerComposer
              value={draft}
              onChange={setDraft}
              onSubmit={() => void handleSubmitAnswer()}
              disabled={phase === "submitting"}
            />
          </>
        )}

        {phase === "completed" && feedback && selected && (
          <>
            <ProgressIndicator
              messages={messages}
              total={TOTAL_QUESTIONS}
              completed
            />
            <MessageList messages={messages} />
            <FeedbackPanel feedback={feedback} onRestart={resetInterview} />
          </>
        )}
      </main>
    </div>
  );
}
