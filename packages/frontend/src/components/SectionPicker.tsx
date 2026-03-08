import { useState } from "react";
import { Loader2, ArrowLeftRight } from "lucide-react";
import type { Course } from "../types.ts";
import { searchCourses } from "../api.ts";

interface Props {
  course: Course;
  onSelect: (newCourse: Course) => void;
  onClose: () => void;
}

export default function SectionPicker({ course, onSelect, onClose }: Props) {
  const [sections, setSections] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    searchCourses({
      department: course.department,
      q: course.courseNumber,
      limit: 50
    })
      .then(data => {
        const sameCode = data.results.filter(r => r.code === course.code && r.crn !== course.crn);
        setSections(sameCode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full max-h-[70vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-cu-gold" />
            Change Section — {course.code}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current: {course.schd} {course.no} ({course.meets || "TBA"})
          </p>
        </div>

        <div className="overflow-y-auto max-h-[50vh] p-3 space-y-1.5">
          {loading && (
            <div className="flex items-center justify-center py-8 text-gray-400 dark:text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          {!loading && sections.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No other sections found</p>
          )}
          {sections.map(s => (
            <button
              key={s.crn}
              onClick={() => onSelect(s)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {s.schd} {s.no}
                </span>
                {/* <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    s.stat === "A" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {s.stat === "A" ? "Open" : "Full"}
                </span> */}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex gap-3">
                <span>{s.meets || "TBA"}</span>
                <span>{s.instr || "TBA"}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
