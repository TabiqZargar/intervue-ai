import type {
  Candidate,
  CandidateAnalysis,
  ExperienceLevel,
} from "@/types/candidate";
import type { CurriculumDay } from "@/types/curriculum";
import type {
  InterviewPlan,
  PlannedQuestion,
  QuestionDifficulty,
  QuestionPurpose,
} from "@/types/planner";
import { analyzeCandidate } from "@/lib/candidates";
import { getCurriculum, getDay } from "@/lib/curriculum";

const REQUIRED_CURRICULUM_DAYS = 4;

/**
 * Slot template for a single interview.
 * 8 slots satisfy the "at least 8 questions" requirement. The slot pattern
 * produces a deterministic mix of purposes; "probe" and "follow-up" are
 * reserved slots — answer-dependent follow-ups are a later milestone.
 */
const SLOT_PATTERN: readonly QuestionSlot[] = [
  { index: 1, purpose: "core" },
  { index: 2, purpose: "core" },
  { index: 3, purpose: "probe" },
  { index: 4, purpose: "core" },
  { index: 5, purpose: "probe" },
  { index: 6, purpose: "core" },
  { index: 7, purpose: "stretch" },
  { index: 8, purpose: "follow-up" },
];

const DIFFICULTY_CURVES: Record<ExperienceLevel, readonly QuestionDifficulty[]> =
  {
    entry: ["easy", "easy", "easy", "easy", "medium", "medium", "medium", "hard"],
    junior: [
      "easy",
      "easy",
      "medium",
      "medium",
      "medium",
      "medium",
      "hard",
      "hard",
    ],
    mid: ["easy", "medium", "medium", "medium", "medium", "hard", "hard", "hard"],
    senior: [
      "medium",
      "medium",
      "medium",
      "medium",
      "hard",
      "hard",
      "hard",
      "hard",
    ],
    expert: [
      "medium",
      "medium",
      "medium",
      "hard",
      "hard",
      "hard",
      "hard",
      "hard",
    ],
  };

const LEVEL_ORDER: readonly ExperienceLevel[] = [
  "entry",
  "junior",
  "mid",
  "senior",
  "expert",
];

interface QuestionSlot {
  index: number;
  purpose: QuestionPurpose;
}

interface DayPools {
  /** Days the candidate passed — the main source of technical questioning. */
  passedDays: CurriculumDay[];
  /** Days passed on the first attempt — potential strengths. */
  strengthDays: CurriculumDay[];
  /**
   * Days worth attention: failed missions first, then high-attempt missions,
   * then skipped missions. Used for probe/follow-up slots.
   */
  attentionDays: CurriculumDay[];
  /** Days the candidate skipped — knowledge-gap exploration anchors. */
  gapDays: CurriculumDay[];
  /** Every curriculum day, as a deterministic fallback pool. */
  curriculumDays: CurriculumDay[];
}

export function createInterviewPlan(candidate: Candidate): InterviewPlan {
  const analysis = analyzeCandidate(candidate);
  const pools = buildDayPools(analysis);
  const difficulties = getDifficultyCurve(analysis);

  const usedDays = new Set<number>();
  const occurrences = new Map<number, number>();
  const questions: PlannedQuestion[] = [];
  let anchorDay: CurriculumDay | undefined;

  for (const slot of SLOT_PATTERN) {
    const day = selectDay(slot.purpose, pools, usedDays, anchorDay);
    usedDays.add(day.day);
    if (slot.purpose === "core") {
      anchorDay = day;
    }
    questions.push(
      buildQuestion(slot, day, difficulties[slot.index - 1], occurrences),
    );
  }

  const coveredDays = [...usedDays].sort((a, b) => a - b);

  return {
    totalQuestions: questions.length,
    requiredCurriculumDays: REQUIRED_CURRICULUM_DAYS,
    coveredDays,
    questions,
  };
}

function buildDayPools(analysis: CandidateAnalysis): DayPools {
  const failedDays = uniqueDays(analysis.missions.failed);
  const probeDays = uniqueDays(analysis.missions.highAttempt);
  const gapDays = uniqueDays(analysis.missions.skipped);

  return {
    passedDays: uniqueDays(analysis.missions.passed),
    strengthDays: uniqueDays(analysis.missions.firstTryPassed),
    attentionDays: mergePools(failedDays, probeDays, gapDays),
    gapDays,
    curriculumDays: getCurriculum().days
      .slice()
      .sort((a, b) => a.day - b.day),
  };
}

function selectDay(
  purpose: QuestionPurpose,
  pools: DayPools,
  usedDays: Set<number>,
  anchorDay: CurriculumDay | undefined,
): CurriculumDay {
  switch (purpose) {
    case "probe":
      return (
        firstUnused(pools.attentionDays, usedDays) ??
        firstUnused(pools.passedDays, usedDays) ??
        pools.attentionDays[0] ??
        pools.curriculumDays[0]
      );
    case "stretch":
      return (
        firstUnused(pools.strengthDays, usedDays) ??
        firstUnused(pools.passedDays, usedDays) ??
        firstUnused(pools.curriculumDays, usedDays) ??
        pools.curriculumDays[0]
      );
    case "follow-up":
      return (
        firstUnused(pools.gapDays, usedDays) ??
        firstUnused(pools.attentionDays, usedDays) ??
        anchorDay ??
        pools.passedDays[0] ??
        pools.curriculumDays[0]
      );
    default:
      return (
        firstUnused(pools.passedDays, usedDays) ??
        firstUnused(pools.curriculumDays, usedDays) ??
        pools.curriculumDays[0]
      );
  }
}

function buildQuestion(
  slot: QuestionSlot,
  day: CurriculumDay,
  difficulty: QuestionDifficulty,
  occurrences: Map<number, number>,
): PlannedQuestion {
  const count = occurrences.get(day.day) ?? 0;
  occurrences.set(day.day, count + 1);

  const objectives = day.objectives;
  const objective =
    objectives.length === 0 ? "" : objectives[count % objectives.length];

  return {
    questionNumber: slot.index,
    curriculumDay: day.day,
    curriculumTitle: day.title,
    objective,
    purpose: slot.purpose,
    difficulty,
  };
}

/**
 * Maps candidate mission days to curriculum days, deduplicating by day and
 * keeping a stable ascending order.
 */
function uniqueDays(refs: readonly { day: number }[]): CurriculumDay[] {
  const seen = new Set<number>();
  const days: CurriculumDay[] = [];
  for (const ref of refs) {
    if (seen.has(ref.day)) {
      continue;
    }
    seen.add(ref.day);
    const day = getDay(ref.day);
    if (day) {
      days.push(day);
    }
  }
  days.sort((a, b) => a.day - b.day);
  return days;
}

function mergePools(...pools: readonly CurriculumDay[][]): CurriculumDay[] {
  const seen = new Set<number>();
  const merged: CurriculumDay[] = [];
  for (const pool of pools) {
    for (const day of pool) {
      if (seen.has(day.day)) {
        continue;
      }
      seen.add(day.day);
      merged.push(day);
    }
  }
  return merged;
}

function firstUnused(
  days: readonly CurriculumDay[],
  usedDays: Set<number>,
): CurriculumDay | undefined {
  return days.find((day) => !usedDays.has(day.day));
}

/**
 * Deterministic difficulty curve: experience level plus a simple learning
 * signal adjustment. Never produces an all-hard interview.
 */
function getDifficultyCurve(
  analysis: CandidateAnalysis,
): readonly QuestionDifficulty[] {
  const recorded = analysis.counts.recorded;
  const strong =
    recorded > 0 &&
    analysis.missions.firstTryPassed.length / recorded >= 0.5;
  const struggling =
    analysis.counts.failed >= 3 && analysis.missions.firstTryPassed.length === 0;

  const level = struggling
    ? levelDown(analysis.experienceLevel)
    : strong
      ? levelUp(analysis.experienceLevel)
      : analysis.experienceLevel;

  return DIFFICULTY_CURVES[level];
}

function levelUp(level: ExperienceLevel): ExperienceLevel {
  const index = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.min(index + 1, LEVEL_ORDER.length - 1)];
}

function levelDown(level: ExperienceLevel): ExperienceLevel {
  const index = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.max(index - 1, 0)];
}
