import type { ProfessorRating, CacheEntry } from "../types.js";
import rmpPkg from "@domattheshack/rate-my-professors";
// @ts-ignore
const rmp = rmpPkg.default as typeof rmpPkg;

const CACHE_TTL = 10 * 60 * 1000;

const cache = new Map<string, CacheEntry<ProfessorRating | null>>();
const schoolId = "U2Nob29sLTEwODc=";

async function getTeacherDetails(teacherId: string): Promise<ProfessorRating | null> {
  const t = await rmp.getTeacher(teacherId);

  return {
    firstName: t.firstName,
    lastName: t.lastName,
    avgRating: t.avgRating,
    avgDifficulty: t.avgDifficulty,
    numRatings: t.numRatings,
    wouldTakeAgainPercent: t.wouldTakeAgainPercent,
    department: t.department,
    link: `https://www.ratemyprofessors.com/professor/${t.legacyId}`
  };
}

export async function getProfessorRating(name: string): Promise<ProfessorRating | null> {
  const cacheKey = name.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.data;

  try {
    const [teacher] = await rmp.searchTeacher(name, schoolId);
    if (!teacher) {
      cache.set(cacheKey, { data: null, expiry: Date.now() + CACHE_TTL });
      return null;
    }

    const rating = await getTeacherDetails(teacher.id);
    cache.set(cacheKey, { data: rating, expiry: Date.now() + CACHE_TTL });
    return rating;
  } catch (err) {
    console.error("RMP lookup failed:", err);
    return null;
  }
}
