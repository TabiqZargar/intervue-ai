/**
 * Shape of the synthetic candidate data in `data/candidates.json`.
 * The file is currently an empty placeholder and will be populated
 * with the supplied synthetic candidates in a later prompt.
 */
export interface Candidate {
  id: string;
  name: string;
  learning: LearningData;
}

export interface LearningData {
  progress: DayProgress[];
  strengths?: string[];
  areasToImprove?: string[];
}

export interface DayProgress {
  day: number;
  status: "not-started" | "in-progress" | "completed";
  score?: number;
  topicsCompleted?: string[];
  lastStudiedAt?: string;
}
