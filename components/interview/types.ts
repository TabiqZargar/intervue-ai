import type { Candidate } from "@/types/candidate";
import type { FinalFeedback } from "@/types/interview";

/** A single rendered message in the interview conversation. */
export interface ChatMessage {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
}

/** Coarse state of the interview experience. */
export type InterviewPhase =
  | "selecting"
  | "starting"
  | "active"
  | "submitting"
  | "completed";

/** A candidate as rendered by the client. */
export interface CandidateOption {
  id: string;
  name: string;
  jobRole: string;
  yearsExperience: number;
  education: string;
  missionsCompleted: number;
}

export function toCandidateOption(candidate: Candidate): CandidateOption {
  return {
    id: candidate.member.id,
    name: candidate.member.name,
    jobRole: candidate.member.jobRole,
    yearsExperience: candidate.member.yearsExperience,
    education: candidate.member.education,
    missionsCompleted: candidate.signals.missionsCompleted,
  };
}

/** Deterministic level label mirroring the planner's experience derivation. */
export function experienceLabel(yearsExperience: number): string {
  if (yearsExperience === 0) return "Entry level";
  if (yearsExperience <= 2) return "Junior";
  if (yearsExperience <= 6) return "Mid-level";
  if (yearsExperience <= 15) return "Senior";
  return "Expert";
}

export type FinalFeedbackState = FinalFeedback | null;
