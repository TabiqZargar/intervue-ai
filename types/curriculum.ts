/**
 * Shape of the synthetic curriculum data in `data/curriculum.json`.
 * The file is the source of truth for the curriculum and must not be edited
 * by application code.
 */
export interface CurriculumModule {
  n: number;
  title: string;
  /** Day numbers covered by the module. Supplied as a [start, end] range. */
  days: number[];
}

export interface CurriculumDay {
  day: number;
  title: string;
  type: string;
  tools: string[];
  objectives: string[];
}

export interface Curriculum {
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}
