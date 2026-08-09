import { NextResponse } from "next/server";
import { getInterviewEngine } from "@/services/interview-engine";
import {
  isMemoryStoreError,
  isSessionStoreConfigurationError,
} from "@/services/memory";
import { createLlmClient } from "@/services/llm";
import { createInterviewService } from "@/services/interview-service";

/**
 * POST /api/interview — the interview endpoint.
 *
 * Start:  { "sessionId": "...", "candidate": { ... } }
 *         -> { "reply": "Welcome. Let's begin your interview.", "done": false }
 * Answer: { "sessionId": "...", "message": "..." }
 *         -> { "reply": "...", "done": false }
 * Final:  -> { "reply": "Interview completed.", "done": true, "feedback": {...} }
 *
 * Errors: 400 invalid body / completed session / duplicate session,
 *         404 unknown session, 500 internal, 502 provider failure,
 *         503 LLM not configured.
 *
 * The route stays thin; orchestration lives in the interview service. The
 * engine and LLM client are constructed per request so the session store is
 * only instantiated at runtime (its configuration fails fast in production
 * when Redis is missing) and never during route-module evaluation.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "request body must be valid JSON" },
      { status: 400 },
    );
  }

  const interviewService = createInterviewService({
    engine: getInterviewEngine(),
    client: createLlmClient(),
  });

  try {
    const result = await interviewService.handle(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    // Defense in depth: a session-store outage or missing production Redis
    // configuration is a controlled 500, never a thrown stack trace or store
    // internals, and never "session no longer active".
    if (isMemoryStoreError(err) || isSessionStoreConfigurationError(err)) {
      return NextResponse.json(
        { error: "interview session store is temporarily unavailable" },
        { status: 500 },
      );
    }
    throw err;
  }
}
