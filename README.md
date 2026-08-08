# Intervue AI

Intervue AI is an adaptive AI technical interview agent that conducts realistic,
multi-turn technical interviews personalized to a candidate's AI engineering
learning journey. It plans a question sequence from a curriculum, adapts with
intelligent follow-up questions, maintains interview context, and produces
structured feedback through a simple HTTP API.

## Technology Stack

- Next.js (App Router) with React and TypeScript
- Tailwind CSS
- Local JSON data for curriculum and candidates
- No database, no authentication

## Development Status

- Project scaffold (Next.js, TypeScript, Tailwind CSS) — done
- Landing page at `/` — done
- Type definitions for curriculum, candidates, and interviews — done
- Data placeholders (`data/curriculum.json`, `data/candidates.json`) — done
- Interview planner, engine, memory, evaluator, LLM service — pending
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
