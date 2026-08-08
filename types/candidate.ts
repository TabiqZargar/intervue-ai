/**
 * Shape of the synthetic candidate data in `data/candidates.json`.
 * The file is the source of truth for candidates and must not be edited
 * by application code.
 */
export interface Member {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  status: string;
}

export interface MissionBase {
  day: number;
  title: string;
}

/** A mission the candidate attempted: it was either passed or failed. */
export interface AttemptedMission extends MissionBase {
  passed: boolean;
  attempts: number;
}

/** A mission the candidate skipped. It carries no pass/attempt information. */
export interface SkippedMission extends MissionBase {
  skipped: true;
}

export type Mission = AttemptedMission | SkippedMission;

export interface CandidateSignals {
  commitDays: number;
  missionsCompleted: number;
  missionsFirstTry: number;
}

export interface Candidate {
  member: Member;
  missions: Mission[];
  signals: CandidateSignals;
}

export interface CandidatesData {
  candidates: Candidate[];
}

/**
 * Derived experience label based on `yearsExperience`.
 * Kept deterministic so the Interview Planner can rely on it.
 */
export type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "expert";

export interface MissionRef {
  day: number;
  title: string;
}

export interface HighAttemptMission extends MissionRef {
  attempts: number;
}

export interface CandidateMissionAnalysis {
  /** Missions passed (completed). */
  passed: MissionRef[];
  /** Missions attempted but failed (`passed: false`). */
  failed: MissionRef[];
  /** Missions skipped by the candidate. A gap/avoidance signal, not proof of missing knowledge. */
  skipped: MissionRef[];
  /** Missions that took many attempts — candidates for deeper probing. */
  highAttempt: HighAttemptMission[];
  /** Missions passed on the first attempt — potential strengths. */
  firstTryPassed: MissionRef[];
}

export interface CandidateCounts {
  /** Total mission records present for the candidate. */
  recorded: number;
  passed: number;
  failed: number;
  skipped: number;
}

/**
 * Compact, deterministic summary of a candidate's learning journey,
 * produced for the future Interview Planner.
 */
export interface CandidateAnalysis {
  candidateId: string;
  profile: Member;
  experienceLevel: ExperienceLevel;
  missions: CandidateMissionAnalysis;
  counts: CandidateCounts;
  signals: CandidateSignals;
}
