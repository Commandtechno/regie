import { useState, useRef, useEffect } from "react";
import { Download, Calendar, ChevronDown } from "lucide-react";
import type { Course } from "../types.ts";
import { downloadICS, googleCalendarUrl } from "../utils/export.ts";

interface Props {
  courses: Course[];
}

export default function ExportMenu({ courses }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const disabled = courses.length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
          <button
            onClick={() => {
              downloadICS(courses);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors"
          >
            <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            Download .ics File
          </button>
          <div className="border-t border-gray-100 dark:border-gray-700 my-0.5" />
          <div className="px-3 py-2">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              Add individual courses to Google Calendar
            </p>
            {courses.map(c => (
              <a
                key={c.crn}
                href={googleCalendarUrl(c)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-1 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-cu-gold hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                {c.code} ({c.schd} {c.no})
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
