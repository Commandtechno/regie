import { useState, useRef, useCallback } from "react";
import { Sparkles, Upload, Loader2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { Course, CourseGroup } from "../types.ts";
import CourseCard from "./CourseCard.tsx";
import ConflictDialog from "./ConflictDialog.tsx";
import { uploadPdf, getRecommendedCourses } from "../api.ts";
import { hasConflict } from "../utils/conflicts.ts";

interface Props {
  scheduledCourses: Course[];
  wishlist: Course[];
  onAddCourse: (course: Course) => void;
  onAddToWishlist: (course: Course) => void;
  onRemoveFromWishlist: (crn: string) => void;
}

type State =
  | { type: "upload" }
  | { type: "loading"; message: string }
  | { type: "results"; recommendations: Array<{ priority: number; course: Course }> }
  | { type: "error"; message: string };

export default function AiAdvisor({
  scheduledCourses,
  wishlist,
  onAddCourse,
  onAddToWishlist,
  onRemoveFromWishlist
}: Props) {
  const [open, setOpen] = useState(true);
  const [state, setState] = useState<State>({ type: "upload" });
  const [conflictState, setConflictState] = useState<{
    courses: Course[];
    conflictWith: Course;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setState({ type: "loading", message: "Uploading PDF..." });
    try {
      const { id } = await uploadPdf(file);
      setState({ type: "loading", message: "Analyzing your degree audit..." });
      const recommendations = await getRecommendedCourses(id);
      // Sort by priority (1 first)
      const sorted = recommendations.sort((a, b) => a.priority - b.priority);
      setState({ type: "results", recommendations: sorted });
    } catch (e) {
      setState({ type: "error", message: e instanceof Error ? e.message : "Failed to analyze PDF" });
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === "application/pdf") {
        handleFileSelect(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleReset = useCallback(() => {
    setState({ type: "upload" });
  }, []);

  const handleAiAdd = useCallback(
    (courses: Course[]) => {
      for (const course of courses) {
        const conflict = hasConflict(course, scheduledCourses);
        if (conflict) {
          setConflictState({ courses, conflictWith: conflict });
          return;
        }
      }
      for (const course of courses) {
        onAddCourse(course);
      }
    },
    [scheduledCourses, onAddCourse]
  );

  const handleAiConfirm = useCallback(() => {
    if (conflictState) {
      for (const course of conflictState.courses) {
        onAddCourse(course);
      }
      setConflictState(null);
    }
  }, [conflictState, onAddCourse]);

  const createCourseGroup = (course: Course): CourseGroup => ({
    code: course.code,
    title: course.title,
    department: course.department,
    courseNumber: course.courseNumber,
    credits: course.credits,
    sections: [course]
  });

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Advisor
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="space-y-1.5 mb-2">
          {state.type === "upload" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-amber-400 hover:bg-amber-50/30"
            >
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleInputChange} className="hidden" />
              <Upload className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600">Upload your degree audit (PDF)</p>
            </div>
          )}

          {state.type === "loading" && (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mb-2" />
              <p className="text-xs">{state.message}</p>
            </div>
          )}

          {state.type === "error" && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600 mb-2">{state.message}</p>
              <button onClick={handleReset} className="text-xs text-gray-600 hover:text-gray-800 underline">
                Try again
              </button>
            </div>
          )}

          {state.type === "results" && (
            <div className="space-y-3">
              {state.recommendations.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No recommendations found.</p>
              ) : (
                state.recommendations.map(({ priority, course }) => {
                  const group = createCourseGroup(course);
                  return (
                    <div key={course.crn}>
                      <CourseCard
                        priority={priority}
                        group={group}
                        scheduledCourses={scheduledCourses}
                        wishlist={wishlist}
                        onAdd={handleAiAdd}
                        onReplaceSection={undefined}
                        onAddToWishlist={onAddToWishlist}
                        onRemoveFromWishlist={c => onRemoveFromWishlist(c.crn)}
                      />
                    </div>
                  );
                })
              )}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          )}
        </div>
      )}

      {conflictState && (
        <ConflictDialog
          courses={conflictState.courses}
          conflictWith={conflictState.conflictWith}
          onConfirm={handleAiConfirm}
          onCancel={() => setConflictState(null)}
        />
      )}
    </div>
  );
}
