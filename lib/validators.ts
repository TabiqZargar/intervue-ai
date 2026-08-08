import type { Candidate } from "@/types/candidate";

/**
 * Request validation for POST /api/interview. Rejects structurally invalid
 * bodies with a typed result so the route can return 400 without reaching the
 * engine or the LLM provider.
 */

export type ParsedInterviewRequest =
  | { kind: "start"; sessionId: string; candidate: Candidate }
  | { kind: "continue"; sessionId: string; message: string };

export function parseInterviewRequest(raw: unknown): ParsedInterviewRequest | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }
  const body = raw as Record<string, unknown>;

  const sessionId = body.sessionId;
  if (typeof sessionId !== "string" || sessionId.trim() === "") {
    return null;
  }

  if ("candidate" in body) {
    if (!isCandidate(body.candidate)) {
      return null;
    }
    return { kind: "start", sessionId, candidate: body.candidate };
  }

  if ("message" in body) {
    if (typeof body.message !== "string") {
      return null;
    }
    return { kind: "continue", sessionId, message: body.message };
  }

  return null;
}

/**
 * Structural candidate validation: member.id is a non-empty string,
 * member.yearsExperience is a finite number >= 0, missions is an array, and
 * signals is optional (when present it must be an object). Additional profile
 * fields such as name/jobRole are not required for the lifecycle to run.
 */
export function isCandidate(value: unknown): value is Candidate {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;

  const member = candidate.member;
  if (typeof member !== "object" || member === null) {
    return false;
  }
  const profile = member as Record<string, unknown>;
  if (typeof profile.id !== "string" || profile.id.trim() === "") {
    return false;
  }
  if (
    typeof profile.yearsExperience !== "number" ||
    !Number.isFinite(profile.yearsExperience) ||
    profile.yearsExperience < 0
  ) {
    return false;
  }

  if (!Array.isArray(candidate.missions)) {
    return false;
  }

  if (
    candidate.signals !== undefined &&
    (typeof candidate.signals !== "object" || candidate.signals === null)
  ) {
    return false;
  }

  return true;
}
