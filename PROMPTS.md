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

## Prompt 7 — Interview UI + API Integration

**Goal:** Build the real interview experience at `/interview` — a mobile-first
(390px) technical interview product that drives the existing `POST
/api/interview` backend. The backend was not redesigned; no service files
(`interview-engine`, `interview-service`, `memory`, `planner`, `llm`,
`evaluator`, `feedback`) and no API contract changes were made.

**What was done:**

- `lib/interview-api.ts` — typed client for `POST /api/interview`:
  - `startInterview(sessionId, candidate)` and `continueInterview(sessionId, message)`.
  - Every response is validated structurally (`done: false` reply, or
    `done: true` + `feedback.summary/strengths/gaps/next`); malformed bodies,
    non-JSON responses, network failures, and HTTP statuses (400/404/500/502/503)
    are normalized into human-safe messages. Server error text is never shown.
  - `createSessionId()` — `crypto.randomUUID()` with a fallback for non-secure
    contexts; a fresh id is generated per start attempt.
- New `components/interview/` directory:
  - `types.ts` — `ChatMessage`, `InterviewPhase` (selecting → starting →
    active → submitting → completed), `CandidateOption` + `toCandidateOption`,
    `experienceLabel` (mirrors the planner's experience derivation).
  - `Spinner.tsx`, `InterviewHeader.tsx` (Intervue AI / Technical Interview +
    candidate name/role/level), `ProgressIndicator.tsx` (Question N of 8,
    derived client-side from conversation state; first interviewer message is
    the welcome, so every later one is a question; no backend metadata), and
    `CandidateSelector.tsx` (real candidate data via `getCandidates()`, no mock
    dataset, no raw profile dump, aria-pressed cards, Start Interview).
  - `MessageList.tsx` (interviewer messages with strong hierarchy + aria-live,
    candidate answers right-aligned, auto-scroll to newest), `AnswerComposer.tsx`
    (labeled accessible textarea, Enter inserts a newline and never submits,
    explicit Submit button, disabled while in-flight), `ErrorBanner.tsx`
    (role="alert", human message + Try again), `FeedbackPanel.tsx` (Summary /
    Strengths / Areas to improve / Next steps stacked, using only the API's
    `feedback` fields — no invented score).
  - `InterviewClient.tsx` — the state machine (all 9 states: select, loading
    first question, active, submitting, loading next, API error, retry,
    completed, final feedback). A synchronous `busyRef` prevents duplicate
    submissions; the draft is cleared only on success, so a failed submission
    preserves the candidate's answer for retry. "Interview another candidate"
    resets the session.
- Rewrote `app/interview/page.tsx` as a server component that loads
  `getCandidates()` and passes the data into the client component (page stays
  static/SSG). Added a minimal `Start an interview` link on the landing page.
- Updated `README.md` (interview UI user flow + implementation notes) and this
  prompt log.

**Verification:**

- Temporary script (removed afterwards) unit-tested `lib/interview-api.ts` with
  a mocked `fetch`: start/continue success, final feedback shape, malformed
  JSON/body/feedback, 400/404/502/503 → generic messages with no internal leak
  (server error text never surfaced), network failure, unique session ids:
  21 checks, 0 failures.
- SSR smoke test of the production build: `GET /interview` returns 200 and
  server-renders the candidate selector with real candidate data and the
  Start button.
- `npm run lint`, `npx tsc --noEmit`, and `next build` all pass; `/interview`
  is prerendered as static content.

**Explicitly deferred to later prompts (do not implement early):**

- Landing page redesign, deployment, authentication, database
- Recruiter/dashboard/admin pages, voice, social integrations
- New agents or new backend architecture (the fixed 8-question contract is
  consumed as-is; the UI invents no topics or scores)

**Status:** Complete.

## Prompt 8 — Landing Page + Product Identity

**Goal:** Transform the minimal `/` page into a polished, mobile-first landing
page for Intervue AI that positions it as the AI technical interviewer for the
ABTalks AI Cohort, communicates what it is / who it is for / what makes it
different / how the interview works / why the feedback is useful, and routes
cleanly into `/interview`. No backend, API, or data changes.

**What was done:**

- Created `components/landing/` section components that reuse the interview
  UI's visual language (zinc surfaces, `border-zinc-200`/`dark:border-zinc-800`
  borders, `bg-indigo-600` rounded buttons, uppercase indigo kickers):
  - `LandingHeader.tsx` — sticky, backdrop-blur header: Intervue AI + "ABTalks
    AI Cohort" brand block and a Start Interview action → `/interview`.
  - `Hero.tsx` — headline "Turn your learning into interview confidence.",
    positioning copy, "Start Your Interview" CTA → `/interview`, and the
    `8 questions · Adaptive follow-ups · Actionable feedback` line.
  - `HowItWorks.tsx` — three simple numbered steps (Understand Your Journey /
    Interview Naturally / Learn From the Result).
  - `Comparison.tsx` — "Why Intervue AI": a restrained scripted-quiz vs.
    adaptive comparison (same questions / no context / fixed difficulty /
    generic feedback versus personalized questions / conversation context /
    adaptive follow-ups / actionable feedback).
  - `WhatYouGet.tsx` — four outcome cards (Personalized Interview, Technical
    Evaluation, Strengths & Gaps, Next Steps).
  - `FinalCta.tsx` — closing panel "Ready to test what you actually know?"
    with a Start Interview button → `/interview`.
  - `Footer.tsx` — minimal footer (brand + cohort), no fake links/contact/
    testimonials/statistics.
- Rewrote `app/page.tsx` to compose the sections and set metadata:
  - `title: { absolute: "Intervue AI — AI Technical Interviewer" }`
  - concise description explaining the product.
- Updated `README.md` (landing page section + development status) and this
  prompt log.

**Verification:**

- SSR smoke test of the production build: `GET /` returns 200 and contains the
  exact title tag, hero headline, all five sections, the footer, and CTA links
  with `href="/interview"`; `GET /interview` still returns 200 and renders the
  candidate selector (interview experience untouched).
- Layout review for 390px: single-column grids below `sm`, no fixed widths or
  `whitespace-nowrap` on long text, `min-h-[44px]` buttons, `px-4` padding —
  no horizontal overflow.
- `npm run lint`, `npx tsc --noEmit`, and `next build` all pass; `/` is
  prerendered as static content. `git status` confirms only `app/page.tsx` and
  new `components/landing/` files changed — no backend, data, or dependency
  changes.

**Explicitly deferred to later prompts (do not implement early):**

- New interview features, new AI agents, authentication, database
- Recruiter/dashboard/admin pages, voice, social integrations, analytics
- Backend architecture changes or unnecessary refactors

**Status:** Complete.

## Prompt 9 — Final Hardening, Compliance Audit & QA

**Goal:** Final hardening pass. Preserve the delivered API contract and the
8-question / 4+ curriculum-day guarantees, fix only real
correctness/compliance/reliability/actionable-feedback issues, run the full QA
gates, update docs, and report. No architecture changes, no data changes, no
new dependencies, no deployment, and no commits.

**What was done:**

- **Full audit (STEP 1):** read every type, lib, service, the API route, and
  the interview/landing components; traced the whole flow
  (analyzeCandidate → createInterviewPlan → engine → LLM phrasing → evaluator →
  resolveContinueState → complete → buildFinalFeedback → UI).
- **Feedback fix (STEP 2):** the deterministic aggregation previously emitted
  `next: []` whenever no answer scored ≤ 2, even when evaluator gaps existed.
  Rewrote `services/feedback.ts` with an exported
  `buildNextStepRecommendations(evaluations)`: weakest-first ordering (score,
  then question number), `GAP_SCORE_THRESHOLD = 3`, recommendations
  `Review <curriculumTitle> — <first evaluator gap>.` when gaps exist, fallback
  `Practice <objective> in <curriculumTitle>.` for scores ≤ 2 with no gaps,
  case-insensitive dedupe, `MAX_NEXT = 3`, empty when no meaningful gaps, and a
  trailing-period fix so gap phrases that already end in "." never produce
  "..". `buildSummary` and the `uniqueTop` dedupe/cap logic were kept.
- **Guarantee verification (STEP 3, 232 checks):** for all 20 real candidates —
  exactly 8 questions (numbers 1–8) with the deterministic purpose pattern, ≥ 4
  distinct curriculum days, difficulty curves by experience (with
  strong/struggling adjustment), one bounded follow-up that replaces Q8 (every
  interview completes in exactly 8 answers; no loop), session isolation across
  separate engines and interleaved sessions, and `resolveContinueState` purity.
- **API contract audit (STEP 4, 33 checks):** start/continue/final response
  shapes, status mapping (200/400/404/500/502/503), and no key/stack/provider-
  text leaks. Provider failure commits nothing and the same message retries
  once (no double-counting). Noted deviation: the supplied Technical
  Specification's start example shows `"candidate": "CAND-001"` (string id)
  while the implemented contract requires the full candidate object — the
  implemented contract was kept (the frontend and service depend on it).
- **Real-data audit (STEP 5):** curriculum (31 days) and candidates (20) load
  only from `data/*.json`; no hard-coded copies in code.
- **Edge cases (STEP 6, 33 checks):** malformed/JSON-non-object bodies, missing
  or blank `sessionId`, invalid candidate shapes, duplicate `sessionId`, unknown
  session, completed session, provider failure, LLM not configured (503), empty
  message, and simultaneous sessions — all handled with correct statuses.
- **390px + landing UX (STEPS 7–8):** single-column grids below `sm`, no fixed
  widths or unbreakable text, `min-h-[44px]` touch targets, all landing CTAs →
  `/interview`, no fake claims/testimonials/statistics.
- **Security (STEP 9):** grep clean (only doc-comment mentions of Bearer), no
  secrets in source or docs, `.env*` + `.env.local` ignored, and no `.env*`
  file ever committed.
- **Docs (STEP 10):** README updated to reflect the deterministic
  `buildNextStepRecommendations` aggregation; this prompt appended.

**Verification:**

- Temporary scripts unit-tested the planner/engine/feedback guarantees
  (`verify-m9.mts`, 232 checks) and the interview service/API contract with a
  stubbed LLM client (`verify-m9-api.mts`, 33 checks): 0 failures; both scripts
  removed afterwards.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.
- SSR smoke test of the production build: `GET /` and `GET /interview` return
  200 with expected content.

**Explicitly deferred to later prompts (do not implement early):**

- Deployment, authentication, database, persistence
- New interview features or new AI agents
- Backend architecture changes or unnecessary refactors

**Status:** Complete.

## Prompt 10 — Production Readiness, Deployment & Final Submission Audit

**Goal:** Final production-readiness and submission audit. No redesign, no
architecture changes, no dependency changes, no API contract changes, no data
changes, no commits, no git-history changes, no modifications or exposure of
`.env.local`.

**What was done:**

- **Repository audit:** verified `package.json` scripts, valid `tsconfig.json`,
  and the production route table. No debug logging in source
  (`app/components/lib/services/types`), no temporary verification scripts in
  the repository, no build artifacts tracked, no `.env*` file ever committed.
  Supplied data (`data/curriculum.json`, `data/candidates.json`), `README.md`,
  and `PROMPTS.md` present. A secrets scan over all tracked files found nothing.
- **Environment configuration:** `.env.local` defines `LLM_BASE_URL`,
  `LLM_API_KEY`, `LLM_MODEL`, and `LLM_TIMEOUT_MS`; no `NEXT_PUBLIC_*` keys
  exist; `process.env` is only read inside the server-side LLM service
  (`services/llm.ts`); client components never access the key; `.env.local` is
  untracked and git-ignored. The API key was never printed.
- **Production build:** `npm run lint`, `npx tsc --noEmit`, and `npm run build`
  all pass. Routes: `/` (static), `/interview` (static),
  `/api/interview` (dynamic/server-side, as required).
- **Production API smoke test:** started the production server and verified
  `POST /api/interview` with a real candidate object from the supplied data.
  The start request returns `200` with the exact welcome reply and
  `done: false`. The provider persistently returned HTTP 429 (rate limit /
  quota) for the LLM question-generation call, which the app correctly maps to
  `502` with a safe, secret-free error (`"LLM provider returned HTTP 429"`).
  After repeated retries with backoff the provider remained rate-limited, so
  the full live interview was NOT completed and no deployment claim is made.
  The complete lifecycle (including the final feedback shape) is covered by the
  deterministic stub-verified checks from Prompt 9.
- **Candidate contract:** the start request uses the full supplied candidate
  object (verified live); it was not changed to a candidate ID string.
- **390px UX check:** code review of `/` and `/interview` — single-column grids
  below `sm`, no fixed widths or unbreakable text, `min-h-[44px]` touch targets
  on every button, candidate selector and answer textarea are full-width,
  feedback and errors are readable, loading states are present, and all landing
  CTAs point to `/interview`. SSR re-check on the production build confirms both
  pages render with real data.
- **Landing-page submission check:** messaging covers Intervue AI, AI technical
  interviewing, personalized/adaptive interviews, follow-up questions, and
  actionable feedback; no fake statistics, testimonials, or logos.
- **Hackathon compliance:** verified Problem Statement 2 items (conversational
  interview, exactly 8 questions, ≥4 curriculum days, personalization, bounded
  follow-ups, context maintained, structured final feedback, required HTTP
  endpoint, supplied candidate/curriculum data used). Stage 1: repository is on
  GitHub (`TabiqZargar/intervue-ai`); deployment and team registration are
  human steps. Stage 2: `PROMPTS.md` reflects the actual process, history is
  milestone-based and unmodified, and no unrelated codebase was imported.
- **README:** added the genuinely missing required sections — a short
  Problem Statement, a Testing section, and a Deployment section (single
  in-memory instance note, server-side env config). No unnecessary rewrites.
- Appended this truthful Prompt 10 entry.

**Verification:**

- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.
- Production SSR smoke: `/` and `/interview` return 200 with expected content.
- Live API start/error-mapping verified; full live interview blocked by the
  provider's persistent HTTP 429 (external quota), reported truthfully — not
  fabricated as a pass.

**Explicitly deferred to later prompts (do not implement early):**

- Actual deployment, git push, and team registration (human steps)
- Authentication, database/persistence, new features

**Status:** Complete.

## Prompt 11 — Durable Session Storage with Upstash Redis

**Goal:** Replace the Vercel-unreliable in-memory session storage with Upstash
Redis persistence so interviews survive serverless invocations (the previous
behavior could fail mid-interview with "This interview session is no longer
active."). No architecture/API/engine/planner/LLM/evaluator/data changes; the
8-question / 4+ curriculum-day / bounded-follow-up guarantees, retry-safe
transitions, the memory abstraction, and all frontend behavior are preserved.
No auth, no new features, no complex schema. Stop after the report — no
commit/push/deploy.

**What was done:**

- **Dependency:** added `@upstash/redis` (only new dependency). Server-side
  env vars `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; never
  exposed to client code.
- **`services/memory.ts` rewrite:** the `MemoryStore` interface keeps the same
  methods (`createSession`, `getSession`, `updateSession`, `appendTurn`,
  `completeSession`, `deleteSession`, `clear`) but is now asynchronous so a
  remote store is possible. Added `createRedisSessionStore(redis)` storing each
  session as JSON under `intervue-ai:session:<sessionId>`, an in-memory
  fallback (`createMemory`), and a factory `createSessionStore(options)` with
  explicit environment detection: Redis when both env vars are present;
  in-memory in non-production without them; and a hard
  `SessionStoreConfigurationError` in production without them (fail fast —
  production never silently runs on memory).
- **Typed failures:** a `MemoryStoreError` (code `storage-failure`, generic
  message, cause kept server-side only) is thrown for read/write failures and
  corrupted payloads; "session not found" is still signalled with `undefined`
  — a Redis outage can never be misreported as "no longer active". A
  property-based `isMemoryStoreError` guard is used instead of `instanceof` so
  dual CJS/ESM module graphs (and bundlers) cannot break error detection.
- **`services/interview-engine.ts`:** all methods are async and await the
  store; `resolveContinueState` remains pure and the state machine is
  unchanged. The default singleton is now lazily constructed via
  `getInterviewEngine()` so a production build (which runs in `NODE_ENV=
  production` without the env vars) never fails at route-module evaluation —
  the store is only instantiated when a request arrives.
- **`services/interview-service.ts` + `app/api/interview/route.ts`:**
  orchestration awaits the async engine; `MemoryStoreError` is mapped to a
  controlled `500` with the safe message "interview session store is
  temporarily unavailable" (never 404, never a stack trace, never Redis
  credentials). The API contract and status codes are unchanged.
- **README:** updated Pipeline, Technology Stack, Development Status, HTTP
  API, Environment Variables (added the two Upstash vars, server-side only),
  Testing, and Deployment (no more single-instance / process-memory caveat);
  documents the explicit dev-vs-production store selection.
- Appended this truthful Prompt 11 entry.

**Verification:**

- Temporary script with a mocked Upstash Redis client (no live database, no
  real LLM calls): 98 checks, 0 failures, covering the required items —
  create/get, mutate/get-latest, appendTurn, complete, delete, session
  isolation + clear, unknown-vs-outage distinction (undefined vs
  `MemoryStoreError`, corrupt payload, no credential/stack leak in errors),
  the engine over the Redis store (full 8-answer run, bounded follow-up,
  `resolveContinueState` purity, outage → `MemoryStoreError` not
  `session-not-found`), planner guarantees for all 20 candidates (8 questions,
  4+ days), the API service over the Redis store with a stubbed LLM (welcome,
  full completion + feedback shape, 404 vs 500-on-outage, duplicate 400,
  invalid candidates 400, completed 400, provider-failure 502 retry-safe with
  no double-count, empty message 200, not-configured 503), factory selection
  (explicit injection, production-without-Redis refuses memory, production-
  with-vars builds a store, local-dev falls back to memory), and the lazy
  singleton.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass. Route
  table: `/` static, `/interview` static, `/api/interview` dynamic/server-side.
- Secrets scan over all tracked files: clean. Client-bundle scan: no
  `UPSTASH_REDIS_*`, no `sk-` keys, no `@upstash/redis`/memory module in the
  browser bundle (`process.env` is read only in `services/llm.ts` and
  `services/memory.ts`, both server-side).
- Dev-server API smoke (`POST /api/interview`): start → 200 exact welcome,
  duplicate session → 400, unknown session → 404, invalid body → 400, and the
  continue request → controlled 502 (the live LLM provider remained HTTP 429
  rate-limited as in Prompt 10) with no secret/stack leak — full live
  completion is still blocked by the provider quota and is covered by the
  stub-verified checks.

**Explicitly deferred to later prompts (do not implement early):**

- Actual deployment, git push, team registration (human steps)
- Authentication, new interview features
- A live Upstash database end-to-end check (requires real credentials) and
  Vercel env configuration (human steps)

**Status:** Complete.

## Prompt 12 — Fix Production 500 on Continue (Upstash JSON Auto-Deserialization)

**Goal:** Diagnose the production-only symptom after the Prompt 11 deployment:
the first `POST /api/interview` (start) returned 200 but the second (continue)
returned HTTP 500. No architecture/API/engine/planner/LLM/evaluator/frontend
changes, no new dependencies, no data migration. Stop after the report — no
commit/push/deploy.

**Symptom evidence:** Vercel logs for the failing invocation show
`POST logical-fly-174174.upstash.io/pipeline` and no external Gemini call —
the failure happened inside the session store (after the Redis round-trip,
before the LLM step).

**Root cause:** `@upstash/redis` (v1.38.2) enables **automatic JSON
deserialization by default** (`automaticDeserialization: true`): every command
result is passed through `parseResponse`/`JSON.parse`. It also enables
**auto-pipelining by default**, so commands are batched through `POST
/pipeline` (which is exactly what the Vercel log shows). The store
(`services/memory.ts`) writes each session as an opaque JSON string and reads
it back with `redis.get<string>` followed by an explicit `JSON.parse(raw)`. On
a real client, `get` therefore returned an **already-parsed object**, and
`JSON.parse(object)` coerces the object to `"[object Object]"`, throwing a
`SyntaxError`. `readSession` wraps that in a `MemoryStoreError`, and the route
maps it to the controlled 500. The write path was unaffected because `set`
returns `"OK"` (not JSON), which is why start worked but continue failed. The
Prompt 11 mock suite passed because its mock returned raw strings — the mock
inadvertently modeled `automaticDeserialization: false`, masking the real
client behavior.

**What was done:**

- **`services/memory.ts`:** the production Redis client is now constructed with
  `automaticDeserialization: false` in `createSessionStore`, so `get` returns
  the raw stored JSON string exactly as the store's explicit `JSON.parse` +
  shape validation expects. Sessions already stored in production Redis are raw
  JSON strings (`set` was unaffected), so no migration was needed.
- **`app/api/interview/route.ts`:** the memory-store 500 branch now logs a safe
  server-side diagnostic (`err.name` + `err.message` only — both generic, no
  session data, secrets, or stack traces); the client response is unchanged.

**Verification:**

- A temporary script ran a **real `@upstash/redis` client against a mock
  Upstash REST server** (no live database, no LLM calls): reproduced the bug
  exactly — `get` returned an object, `JSON.parse` on it threw `SyntaxError`,
  `createRedisSessionStore.getSession` surfaced `MemoryStoreError`, and all
  traffic went through `/pipeline` matching the production log — then confirmed
  the fix via `createRedisSessionStore` and the production factory path
  (`createSessionStore` from env vars): get/append-turn/unknown-404/complete/
  delete all round-trip. 11 checks, 0 failures.
- The full Prompt 11 suite (98 mocked checks) still passes; `npm run lint`,
  `npx tsc --noEmit`, and `npm run build` all pass; `/api/interview` remains
  dynamic/server-side.

**Deferred (human steps, unchanged from Prompt 11):** real deployment, git
push, Vercel/Upstash env configuration, live end-to-end confirmation.

**Status:** Complete.

## Prompt 13 — Safe Provider-Error Diagnostic (Gemini HTTP Status)

**Goal:** Diagnostic-only. Identify exactly which HTTP status the Gemini
compatible provider is returning when `POST /api/interview` produces a 502, by
adding minimal server-side logging at the provider HTTP failure boundary. No
architecture, API contract, retry, engine, planner, evaluator schema,
persistence, or frontend changes. Stop after the report — no commit/push/deploy.

**Existing provider error path (traced, unchanged):**

1. `fetchTransport` (`services/llm.ts`) POSTs `{baseUrl}/chat/completions`; on a
   non-2xx response it throws `ProviderHttpError(response.status)`.
2. `createLlmClient.chat()` catches and maps it via `mapTransportError` to a
   typed `LlmServiceError { code: "http", message: "LLM provider returned HTTP
   <status>" }`.
3. `generateInterviewQuestion` (`services/llm.ts`) or `evaluateAnswer`
   (`services/evaluator.ts`) returns the failing `LlmCallResult`.
4. `interview-service.ts` `llmErrorToHttp` maps `code: "http"` to `502` with the
   safe message; the route returns it to the browser.

**Status availability:** the HTTP status was already available internally — as
`ProviderHttpError.status` (and embedded in the safe message) — but it was
**never logged**. The browser already receives only the safe 502 body; this
change adds server-side visibility only.

**What was done (diagnostic logging only):**

- `types/llm.ts`: added `LlmOperation = "question_generation" | "evaluation"`.
- `services/llm.ts`: `LlmClient.chat` options gained an optional `operation`;
  `generateInterviewQuestion` passes `operation: "question_generation"`;
  `mapTransportError` now logs exactly one line for `ProviderHttpError`:
  `[llm] provider_http_error status=<status> operation=<operation|unknown>`.
- `services/evaluator.ts`: `evaluateAnswer` passes `operation: "evaluation"`.

**Guaranteed safe:** the log contains only the numeric HTTP status and the
operation label. It never logs the API key, authorization headers, Upstash
credentials, request headers, prompts, candidate data, answers, provider
response bodies, stack traces, session contents, or personal information.
Network and timeout errors log nothing.

**Verification:**

- `npm run lint`, `npx tsc --noEmit`, `npm run build` all pass; `/api/interview`
  remains dynamic/server-side.
- Temporary mock-transport test (outside the repo, no real Gemini call, no live
  database): 11 checks, 0 failures — a mocked 429 logs exactly
  `[llm] provider_http_error status=429 operation=question_generation`, a mocked
  400 logs exactly `status=400 operation=evaluation`, the typed error behavior
  is unchanged (`code: "http"`, same safe message → same 502 mapping), network
  and timeout errors log nothing, and no API key / prompt / answer / response
  body / candidate name / authorization header appears in any captured log.
- Prompt 11 suite (98 mocked checks) and Prompt 12 repro (11 checks) still pass.

**Status:** Complete.

## Prompt 14 — Final UI/UX Polish

**Goal:** Polish the existing Intervue AI interface for the final hackathon
submission without changing backend behavior, interview logic, API contracts,
data, or dependencies.

**What was done:**

- Improved `ProgressIndicator` with a clearer "Question X of 8" presentation,
  a percentage indicator, and a stronger progress track/fill.
- Improved `MessageList` with clearer interviewer/candidate visual
  distinction, interviewer labels, accent treatment, and a pending evaluation
  state.
- Improved `AnswerComposer` with stronger focus states, clearer
  loading/disabled states, improved button touch targets, and contextual
  helper text.
- Improved `ErrorBanner` with clearer hierarchy, a prominent retry action, and
  messaging confirming that an active session can be retried without losing
  progress.
- Improved `FeedbackPanel` with a stronger heading hierarchy, a highlighted
  summary area, numbered markers, and clearer visual separation between
  strengths, gaps, and next steps.
- Improved `CandidateSelector` and `InterviewHeader` with stronger typography,
  spacing, and subtle visual hierarchy.
- Polished the landing page components (`Hero`, `HowItWorks`, `WhatYouGet`,
  `Comparison`, `FinalCta`, `LandingHeader`, `Footer`) for consistent
  typography, badges, hover states, spacing, and overall product identity.
- Maintained the existing responsive/mobile-first behavior and
  accessibility-oriented touch targets.

**Scope:** UI/UX only. No changes to `services/`, `lib/`, `types/`, `data/`,
API routes, interview engine, LLM integration, Redis/session storage, or
environment configuration. No new dependencies. Existing API contracts and
interview behavior remain unchanged.

**Verification:**

- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass.
- `/` and `/interview` remain static; `/api/interview` remains
  dynamic/server-rendered.
- Existing interview functionality and backend behavior remain unchanged.

**Commit:** `396c924 feat: polish interview and landing page UI`

**Status:** Complete.
