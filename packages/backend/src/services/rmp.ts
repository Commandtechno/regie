import type { ProfessorRating, CacheEntry } from "../types.js";

const RMP_GRAPHQL = "https://www.ratemyprofessors.com/graphql";
const RMP_AUTH = "Basic dGVzdDp0ZXN0";
const CACHE_TTL = 10 * 60 * 1000;

const cache = new Map<string, CacheEntry<ProfessorRating | null>>();
let schoolId: string | null = null;

async function rmpQuery(query: string, variables: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(RMP_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: RMP_AUTH,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`RMP API error: ${res.status}`);
  const json = (await res.json()) as { data: unknown };
  return json.data;
}

async function getSchoolId(): Promise<string> {
  if (schoolId) return schoolId;

  const data = (await rmpQuery(
    `query AutocompleteSearchQuery($query: String!) {
      autocomplete(query: $query) {
        schools {
          edges {
            node { id, name, city, state }
          }
        }
      }
    }`,
    { query: "University of Colorado Boulder" }
  )) as {
    autocomplete: {
      schools: {
        edges: Array<{ node: { id: string; name: string; city: string; state: string } }>;
      };
    };
  };

  const schools = data.autocomplete.schools.edges;
  const cuBoulder = schools.find(
    (e) =>
      e.node.name.includes("University of Colorado") &&
      e.node.name.includes("Boulder")
  );

  if (!cuBoulder) throw new Error("CU Boulder not found on RateMyProfessors");

  schoolId = cuBoulder.node.id;
  return schoolId;
}

async function searchTeacher(name: string, sid: string): Promise<string | null> {
  const data = (await rmpQuery(
    `query NewSearchTeachersQuery($text: String!, $schoolID: ID!) {
      newSearch {
        teachers(query: { text: $text, schoolID: $schoolID }) {
          edges {
            node { id, firstName, lastName, school { name, id } }
          }
        }
      }
    }`,
    { text: name, schoolID: sid }
  )) as {
    newSearch: {
      teachers: {
        edges: Array<{
          node: { id: string; firstName: string; lastName: string; school: { name: string; id: string } };
        }>;
      };
    };
  };

  const teachers = data.newSearch.teachers.edges;
  if (teachers.length === 0) return null;

  return teachers[0].node.id;
}

async function getTeacherDetails(teacherId: string): Promise<ProfessorRating | null> {
  const data = (await rmpQuery(
    `query TeacherRatingsPageQuery($id: ID!) {
      node(id: $id) {
        ... on Teacher {
          id, firstName, lastName, avgDifficulty, avgRating, numRatings,
          department, wouldTakeAgainPercent, legacyId,
          school { name, id, city, state }
        }
      }
    }`,
    { id: teacherId }
  )) as {
    node: {
      id: string;
      firstName: string;
      lastName: string;
      avgDifficulty: number;
      avgRating: number;
      numRatings: number;
      department: string;
      wouldTakeAgainPercent: number;
      legacyId: number;
    } | null;
  };

  if (!data.node) return null;

  const t = data.node;
  return {
    firstName: t.firstName,
    lastName: t.lastName,
    avgRating: t.avgRating,
    avgDifficulty: t.avgDifficulty,
    numRatings: t.numRatings,
    wouldTakeAgainPercent: t.wouldTakeAgainPercent,
    department: t.department,
    link: `https://www.ratemyprofessors.com/professor/${t.legacyId}`,
  };
}

export async function getProfessorRating(name: string): Promise<ProfessorRating | null> {
  const cacheKey = name.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.data;

  try {
    const sid = await getSchoolId();
    const teacherId = await searchTeacher(name, sid);
    if (!teacherId) {
      cache.set(cacheKey, { data: null, expiry: Date.now() + CACHE_TTL });
      return null;
    }

    const rating = await getTeacherDetails(teacherId);
    cache.set(cacheKey, { data: rating, expiry: Date.now() + CACHE_TTL });
    return rating;
  } catch (err) {
    console.error("RMP lookup failed:", err);
    return null;
  }
}
