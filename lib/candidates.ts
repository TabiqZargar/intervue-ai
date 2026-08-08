import type { Candidate } from "@/types/candidate";
import rawCandidates from "@/data/candidates.json";

export function loadCandidates(): Candidate[] {
  return (rawCandidates as { candidates: Candidate[] }).candidates;
}
