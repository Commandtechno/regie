import { useState, useRef, type ReactNode } from "react";
import type { Course } from "../types.ts";
import { getCourseColor } from "../utils/colors.ts";
import { formatTimeRange } from "../utils/calendar.ts";

interface Props {
  course: Course;
  colorIndex: number;
  style: React.CSSProperties;
  onClick: () => void;
}

export default function CalendarBlock({ course, colorIndex, style, onClick }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorClass = getCourseColor(colorIndex);
  const height = parseFloat(String(style.height)) || 0;
  const compact = height < 42;

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(true), 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(false);
  };

  let tooltip: ReactNode = null;
  if (showTooltip) {
    tooltip = (
      <div className="absolute z-50 left-full top-0 ml-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 p-3 text-xs text-gray-700 pointer-events-none">
        <p className="font-bold text-sm text-gray-900">{course.code}</p>
        <p className="text-gray-600 mt-0.5">{course.title}</p>
        <div className="mt-2 space-y-0.5">
          <p>
            <span className="text-gray-500">Instructor:</span> {course.instr || "TBA"}
          </p>
          <p>
            <span className="text-gray-500">Section:</span> {course.schd} {course.no}
          </p>
          <p>
            <span className="text-gray-500">Credits:</span> {course.credits || "N/A"}
          </p>
          <p>
            <span className="text-gray-500">Schedule:</span> {course.meets || "TBA"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`absolute left-0.5 right-0.5 rounded cursor-pointer overflow-hidden transition-shadow hover:shadow-md ${colorClass}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div className="px-1.5 py-0.5 h-full flex flex-col justify-center">
        <p className="font-semibold text-[11px] leading-tight truncate">{course.code}</p>
        {!compact && (
          <>
            <p className="text-[10px] leading-tight truncate opacity-90">{course.title}</p>
            <p className="text-[10px] leading-tight truncate opacity-80">
              {course.schd} {course.no}
              {course.meetingTimes[0] &&
                " • " + formatTimeRange(course.meetingTimes[0].start_time, course.meetingTimes[0].end_time)}
            </p>
          </>
        )}
      </div>
      {tooltip}
    </div>
  );
}
