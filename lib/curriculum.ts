import type { Curriculum } from "@/types/curriculum";
import rawCurriculum from "@/data/curriculum.json";

export function loadCurriculum(): Curriculum {
  return rawCurriculum as Curriculum;
}
