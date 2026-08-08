import type {
  Candidate,
  CandidateAnalysis,
  ExperienceLevel,
  HighAttemptMission,
  Mission,
  MissionRef,
  SkippedMission,
} from "@/types/candidate";
import rawCandidates from "@/data/candidates.json";

/** Missions at or above this many attempts are flagged as possible probing areas. */
const HIGH_ATTEMPT_THRESHOLD = 4;

const candidates = (rawCandidates as { candidates: Candidate[] }).candidates;

export function getCandidates(): Candidate[] {
  return candidates;
}

export function getCandidate(candidateId: string): Candidate | undefined {
  return candidates.find((candidate) => candidate.member.id === candidateId);
}

export function analyzeCandidate(candidate: Candidate): CandidateAnalysis {
  const passed: MissionRef[] = [];
  const failed: MissionRef[] = [];
  const skipped: MissionRef[] = [];
  const highAttempt: HighAttemptMission[] = [];
  const firstTryPassed: MissionRef[] = [];

  for (const mission of candidate.missions) {
    if (isSkippedMission(mission)) {
      skipped.push(toMissionRef(mission));
      continue;
    }

    const ref = toMissionRef(mission);
    if (mission.passed) {
      passed.push(ref);
      if (mission.attempts === 1) {
        firstTryPassed.push(ref);
      }
    } else {
      failed.push(ref);
    }

    if (mission.attempts >= HIGH_ATTEMPT_THRESHOLD) {
      highAttempt.push({ ...ref, attempts: mission.attempts });
    }
  }

  return {
    candidateId: candidate.member.id,
    profile: candidate.member,
    experienceLevel: getExperienceLevel(candidate.member.yearsExperience),
    missions: { passed, failed, skipped, highAttempt, firstTryPassed },
    counts: {
      recorded: candidate.missions.length,
      passed: passed.length,
      failed: failed.length,
      skipped: skipped.length,
    },
    signals: candidate.signals,
  };
}

function isSkippedMission(mission: Mission): mission is SkippedMission {
  return "skipped" in mission;
}

function toMissionRef(mission: Mission): MissionRef {
  return { day: mission.day, title: mission.title };
}

/**
 * Deterministic label derived from `yearsExperience`.
 * Raw experience is preserved in the analysis profile for downstream use.
 */
function getExperienceLevel(yearsExperience: number): ExperienceLevel {
  if (yearsExperience === 0) return "entry";
  if (yearsExperience <= 2) return "junior";
  if (yearsExperience <= 6) return "mid";
  if (yearsExperience <= 15) return "senior";
  return "expert";
}
