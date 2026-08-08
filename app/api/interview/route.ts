import { NextResponse } from "next/server";
import { interviewEngine } from "@/services/interview-engine";
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
 * The route stays thin; orchestration lives in the interview service.
 */
const interviewService = createInterviewService({
  engine: interviewEngine,
  client: createLlmClient(),
});

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

  const result = await interviewService.handle(body);
  return NextResponse.json(result.body, { status: result.status });
}
