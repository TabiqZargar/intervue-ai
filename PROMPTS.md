# Intervue AI — Prompt Log

This file documents each incremental implementation prompt for the Intervue AI
project. Read it before continuing so later prompts build on (and do not
regress) the work already done.

## Prompt 1 — Project Foundation & Landing Page

**Goal:** Establish the project scaffold and product identity only. No interview
logic, API behavior, or interview UI was implemented in this prompt.

**What was done:**

- Scaffolded a Next.js (App Router) + TypeScript + Tailwind CSS project in the
  empty repository root.
- Established the target directory structure:
  - `app/api/interview` (route pending)
  - `app/interview` (page pending)
  - `components/chat`, `components/feedback`, `components/interview`, `components/ui`
  - `services` (engine, planner, evaluator, llm, memory pending)
  - `lib` (curriculum, candidates, prompt-builder, validators, utils pending)
  - `types` — TypeScript definitions for curriculum, candidates, and interviews
  - `data` — empty placeholders (`curriculum.json`, `candidates.json`)
- Built a minimal, mobile-friendly landing page at `/` establishing the Intervue
  AI identity: name, tagline, and description.
- Updated `README.md` with the project name, description, technology stack, and
  development status.

**Explicitly deferred to later prompts (do not implement early):**

- Interview planner, interview engine, memory, evaluator, LLM integration
- `POST /api/interview` API route behavior
- Interview UI at `/interview`
- Feedback generation
- Populating `data/curriculum.json` and `data/candidates.json` (supplied
  synthetic data)

**Status:** Complete.

## Prompt 2 — Data Services Layer

**Goal:** Model the supplied curriculum and candidate data and expose typed,
pure TypeScript data access. No interview planner, engine, evaluator, LLM
integration, API behavior, or interview UI was implemented.

**What was done:**

- Confirmed `data/curriculum.json` (8 modules, 31 days) and
  `data/candidates.json` (20 candidates) are present and treated as the source
  of truth. Both files were left unmodified.
- Modeled the real schemas in `types/curriculum.ts` (`Curriculum`, `CurriculumModule`, `CurriculumDay`) and `types/candidate.ts` (`Member`, `Candidate`, `Mission`, `CandidateSignals`, `CandidatesData`).
- Represented skipped missions as a discriminated union (`SkippedMission` vs `AttemptedMission`) instead of assuming every mission has `passed`/`attempts`.
- Implemented pure curriculum helpers in `lib/curriculum.ts`: `getCurriculum`, `getDay(dayNumber)`, `getModule(moduleNumber)`, `getDaysForModule(moduleNumber)` (resolves module `[start, end]` day ranges).
- Implemented pure candidate helpers in `lib/candidates.ts`: `getCandidates`, `getCandidate(candidateId)`, `analyzeCandidate(candidate)`.
- `analyzeCandidate` produces a compact, deterministic summary for the future
  planner: profile, experience level, passed/failed/skipped missions,
  high-attempt topics (attempts ≥ 4), first-try-passed strengths, counts, and
  raw learning signals. No AI calls, LLM, embeddings, or vector database.
- Updated `README.md` development status.

**Explicitly deferred to later prompts (do not implement early):**

- Interview planner, interview engine, memory, evaluator, LLM integration
- `POST /api/interview` API route behavior
- Interview UI at `/interview`
- Feedback generation

**Status:** Complete.

## Prompt 3 — Interview Planner

**Goal:** Implement the deterministic Interview Planner only. It decides WHAT to
ask (curriculum day, objective, purpose, difficulty) from candidate signals; it
does not phrase questions and it does not implement the LLM, API, memory,
evaluator, or interview UI.

**What was done:**

- Added `types/planner.ts` (`PlannedQuestion`, `InterviewPlan`,
  `QuestionPurpose`, `QuestionDifficulty`) and exported it from `types/index.ts`.
- Implemented `createInterviewPlan(candidate)` in `services/planner.ts`,
  replacing the reserved stub.
- The planner uses `analyzeCandidate` and the existing `lib/curriculum.ts`
  helpers; no curriculum data is duplicated and no day numbers are hard-coded.
- Produces an 8-slot plan (core/probe/stretch/follow-up purposes) covering
  4+ distinct curriculum days (typically 7–8) using a fixed slot template:
  Q1 core, Q2 core, Q3 probe, Q4 core, Q5 probe, Q6 core, Q7 stretch,
  Q8 follow-up (reserved slot; answer-dependent follow-ups are a later milestone).
- Personalization: failed missions feed probe attention, high-attempt missions
  feed probing, skipped missions are treated as separate knowledge-gap anchors
  (not assumed to be lack of knowledge), first-try passes feed stretch
  questions, passed days are the main core source, and experience level plus
  learning signals select a deterministic difficulty curve (never all-hard).
- Fallbacks keep the 8-question / 4-day guarantee even with sparse signals by
  falling back to passed days and then the full 31-day curriculum.

**Verification:** a temporary script exercised all 20 supplied candidates
(8 checks each, plus signal-influence checks for CAND-001/010/011/016/018);
all passed and the script was removed afterwards.

**Explicitly deferred to later prompts (do not implement early):**

- Interview engine, memory, evaluator, LLM integration, question phrasing
- `POST /api/interview` API route behavior
- Interview UI at `/interview`
- Feedback generation

**Status:** Complete.

## Prompt 4 — Interview Engine + Conversation Memory

**Goal:** Implement the runtime interview state and short-term conversation
memory only. The engine owns the interview lifecycle (start/continue/complete)
but does NOT phrase natural-language questions; it returns question
specifications and stores answers as conversation turns. No LLM, evaluator,
API route, or UI was implemented.

**What was done:**

- Redesigned `types/interview.ts` to model the runtime:
  - `ConversationTurn` — question number, curriculum day/title, objective,
    purpose, difficulty, candidate answer, timestamp. Since the engine does not
    generate question text yet, a turn preserves the full question
    specification the future LLM service can phrase a question from.
  - `InterviewSession` — sessionId, candidate, analysis, plan,
    `currentQuestionIndex`, turns, startedAt, completedAt, status
    (`"active" | "completed"`).
  - Typed results for the future API: `StartInterviewResult`,
    `ContinueInterviewResult`, and a small `EngineError` model
    (`session-not-found`, `interview-completed`, `invalid-input`, `internal`).
  - Kept `MessageRole`/`InterviewMessage` (used by the future API types) and
    the future `QuestionFeedback`/`InterviewFeedback` evaluator types.
- Implemented `services/memory.ts`: `createMemory()` returns a `Map`-backed
  in-memory store (`createSession`, `getSession`, `updateSession`,
  `appendTurn`, `completeSession`, `deleteSession`, `clear`). Updates are
  immutable; no persistence, no semantic/vector memory, no summaries.
- Implemented `services/interview-engine.ts`: `createInterviewEngine(memory)`
  provides `startInterview` (analyze → plan → validate 8-question / 4+ day
  guarantees → create session → return Q1 spec), `continueInterview` (reject
  unknown/completed sessions → store the current question's turn → advance the
  index → return the next spec or mark the session completed),
  `getSession`, and `deleteSession`. No random question selection; question
  progression is index-based and deterministic. The follow-up slot simply
  progresses as the next planned question (intelligent, answer-dependent
  follow-ups are reserved for the LLM milestone).
- Exported a default `interviewEngine` singleton (its own in-memory memory) for
  the future API route; fresh isolated engines are available via the factory.
- The future LLM boundary stays clean: the engine returns `PlannedQuestion`
  specs and the session exposes conversation history + candidate context
  (`analysis`, `turns`) for the later LLM service and evaluator. No prompt
  strings live in the engine.

**Verification:** a temporary script (removed afterwards) ran full interviews
for CAND-001 (high-attempt), CAND-010 (failed missions), CAND-011 (skipped
missions), CAND-016 (failed + high-attempt), and CAND-018 (strong first-try
signals) plus session-isolation and error-path checks: 280 checks, 0 failures.

**Explicitly deferred to later prompts (do not implement early):**

- LLM calls, question phrasing, evaluator logic
- `POST /api/interview` API route behavior
- Interview UI at `/interview`
- Feedback generation
- Database, authentication, vector database, embeddings, RAG, agent frameworks

**Status:** Complete.

## Prompt 5 — LLM Service + Answer Evaluator

**Goal:** Implement the runtime AI layer: a configurable, provider-agnostic LLM
service for natural-language question generation plus a structured answer
evaluator. The deterministic planner/engine remains authoritative for the
8-question / 4+ curriculum-day requirements, progression, completion, and
conversation storage. No API route, UI, database, RAG, embeddings, or agent
framework was implemented.

**What was done:**

- Added `types/llm.ts` (exported from `types/index.ts`): `LlmConfig`,
  `LlmChatMessage`, `LlmServiceErrorCode`/`LlmServiceError`,
  `LlmCallResult<T>`, `GeneratedQuestion`, `AnswerEvaluation`
  (`overall` strong/adequate/weak, `score`/`correctness`/`depth`/`reasoning`/
  `communication` on 1–5, `strengths`/`gaps`, `followUpRecommended`,
  `followUpReason`), and the compact prompt-input types
  (`InterviewerPromptInput`, `EvaluatorPromptInput`) that carry only a
  single-day curriculum context, never the full curriculum.
- Implemented `services/llm.ts`:
  - `resolveLlmConfig(env)` reads `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`
    (required) and optional `LLM_TIMEOUT_MS`; missing config yields a typed
    `not-configured` error, never a throw.
  - `createLlmClient({ config?, transport?, env? })` exposes `chat(messages)`
    over an injectable `ChatTransport` (default `fetchTransport` calls
    `POST {baseUrl}/chat/completions` with a Bearer token and an
    `AbortController` timeout). Transport errors map to typed
    `network`/`timeout`/`http`/`invalid-output` errors; provider messages and
    stack traces are never surfaced.
  - `generateInterviewQuestion(input, client)` — exactly one LLM call — builds
    the INTERVIEWER prompt (concise system prompt + compact user context with
    candidate profile, planned question, objective, tools, bounded 6-turn
    conversation window, optional prior evaluation for follow-up phrasing) and
    validates the model output (`extractJsonObject` tolerates fences/prose;
    question number + non-empty text required).
- Implemented `services/evaluator.ts`: `evaluateAnswer(input, client)` — exactly
  one LLM call — builds the EVALUATOR prompt (judge only against the stated
  objective, accept valid alternatives, concise reasons, no chain-of-thought,
  JSON-only) and validates the full `AnswerEvaluation` schema (enums, 1–5
  integer scores, string arrays, booleans). Malformed JSON or schema violations
  return typed `malformed-json`/`invalid-output` errors.
- Follow-up support is a signal only (`followUpRecommended`/`followUpReason`);
  the deterministic engine still controls question count and completion.
- Updated `types/interview.ts` header and `types/api.ts` so API request/response
  types reference the new `GeneratedQuestion`/`AnswerEvaluation` outputs.

**Verification:** a temporary script (removed afterwards) verified prompt
construction (planned question, objective, candidate context, bounded history;
entire curriculum/candidate dataset never sent), question + evaluation schema
validation, rejection of invalid JSON/enums/scores/arrays, HTTP/timeout/network
and missing-config handling, no-secret-leakage, single-call-per-operation, and
injected mock transport usage: 40 checks, 0 failures. No real provider calls
and no API key required.

**Explicitly deferred to later prompts (do not implement early):**

- `POST /api/interview` API route behavior
- Interview UI at `/interview`
- Aggregate feedback generation/report
- Deployment configuration beyond documenting environment variables

**Status:** Complete.

## Prompt 6 — Interview API Endpoint + Aggregate Feedback

**Goal:** Connect every system into a single conversation through the required
`POST /api/interview` endpoint and return final aggregate feedback. The
deterministic planner/engine remains authoritative for question count,
progression, completion, and storage; the LLM never controls the lifecycle.

**What was done:**

- Implemented `app/api/interview/route.ts` as a thin route over a new
  `services/interview-service.ts` orchestration layer; all decision logic lives
  in services.
- Added the authoritative API contract in `types/api.ts`:
  - Start: `{ sessionId, candidate }` → `{ reply: "Welcome. Let's begin your interview.", done: false }`.
  - Continue: `{ sessionId, message }` → `{ reply: "...", done: false }`.
  - Final: `{ reply: "Interview completed.", done: true, feedback: { summary, strengths[], gaps[], next[] } }`.
  - No separate GET endpoint; the route returns 200 / 400 / 404 / 500 / 502 / 503
    and never surfaces keys, headers, prompts, stack traces, or raw provider errors.
- Extended the engine (`services/interview-engine.ts`) with the M6 pieces while
  keeping it deterministic:
  - `startInterview(candidate, { sessionId })` (rejects a used `sessionId`).
  - `continueInterview(sessionId, answer, { evaluation })` stores the full turn
    (spec + question text + answer + evaluation) and advances the session.
  - `setCurrentQuestionText(sessionId, text)` records phrased questions.
  - Follow-up slotting: when the evaluator sets `followUpRecommended`, the
    engine replaces the planner's reserved Q8 follow-up slot with a synthetic
    follow-up probing the answered topic; otherwise it continues to the next
    planned question. Exactly one follow-up per interview, always 8 questions,
    no loops, no early termination.
  - Exported pure `resolveContinueState` so the service can phrase the next
    question before the engine commits the turn.
- Implemented `services/feedback.ts` (`buildFinalFeedback`): deterministic
  aggregation of stored evaluations into `summary` / `strengths` / `gaps` /
  `next` — no extra LLM call.
- Implemented `services/interview-service.ts`: welcome on turn 0 (no LLM call),
  first message phrases Q1, later messages are evaluated then answered with a
  follow-up or the next planned question; the engine commits state only after
  evaluation and phrasing succeed, so provider failures are retry-safe.
- Added `lib/validators.ts`: structural request validation (`member.id` string,
  `member.yearsExperience` finite ≥ 0, `missions` array, optional `signals`).
- Updated `types/interview.ts` (turn `questionText` + `evaluation`, session
  `currentQuestionText`/follow-up fields, `FinalFeedback`, new error code) and
  exported `types/api.ts` from `types/index.ts`.
- Updated `README.md` (API contract, turn semantics, status codes, env vars,
  pipeline, dev status) and this prompt log.

**Verification:** a temporary script (removed afterwards) exercised the service
with an injected mock client and the real HTTP route against a local mock
OpenAI-compatible server: turn semantics (no LLM call on turn 0), first-message
phrasing, evaluator receives every candidate answer, follow-up slotting
(triggered + not triggered, resumes next planned question, still 8 turns, no
infinite loop), completion + feedback shape, multi-session isolation, duplicate
`sessionId` → 400, unknown → 404, completed → 400, invalid bodies → 400, and
LLM failure mapping (502 / 500 / 503) with no state mutation: 46 checks, 0
failures. Lint, `tsc --noEmit`, and `next build` all pass.

**Explicitly deferred to later prompts (do not implement early):**

- Interview UI at `/interview` and a feedback report page
- Database, authentication, deployment, real provider configuration
  (only environment-variable documentation is provided)

**Status:** Complete.
