import type { Candidate } from "@/types/candidate";
import type {
  InterviewApiRequest,
  InterviewApiResponse,
} from "@/types/api";

/**
 * Typed client for POST /api/interview.
 *
 * Start:     { "sessionId": "...", "candidate": {...} }
 *            -> { "reply": "Welcome...", "done": false }
 * Answer:    { "sessionId": "...", "message": "..." }
 *            -> { "reply": "...", "done": false }  |  { "reply": "...", "done": true, "feedback": {...} }
 *
 * Every failure is normalized into a human-safe message so the UI never
 * surfaces stack traces, API keys, provider errors, or other internals.
 * The server's error bodies are intentionally not shown verbatim.
 */

export interface InterviewApiSuccess {
  ok: true;
  response: InterviewApiResponse;
}

export interface InterviewApiFailure {
  ok: false;
  /** Coarse reason, used by the UI to pick a helpful message. */
  reason: "network" | "server" | "malformed";
  /** Stable, human-readable message safe to show to the candidate. */
  message: string;
}

export type InterviewApiResult = InterviewApiSuccess | InterviewApiFailure;

const API_URL = "/api/interview";

export function startInterview(
  sessionId: string,
  candidate: Candidate,
): Promise<InterviewApiResult> {
  return postInterview({ sessionId, candidate });
}

export function continueInterview(
  sessionId: string,
  message: string,
): Promise<InterviewApiResult> {
  return postInterview({ sessionId, message });
}

/**
 * Unique client-generated session id for a single interview. A random UUID is
 * used when available; a time+random fallback covers non-secure contexts.
 */
export function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function postInterview(
  body: InterviewApiRequest,
): Promise<InterviewApiResult> {
  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      reason: "network",
      message:
        "We couldn't reach the interview service. Check your connection and try again.",
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return malformedResult();
  }

  if (!response.ok) {
    return { ok: false, reason: "server", message: serverMessage(response.status) };
  }

  if (!isInterviewApiResponse(payload)) {
    return malformedResult();
  }

  return { ok: true, response: payload };
}

function malformedResult(): InterviewApiFailure {
  return {
    ok: false,
    reason: "malformed",
    message:
      "The interview service returned an unexpected response. Please try again.",
  };
}

/** Generic, human-safe messages per HTTP status. Never includes server internals. */
function serverMessage(status: number): string {
  switch (status) {
    case 400:
      return "The interview service couldn't process that request. Please try again.";
    case 404:
      return "This interview session is no longer active. Start a new interview to continue.";
    case 502:
    case 503:
      return "The interview service is temporarily unavailable. Please try again in a moment.";
    default:
      return "Something went wrong while processing your request. Please try again.";
  }
}

function isInterviewApiResponse(value: unknown): value is InterviewApiResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.reply !== "string") {
    return false;
  }
  if (record.done === false) {
    return true;
  }
  if (record.done !== true) {
    return false;
  }
  return isFinalFeedback(record.feedback);
}

function isFinalFeedback(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.summary === "string" &&
    isStringArray(record.strengths) &&
    isStringArray(record.gaps) &&
    isStringArray(record.next)
  );
}

function isStringArray(value: unknown): boolean {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}
