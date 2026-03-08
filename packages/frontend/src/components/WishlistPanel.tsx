import { useState } from "react";
import { Heart, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { Course } from "../types.ts";

interface Props {
  items: Course[];
  onAddToSchedule: (course: Course) => void;
  onRemove: (crn: string) => void;
}

export default function WishlistPanel({ items, onAddToSchedule, onRemove }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          Wishlist ({items.length})
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="space-y-1.5 mb-2">
          {items.length === 0 && (
            <p className="text-xs text-gray-400 py-3 text-center">
              No wishlisted courses. Click the heart icon on a course to save it here.
            </p>
          )}
          {items.map(course => (
            <div
              key={course.crn}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-rose-50/50 border border-rose-100"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{course.code}</p>
                <p className="text-[10px] text-gray-600 truncate">{course.title}</p>
              </div>
              <button
                onClick={() => onAddToSchedule(course)}
                className="p-1 text-gray-500 hover:text-cu-gold hover:bg-white/60 rounded transition-colors"
                title="Add to schedule"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemove(course.crn)}
                className="p-1 text-gray-500 hover:text-red-600 hover:bg-white/60 rounded transition-colors"
                title="Remove from wishlist"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
