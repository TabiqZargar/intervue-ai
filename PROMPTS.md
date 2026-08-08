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
