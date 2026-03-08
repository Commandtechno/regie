import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Course, CourseGroup, Department } from "../types.ts";
import SearchBar from "./SearchBar.tsx";
import FilterBar from "./FilterBar.tsx";
import CourseCard from "./CourseCard.tsx";
import ConflictDialog from "./ConflictDialog.tsx";
import Pagination from "./Pagination.tsx";
import { hasConflict } from "../utils/conflicts.ts";

interface Props {
  query: string;
  setQuery: (v: string) => void;
  filters: Record<string, string | undefined>;
  updateFilters: (f: Record<string, string | undefined>) => void;
  results: CourseGroup[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  goToPage: (page: number) => void;
  departments: Department[];
  scheduledCourses: Course[];
  wishlist: Course[];
  onAddCourse: (course: Course) => void;
  onAddToWishlist: (course: Course) => void;
  onRemoveFromWishlist: (crn: string) => void;
}

export default function Sidebar({
  query,
  setQuery,
  filters,
  updateFilters,
  results,
  loading,
  total,
  page,
  totalPages,
  goToPage,
  departments,
  scheduledCourses,
  wishlist,
  onAddCourse,
  onAddToWishlist,
  onRemoveFromWishlist
}: Props) {
  const [conflictState, setConflictState] = useState<{
    courses: Course[];
    conflictWith: Course;
  } | null>(null);

  const handleAdd = (courses: Course[]) => {
    // Check all courses in the batch for conflicts against scheduled courses
    for (const course of courses) {
      const conflict = hasConflict(course, scheduledCourses);
      if (conflict) {
        setConflictState({ courses, conflictWith: conflict });
        return;
      }
    }
    // No conflicts — add all
    for (const course of courses) {
      onAddCourse(course);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/70 dark:bg-zinc-800/70">
      <div className="p-3 space-y-2 border-b border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80">
        <SearchBar value={query} onChange={setQuery} />
        <FilterBar departments={departments} filters={filters} onFilterChange={updateFilters} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
              {query || Object.values(filters).some(Boolean)
                ? "No courses found. Try adjusting your search."
                : "Search for courses to get started."}
            </p>
          )}

          {results.length > 0 && (
            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider px-1">
              {total.toLocaleString()} results
            </div>
          )}

          {results.map(group => (
            <CourseCard
              key={group.code}
              group={group}
              scheduledCourses={scheduledCourses}
              wishlist={wishlist}
              onAdd={courses => handleAdd(courses)}
              onReplaceSection={undefined}
              onAddToWishlist={course => onAddToWishlist(course)}
              onRemoveFromWishlist={course => onRemoveFromWishlist(course.crn)}
            />
          ))}

          <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </div>
      </div>

      {conflictState && (
        <ConflictDialog
          courses={conflictState.courses}
          conflictWith={conflictState.conflictWith}
          onConfirm={() => {
            for (const course of conflictState.courses) {
              onAddCourse(course);
            }
            setConflictState(null);
          }}
          onCancel={() => setConflictState(null)}
        />
      )}
    </div>
  );
}
