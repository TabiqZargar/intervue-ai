# Intervue AI

Intervue AI is an adaptive AI technical interview agent that conducts realistic,
multi-turn technical interviews personalized to a candidate's AI engineering
learning journey. It plans a question sequence from a curriculum, runs the
interview through a session engine (Upstash Redis-backed in production), phrases
questions and evaluates answers through a configurable runtime LLM service, and
exposes everything through a simple HTTP API (`POST /api/interview`). A
mobile-first interview UI at `/interview` drives that API end to end.

## Problem Statement

ABTalks Hackathon Problem Statement 2 — "The Interview Agent". Candidates from
the ABTalks AI Cohort need a realistic way to rehearse for technical interviews
using their actual learning journey. A generic quiz cannot adapt to each
candidate, so Intervue AI plans a personalized 8-question interview across at
least 4 curriculum days, asks questions conversationally, probes weaker topics
with follow-ups, and finishes with structured feedback they can act on.

## Pipeline

```text
Candidate
   → deterministic candidate analysis (analyzeCandidate)
   → personalized interview planning (createInterviewPlan)
   → interview state engine (createInterviewEngine)
   → session store (createSessionStore: Upstash Redis in production, in-memory in local dev)
   → next-question decision (follow-up slot vs. next planned question)
   → LLM service (generateInterviewQuestion — question phrasing)
   → evaluator (evaluateAnswer — structured assessment + follow-up signal)
   → interview service (POST /api/interview orchestration)
   → deterministic feedback aggregation (buildFinalFeedback) on completion
```

The deterministic planner/engine remains authoritative for the 8-question and
4+ curriculum-day guarantees, question progression, completion, and
conversation storage. The LLM only phrases questions, assesses answers, and
recommends follow-ups; it never controls the interview lifecycle. Follow-ups
(the evaluator recommends probing an answered topic) replace the planner's
reserved follow-up slot (Q8), so every interview still runs exactly 8 questions
and never loops or ends early.

## Technology Stack

- Next.js (App Router) with React and TypeScript
- Tailwind CSS
- Local JSON data for curriculum and candidates
- Configurable OpenAI-compatible LLM runtime (no provider hard-coded)
- Upstash Redis (REST) for durable session storage in production; in-memory fallback for local dev
- No authentication

## Development Status

- Project scaffold (Next.js, TypeScript, Tailwind CSS) — done
- Landing page at `/` — done (product landing: hero, how it works, quiz-vs-adaptive comparison, what you get, final CTA, metadata)
- Supplied synthetic data (`data/curriculum.json`, `data/candidates.json`) — loaded as the source of truth
- Typed curriculum data access (`getCurriculum`, `getDay`, `getModule`, `getDaysForModule`) — done
- Typed candidate data access (`getCandidates`, `getCandidate`) — done
- Deterministic candidate analysis (`analyzeCandidate`) — done
- Deterministic interview planner (`createInterviewPlan`) — done (8 questions, 4+ curriculum days, personalized via candidate signals)
- Session store (`createSessionStore`) — done (Upstash Redis in production via `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, in-memory fallback for local dev; a typed `MemoryStoreError` keeps a store outage a controlled 500 rather than a "session no longer active")
- Interview state engine (`createInterviewEngine`) — done (start/continue/complete lifecycle, typed results for the future API)
- Configurable runtime LLM service (`createLlmClient`, `generateInterviewQuestion`) — done (OpenAI-compatible chat completions, injectable transport, typed errors, env-var configuration)
- Structured answer evaluation (`evaluateAnswer`) — done (schema-validated output, follow-up signal, strict-to-objective judging)
- `POST /api/interview` API route — done (start/continue/complete, typed request validation, deterministic feedback on completion)
- Feedback generation (`buildFinalFeedback`, `buildNextStepRecommendations`) — done (deterministic aggregation from stored evaluations, no extra LLM call; `next` steps are grounded in evaluator gaps and curriculum objectives)
- Interview UI at `/interview` — done (mobile-first, candidate selection, typed API client, progress, error/retry, final feedback)
- Feedback report page — pending

## HTTP API

### `POST /api/interview`

Start a new session (first request):

```json
{
  "sessionId": "abc-123",
  "candidate": {
    "member": { "id": "CAND-001", "name": "Ada", "jobRole": "ML Engineer", "yearsExperience": 5, "education": "BS", "status": "active" },
    "missions": [{ "day": 1, "title": "Embeddings Explained", "passed": true, "attempts": 1 }],
    "signals": { "commitDays": 12, "missionsCompleted": 3, "missionsFirstTry": 2 }
  }
}
```

```json
{ "reply": "Welcome. Let's begin your interview.", "done": false }
```

Answer (every subsequent request):

```json
{ "sessionId": "abc-123", "message": "candidate answer" }
```

```json
{ "reply": "Question 2: ...", "done": false }
```

Final response when the interview completes:

```json
{
  "reply": "Interview completed.",
  "done": true,
  "feedback": { "summary": "...", "strengths": ["..."], "gaps": ["..."], "next": ["..."] }
}
```

Turn semantics:

- **Start** returns the welcome message only (no LLM call, no question yet).
- The **first message** gets the first question phrased in reply.
- Each later **message is evaluated** (it reaches the evaluator) and the reply
  is the next question — a follow-up when the evaluator recommends one (this
  replaces the planner's reserved Q8 follow-up slot), otherwise the next
  planned question.
- The **last answer** completes the interview with `done: true`, the reply
  `"Interview completed."`, and deterministic aggregate feedback.

Status codes: `200` success · `400` invalid body / duplicate `sessionId` /
answer to a completed session · `404` unknown `sessionId` · `500` internal or
invalid LLM output or session-store outage · `502` LLM provider failure ·
`503` LLM not configured. Sessions are isolated per `sessionId` and persist in
Upstash Redis in production (surviving serverless invocations and restarts);
in local development without Redis configuration they live in process memory.

Errors never expose API keys, provider messages, stack traces, or internal
prompts.

## Landing Page (`/`)

The `/` page is the product's public landing experience: a mobile-first,
single-page layout that positions Intervue AI as the AI technical interviewer
for the ABTalks AI Cohort. It communicates what the product is, who it is for,
what makes it different, how the interview works, and why the feedback is
useful, then routes into `/interview`.

Sections: sticky header (brand + Start Interview) · hero (headline, positioning,
primary CTA, `8 questions · Adaptive follow-ups · Actionable feedback`) ·
How it works (3 steps) · Why Intervue AI (scripted-quiz vs. adaptive
comparison) · What you get (4 outcomes) · final CTA · minimal footer.

Design notes:

- Extends the interview UI's visual language (zinc surfaces, `border-zinc-200`
  borders, `bg-indigo-600` buttons, uppercase kickers) rather than creating a
  separate look.
- No stock images, fake testimonials, fake statistics, fake logos, or heavy
  animation; no new dependencies.
- Page metadata: title `Intervue AI — AI Technical Interviewer` and a concise
  description.

## Interview UI (`/interview`)

The interview experience at `/interview` is a mobile-first single-page flow
(390px target, expands gracefully on desktop):

1. **Choose a candidate** — pick a supplied candidate profile (name, role,
   experience level, education, missions completed). No authentication.
2. **Start Interview** — the client generates a unique `sessionId` and calls
   `POST /api/interview` with the full candidate object; the welcome message
   is shown.
3. **Answer the questions** — every answer posts to the same `sessionId`. The
   first answer triggers the first question; each reply is displayed with
   strong visual hierarchy for interviewer messages. Progress (`Question N of
   8`) is derived client-side from the conversation (the API exposes no
   question index), and the composer disables submissions during requests.
4. **Final feedback** — when the API returns `done: true`, the flow transitions
   to an "Interview complete" screen with the exact `feedback.summary`,
   `feedback.strengths`, `feedback.gaps`, and `feedback.next` fields. No
   numeric score is invented (the API returns none).

Implementation notes:

- `lib/interview-api.ts` is the typed client for the endpoint. It validates
  every response structurally, maps HTTP status codes and network failures to
  human-safe messages (never server error text), and generates session ids.
- State is local React state in `components/interview/` — no Redux/Zustand, no
  new dependencies.
- Failed answer submissions preserve the candidate's answer and offer
  "Try again"; duplicate submissions are blocked during in-flight requests.
- All questions come from the API; the client hard-codes no candidates,
  questions, topics, or planner terminology.

## Environment Variables (server-side)

The LLM provider and the session store are configured at deployment. These are
**server-side** environment variables — never put secrets in
`NEXT_PUBLIC_*` variables.

```bash
LLM_BASE_URL=   # OpenAI-compatible base URL, e.g. https://api.openai.com/v1
LLM_API_KEY=    # provider API key (never commit this)
LLM_MODEL=      # model identifier, e.g. gpt-4o-mini
LLM_TIMEOUT_MS= # optional, request timeout in ms (default 30000)
```

Session persistence uses Upstash Redis (REST), which requires both variables
(obtained from your Upstash database's REST settings):

```bash
UPSTASH_REDIS_REST_URL=   # e.g. https://<name>-<region>.upstash.io
UPSTASH_REDIS_REST_TOKEN= # Upstash REST API token (never commit this)
```

If `LLM_BASE_URL`, `LLM_API_KEY`, or `LLM_MODEL` are missing, the service
returns a typed `not-configured` error instead of throwing. Any OpenAI-compatible
chat-completions provider can be used by pointing the variables at it. The
service never logs or surfaces API keys, authorization headers, stack traces,
or Redis credentials.

Session store selection is explicit: when both `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` are set, sessions persist in Upstash Redis. In a
non-production environment without them, the app falls back to its in-memory
store for local development. In **production**, missing Redis configuration is
a hard error — the app fails fast rather than silently losing sessions.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
landing page.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## Testing

- `npm run lint` (ESLint) and `npx tsc --noEmit` (TypeScript) gate every
  change; `npm run build` verifies the production bundle and route table
  (`/` and `/interview` static, `/api/interview` dynamic/server-side).
- Deterministic verification of the planner, engine, session store, and
  feedback aggregation (exactly 8 questions, 4+ curriculum days, bounded
  follow-ups, session isolation, Redis round-trips, unknown-vs-outage
  distinction, feedback shape) runs via temporary scripts that are removed
  after each audit; the session store is exercised against a mocked Upstash
  Redis client (no live database, no real LLM calls).
- The service/API layer is exercised the same way with a stubbed LLM client
  (all status codes, retry-safety, no-secret leaks) over the Redis-backed
  store.
- A dev-server API smoke check confirms `POST /api/interview` start/duplicate/
  unknown/validation behavior and that a provider outage maps to a safe 502.
  End-to-end API tests against the live LLM provider are optional and depend on
  the provider accepting requests (see Deployment).

## Deployment

1. `npm install`, then `npm run build`.
2. Set the server-side variables below (in `.env.local` locally, or as
   platform secrets on the host — never `NEXT_PUBLIC_*`): the LLM variables
   plus `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (from an
   Upstash Redis database).
3. Run `npm run start` (or `next start -p <port>`). Because sessions persist
   in Upstash Redis, the app works across serverless invocations and restarts;
   there is no single-instance requirement and no process-memory reset.

Sessions are isolated per `sessionId` and stored as JSON under
`intervue-ai:session:<sessionId>` keys in Upstash Redis in production. Without
Redis configuration in production the app refuses to start serving sessions
(fail fast) instead of silently using memory. The app does not deploy, push, or
register the team's repository by itself — those are steps the team performs
after submission.
