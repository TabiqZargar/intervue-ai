# Intervue AI

Intervue AI is an adaptive AI technical interview agent that conducts realistic,
multi-turn technical interviews personalized to a candidate's AI engineering
learning journey. It plans a question sequence from a curriculum, runs the
interview through an in-memory session engine, and will produce structured
feedback through a simple HTTP API (LLM and API are upcoming milestones).

## Pipeline

```text
Candidate
   → deterministic candidate analysis (analyzeCandidate)
   → personalized interview planning (createInterviewPlan)
   → interview state engine (createInterviewEngine)
   → session memory (createMemory) → conversation turns
   → next-question decision
   → future LLM service (question phrasing, answer evaluation — pending)
```

## Technology Stack

- Next.js (App Router) with React and TypeScript
- Tailwind CSS
- Local JSON data for curriculum and candidates
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
- LLM service, evaluator — pending
- `POST /api/interview` API route — pending
- Interview UI at `/interview` — pending
- Feedback generation — pending

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
