export const COURSE_COLORS = [
  "bg-blue-200/80 border-blue-400 text-blue-900 dark:bg-blue-800/60 dark:border-blue-500 dark:text-blue-100",
  "bg-emerald-200/80 border-emerald-400 text-emerald-900 dark:bg-emerald-800/60 dark:border-emerald-500 dark:text-emerald-100",
  "bg-violet-200/80 border-violet-400 text-violet-900 dark:bg-violet-800/60 dark:border-violet-500 dark:text-violet-100",
  "bg-amber-200/80 border-cu-gold text-amber-900 dark:bg-amber-800/60 dark:border-cu-gold dark:text-amber-100",
  "bg-rose-200/80 border-rose-400 text-rose-900 dark:bg-rose-800/60 dark:border-rose-500 dark:text-rose-100",
  "bg-cyan-200/80 border-cyan-400 text-cyan-900 dark:bg-cyan-800/60 dark:border-cyan-500 dark:text-cyan-100",
  "bg-orange-200/80 border-orange-400 text-orange-900 dark:bg-orange-800/60 dark:border-orange-500 dark:text-orange-100",
  "bg-teal-200/80 border-teal-400 text-teal-900 dark:bg-teal-800/60 dark:border-teal-500 dark:text-teal-100",
  "bg-pink-200/80 border-pink-400 text-pink-900 dark:bg-pink-800/60 dark:border-pink-500 dark:text-pink-100",
  "bg-indigo-200/80 border-indigo-400 text-indigo-900 dark:bg-indigo-800/60 dark:border-indigo-500 dark:text-indigo-100",
  "bg-lime-200/80 border-lime-400 text-lime-900 dark:bg-lime-800/60 dark:border-lime-500 dark:text-lime-100",
  "bg-fuchsia-200/80 border-fuchsia-400 text-fuchsia-900 dark:bg-fuchsia-800/60 dark:border-fuchsia-500 dark:text-fuchsia-100"
];

export const COURSE_BG_SOLID = [
  "bg-blue-100 dark:bg-blue-900/40",
  "bg-emerald-100 dark:bg-emerald-900/40",
  "bg-violet-100 dark:bg-violet-900/40",
  "bg-amber-100 dark:bg-amber-900/40",
  "bg-rose-100 dark:bg-rose-900/40",
  "bg-cyan-100 dark:bg-cyan-900/40",
  "bg-orange-100 dark:bg-orange-900/40",
  "bg-teal-100 dark:bg-teal-900/40",
  "bg-pink-100 dark:bg-pink-900/40",
  "bg-indigo-100 dark:bg-indigo-900/40",
  "bg-lime-100 dark:bg-lime-900/40",
  "bg-fuchsia-100 dark:bg-fuchsia-900/40"
];

export function getCourseColor(index: number): string {
  return COURSE_COLORS[index % COURSE_COLORS.length];
}

export function getCourseBg(index: number): string {
  return COURSE_BG_SOLID[index % COURSE_BG_SOLID.length];
}
