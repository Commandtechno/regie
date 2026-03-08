import { useMemo, useState, useEffect } from "react";
import type { Course } from "../types.ts";
import {
  START_HOUR,
  END_HOUR,
  ROW_HEIGHT,
  DAY_LABELS,
  DAY_SHORT,
  topOffset,
  blockHeight,
  currentTimeOffset,
  currentDayIndex
} from "../utils/calendar.ts";
import CalendarBlock from "./CalendarBlock.tsx";

interface Props {
  courses: Course[];
  onCourseClick: (course: Course) => void;
}

interface PlacedBlock {
  course: Course;
  colorIndex: number;
  day: number;
  top: number;
  height: number;
}

export default function Calendar({ courses, onCourseClick }: Props) {
  const [timeOffset, setTimeOffset] = useState<number | null>(currentTimeOffset());
  const [dayIdx, setDayIdx] = useState<number | null>(currentDayIndex());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOffset(currentTimeOffset());
      setDayIdx(currentDayIndex());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const colorMap = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((c, i) => map.set(c.crn, i));
    return map;
  }, [courses]);

  const blocks = useMemo(() => {
    const placed: PlacedBlock[] = [];
    for (const course of courses) {
      const idx = colorMap.get(course.crn) ?? 0;
      for (const mt of course.meetingTimes) {
        const day = parseInt(mt.meet_day);
        if (day < 0 || day > 4) continue;
        const top = topOffset(mt.start_time);
        const height = blockHeight(mt.start_time, mt.end_time);
        placed.push({ course, colorIndex: idx, day, top, height });
      }
    }
    return placed;
  }, [courses, colorMap]);

  const blocksByDay = useMemo(() => {
    const map: Record<number, PlacedBlock[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    for (const b of blocks) {
      map[b.day].push(b);
    }
    return map;
  }, [blocks]);

  const overlapGroups = useMemo(() => {
    const result: Record<number, { block: PlacedBlock; col: number; totalCols: number }[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: []
    };

    for (let day = 0; day < 5; day++) {
      const dayBlocks = [...blocksByDay[day]].sort((a, b) => a.top - b.top);
      const groups: PlacedBlock[][] = [];
      let currentGroup: PlacedBlock[] = [];
      let groupEnd = -1;

      for (const b of dayBlocks) {
        if (currentGroup.length === 0 || b.top < groupEnd) {
          currentGroup.push(b);
          groupEnd = Math.max(groupEnd, b.top + b.height);
        } else {
          groups.push(currentGroup);
          currentGroup = [b];
          groupEnd = b.top + b.height;
        }
      }
      if (currentGroup.length > 0) groups.push(currentGroup);

      for (const group of groups) {
        const totalCols = group.length;
        group.forEach((block, col) => {
          result[day].push({ block, col, totalCols });
        });
      }
    }

    return result;
  }, [blocksByDay]);

  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    hours.push(h);
  }

  const totalHeight = (END_HOUR - START_HOUR) * 2 * ROW_HEIGHT;

  const formatHour = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display} ${suffix}`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50/80">
        <div className="w-16 shrink-0" />
        {DAY_LABELS.map((label, i) => (
          <div
            key={i}
            className={`flex-1 text-center py-2.5 text-xs font-semibold tracking-wide uppercase ${
              dayIdx === i ? "text-cu-gold bg-amber-50/60" : "text-gray-500"
            }`}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{DAY_SHORT[i]}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex relative" style={{ height: totalHeight }}>
          <div className="w-16 shrink-0 relative">
            {hours.map(h => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-gray-400 leading-none"
                style={{ top: (h - START_HOUR) * 2 * ROW_HEIGHT - 5 }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          <div className="flex-1 flex relative">
            {[0, 1, 2, 3, 4].map(day => (
              <div
                key={day}
                className={`flex-1 relative border-l border-gray-100 ${dayIdx === day ? "bg-amber-50/30" : ""}`}
              >
                {hours.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: (h - START_HOUR) * 2 * ROW_HEIGHT }}
                  />
                ))}
                {hours.map(h => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-gray-50"
                    style={{ top: (h - START_HOUR) * 2 * ROW_HEIGHT + ROW_HEIGHT }}
                  />
                ))}

                {overlapGroups[day].map(({ block, col, totalCols }, idx) => {
                  const widthPct = 100 / totalCols;
                  const leftPct = col * widthPct;
                  return (
                    <CalendarBlock
                      key={`${block.course.crn}-${idx}`}
                      course={block.course}
                      colorIndex={block.colorIndex}
                      style={{
                        top: block.top,
                        height: block.height,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        position: "absolute"
                      }}
                      onClick={() => onCourseClick(block.course)}
                    />
                  );
                })}
              </div>
            ))}

            {timeOffset !== null && dayIdx !== null && (
              <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: timeOffset }}>
                <div className="h-0.5 bg-red-500 relative">
                  <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
