/**
 * Shape of the synthetic curriculum data in `data/curriculum.json`.
 * The file is currently an empty placeholder and will be populated
 * with the supplied synthetic curriculum in a later prompt.
 */
export interface Curriculum {
  id: string;
  title: string;
  description?: string;
  days: CurriculumDay[];
}

export interface CurriculumDay {
  day: number;
  title: string;
  description?: string;
  topics: string[];
}
