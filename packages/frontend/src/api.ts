import type { CoursesResponse, DepartmentsResponse, ProfessorRating, SearchParams, GroupedCoursesResponse } from "./types.ts";

const BASE = "/api";

export async function searchCourses(params: SearchParams): Promise<CoursesResponse> {
  const url = new URL(`${BASE}/courses`, window.location.origin);
  if (params.q) url.searchParams.set("q", params.q);
  if (params.department) url.searchParams.set("department", params.department);
  if (params.level) url.searchParams.set("level", params.level);
  if (params.schd) url.searchParams.set("schd", params.schd);
  if (params.career) url.searchParams.set("career", params.career);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function searchCoursesGrouped(params: SearchParams): Promise<GroupedCoursesResponse> {
  const url = new URL(`${BASE}/courses`, window.location.origin);
  url.searchParams.set("grouped", "true");
  if (params.q) url.searchParams.set("q", params.q);
  if (params.department) url.searchParams.set("department", params.department);
  if (params.level) url.searchParams.set("level", params.level);
  if (params.schd) url.searchParams.set("schd", params.schd);
  if (params.career) url.searchParams.set("career", params.career);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getCourse(crn: string): Promise<CoursesResponse> {
  const res = await fetch(`${BASE}/courses/${crn}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getDepartments(): Promise<DepartmentsResponse> {
  const res = await fetch(`${BASE}/departments`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getProfessorRating(name: string): Promise<ProfessorRating | null> {
  const res = await fetch(`${BASE}/professors/rating?name=${encodeURIComponent(name)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
