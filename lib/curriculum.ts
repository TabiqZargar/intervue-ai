import type {
  Curriculum,
  CurriculumDay,
  CurriculumModule,
} from "@/types/curriculum";
import rawCurriculum from "@/data/curriculum.json";

const curriculum = rawCurriculum as Curriculum;

export function getCurriculum(): Curriculum {
  return curriculum;
}

export function getDay(dayNumber: number): CurriculumDay | undefined {
  return curriculum.days.find((day) => day.day === dayNumber);
}

export function getModule(moduleNumber: number): CurriculumModule | undefined {
  return curriculum.modules.find((module) => module.n === moduleNumber);
}

export function getDaysForModule(moduleNumber: number): CurriculumDay[] {
  const curriculumModule = getModule(moduleNumber);
  if (!curriculumModule) {
    return [];
  }

  const byDay = new Map<number, CurriculumDay>();
  for (const day of curriculum.days) {
    byDay.set(day.day, day);
  }

  return expandModuleDays(curriculumModule.days).flatMap((dayNumber) => {
    const day = byDay.get(dayNumber);
    return day ? [day] : [];
  });
}

/**
 * Module `days` are supplied as a [start, end] inclusive range.
 * Falls back to treating each entry as an explicit day number otherwise.
 */
function expandModuleDays(dayNumbers: number[]): number[] {
  const [start, end] = dayNumbers;
  if (dayNumbers.length === 2 && start <= end) {
    const range: number[] = [];
    for (let dayNumber = start; dayNumber <= end; dayNumber++) {
      range.push(dayNumber);
    }
    return range;
  }
  return dayNumbers;
}
