export const COURSE_COLORS = [
  "bg-blue-200/80 border-blue-400 text-blue-900",
  "bg-emerald-200/80 border-emerald-400 text-emerald-900",
  "bg-violet-200/80 border-violet-400 text-violet-900",
  "bg-amber-200/80 border-cu-gold text-amber-900",
  "bg-rose-200/80 border-rose-400 text-rose-900",
  "bg-cyan-200/80 border-cyan-400 text-cyan-900",
  "bg-orange-200/80 border-orange-400 text-orange-900",
  "bg-teal-200/80 border-teal-400 text-teal-900",
  "bg-pink-200/80 border-pink-400 text-pink-900",
  "bg-indigo-200/80 border-indigo-400 text-indigo-900",
  "bg-lime-200/80 border-lime-400 text-lime-900",
  "bg-fuchsia-200/80 border-fuchsia-400 text-fuchsia-900"
];

export const COURSE_BG_SOLID = [
  "bg-blue-100",
  "bg-emerald-100",
  "bg-violet-100",
  "bg-amber-100",
  "bg-rose-100",
  "bg-cyan-100",
  "bg-orange-100",
  "bg-teal-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-lime-100",
  "bg-fuchsia-100"
];

export function getCourseColor(index: number): string {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

export function getCourseBg(index: number): string {
  return COURSE_BG_SOLID[index % COURSE_BG_SOLID.length];
}
