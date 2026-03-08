import { useState, useEffect } from "react";
import { X, ExternalLink, Star, Loader2 } from "lucide-react";
import type { Course, ProfessorRating } from "../types.ts";
import { getProfessorRating } from "../api.ts";

interface Props {
  course: Course;
  onClose: () => void;
}

export default function CourseDetail({ course, onClose }: Props) {
  const [rating, setRating] = useState<ProfessorRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    if (!course.instr || course.instr === "TBA" || course.instr === "Staff") return;
    setRatingLoading(true);
    getProfessorRating(course.instr)
      .then(r => setRating(r))
      .catch(() => {})
      .finally(() => setRatingLoading(false));
  }, [course.instr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 px-5 py-4 flex items-start justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{course.code}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Section" value={`${course.schd} ${course.no}`} />
            <Detail label="CRN" value={course.crn} />
            <Detail label="Credits" value={course.credits || "N/A"} />
            <Detail
              label="Status"
              value={course.stat === "A" ? "Available" : "Full"}
              valueClass={course.stat === "A" ? "text-emerald-600" : "text-red-600"}
            />
            <Detail label="Schedule" value={course.meets || "TBA"} />
            <Detail label="Career" value={course.acad_career} />
            <Detail label="Instructor" value={course.instr || "TBA"} />
            <Detail label="Dates" value={`${course.start_date} - ${course.end_date}`} />
          </div>

          {course.instr && course.instr !== "TBA" && course.instr !== "Staff" && (
            <div className="border-t border-gray-100 dark:border-zinc-700 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                RateMyProfessor
              </h3>
              {ratingLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading rating...
                </div>
              )}
              {!ratingLoading && rating && (
                <div className="bg-gray-50 dark:bg-zinc-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-cu-gold fill-cu-gold" />
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        {rating.avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/5</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{rating.numRatings} ratings</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300">
                    <span>Difficulty: {rating.avgDifficulty.toFixed(1)}/5</span>
                    {rating.wouldTakeAgainPercent >= 0 && (
                      <span>Would take again: {Math.round(rating.wouldTakeAgainPercent)}%</span>
                    )}
                  </div>
                  <a
                    href={rating.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-cu-gold hover:text-cu-gold"
                  >
                    View on RMP <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {!ratingLoading && !rating && <p className="text-sm text-gray-400 dark:text-gray-500">No rating found</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, valueClass = "text-gray-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className={`text-sm font-medium ${valueClass} dark:text-gray-100`}>{value}</p>
    </div>
  );
}
