# Intervue AI

Intervue AI is an adaptive AI technical interview agent that conducts realistic,
multi-turn technical interviews personalized to a candidate's AI engineering
learning journey. It plans a question sequence from a curriculum, runs the
interview through an in-memory session engine, phrases questions and evaluates
answers through a configurable runtime LLM service, and will expose it all
through a simple HTTP API (API and frontend are upcoming milestones).

## Pipeline

```text
Candidate
   → deterministic candidate analysis (analyzeCandidate)
   → personalized interview planning (createInterviewPlan)
   → interview state engine (createInterviewEngine)
   → session memory (createMemory) → conversation turns
   → next-question decision
   → LLM service (generateInterviewQuestion — question phrasing)
   → evaluator (evaluateAnswer — structured assessment + follow-up signal)
```

The deterministic planner/engine remains authoritative for the 8-question and
4+ curriculum-day guarantees, question progression, completion, and
conversation storage. The LLM only phrases questions, assesses answers, and
recommends follow-ups; it never controls the interview lifecycle.

## Technology Stack

- Next.js (App Router) with React and TypeScript
- Tailwind CSS
- Local JSON data for curriculum and candidates
- Configurable OpenAI-compatible LLM runtime (no provider hard-coded)
- No database, no authentication

## Development Status

- Project scaffold (Next.js, TypeScript, Tailwind CSS) — done
- Landing page at `/` — done
- Supplied synthetic data (`data/curriculum.json`, `data/candidates.json`) — loaded as the source of truth
- Typed curriculum data access (`getCurriculum`, `getDay`, `getModule`, `getDaysForModule`) — done
- Typed candidate data access (`getCandidates`, `getCandidate`) — done
- Deterministic candidate analysis (`analyzeCandidate`) — done
- Deterministic interview planner (`createInterviewPlan`) — done (8 questions, 4+ curriculum days, personalized via candidate signals)
- Short-term conversation memory (`createMemory`) — done (in-memory session store, `Map`-backed, no persistence)
- Interview state engine (`createInterviewEngine`) — done (start/continue/complete lifecycle, typed results for the future API)
- Configurable runtime LLM service (`createLlmClient`, `generateInterviewQuestion`) — done (OpenAI-compatible chat completions, injectable transport, typed errors, env-var configuration)
- Structured answer evaluation (`evaluateAnswer`) — done (schema-validated output, follow-up signal, strict-to-objective judging)
- `POST /api/interview` API route — pending
- Interview UI at `/interview` — pending
- Feedback generation (aggregate report) — pending

## Environment Variables (server-side)

The LLM provider is intentionally configurable and selected at deployment.
These are **server-side** environment variables — never put secrets in
`NEXT_PUBLIC_*` variables.

```bash
LLM_BASE_URL=   # OpenAI-compatible base URL, e.g. https://api.openai.com/v1
LLM_API_KEY=    # provider API key (never commit this)
LLM_MODEL=      # model identifier, e.g. gpt-4o-mini
LLM_TIMEOUT_MS= # optional, request timeout in ms (default 30000)
```

If `LLM_BASE_URL`, `LLM_API_KEY`, or `LLM_MODEL` are missing, the service
returns a typed `not-configured` error instead of throwing. Any OpenAI-compatible
chat-completions provider can be used by pointing the variables at it. The
service never logs or surfaces API keys, authorization headers, or stack traces.

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
