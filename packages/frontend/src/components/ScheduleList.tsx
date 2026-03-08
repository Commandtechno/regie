import { useState } from "react";
import { X, ArrowLeftRight, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import type { Course } from "../types.ts";
import { getCourseBg } from "../utils/colors.ts";
import SectionPicker from "./SectionPicker.tsx";

interface Props {
  courses: Course[];
  totalCredits: number;
  onRemove: (crn: string) => void;
  onReplaceSection: (oldCrn: string, newCourse: Course) => void;
}

export default function ScheduleList({ courses, totalCredits, onRemove, onReplaceSection }: Props) {
  const [open, setOpen] = useState(true);
  const [sectionPickerCourse, setSectionPickerCourse] = useState<Course | null>(null);
  const [removingCrn, setRemovingCrn] = useState<string | null>(null);

  const handleRemove = (crn: string) => {
    setRemovingCrn(crn);
    setTimeout(() => {
      onRemove(crn);
      setRemovingCrn(null);
    }, 200);
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cu-gold" />
          My Schedule ({courses.length})
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="space-y-1.5 mb-2">
          {courses.length === 0 && (
            <p className="text-xs text-gray-400 py-3 text-center">
              No courses scheduled yet. Search and add courses to get started.
            </p>
          )}
          {courses.map((course, i) => (
            <div
              key={course.crn}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all ${getCourseBg(i)} ${
                removingCrn === course.crn ? "opacity-0 scale-95" : "opacity-100"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{course.code}</p>
                <p className="text-[10px] text-gray-600">{course.title}</p>
                <p className="text-[10px] text-gray-600 truncate">
                  {course.schd} {course.no} • {course.meets || "TBA"}
                </p>
              </div>
              <button
                onClick={() => setSectionPickerCourse(course)}
                className="p-1 text-gray-500 hover:text-cu-gold hover:bg-white/60 rounded transition-colors"
                title="Change section"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleRemove(course.crn)}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-white/60 rounded transition-colors"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {courses.length > 0 && (
            <div className="text-right text-[11px] font-medium text-gray-500 pr-1 pt-1">
              Total: {totalCredits} credits
            </div>
          )}
        </div>
      )}

      {sectionPickerCourse && (
        <SectionPicker
          course={sectionPickerCourse}
          onSelect={newCourse => {
            onReplaceSection(sectionPickerCourse.crn, newCourse);
            setSectionPickerCourse(null);
          }}
          onClose={() => setSectionPickerCourse(null)}
        />
      )}
    </div>
  );
}
