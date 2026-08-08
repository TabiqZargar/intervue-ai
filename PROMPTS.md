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
