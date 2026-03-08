import { useState, useMemo } from "react";
import { Plus, Heart, ChevronDown } from "lucide-react";
import type { Course, CourseGroup } from "../types.ts";
import { hasConflict } from "../utils/conflicts.ts";

interface Props {
  group: CourseGroup;
  scheduledCourses: Course[];
  wishlist: Course[];
  onAdd: (course: Course) => void;
  onWishlist: (course: Course) => void;
}

export default function CourseCard({
  group,
  scheduledCourses,
  wishlist,
  onAdd,
  onWishlist,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Determine initial selected index
  const initialIndex = useMemo(() => {
    // First check if any section is already scheduled - auto-select that
    const scheduledIndex = group.sections.findIndex((s) =>
      scheduledCourses.some((c) => c.crn === s.crn)
    );
    if (scheduledIndex >= 0) return scheduledIndex;

    // Otherwise default to first available section
    const availableIndex = group.sections.findIndex((s) => s.stat === "A");
    if (availableIndex >= 0) return availableIndex;

    // Fall back to first section
    return 0;
  }, [group.sections, scheduledCourses]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Update selection if scheduled course changes
  useMemo(() => {
    const scheduledIndex = group.sections.findIndex((s) =>
      scheduledCourses.some((c) => c.crn === s.crn)
    );
    if (scheduledIndex >= 0 && scheduledIndex !== selectedIndex) {
      setSelectedIndex(scheduledIndex);
    }
  }, [group.sections, scheduledCourses, selectedIndex]);

  const selectedSection = group.sections[selectedIndex];
  const hasConflict_ = hasConflict(selectedSection, scheduledCourses);
  const isScheduled = scheduledCourses.some((c) => c.crn === selectedSection.crn);
  const isWishlisted = wishlist.some((c) => c.crn === selectedSection.crn);
  const available = selectedSection.stat === "A";

  // Sort sections for dropdown: available first, then by no ascending
  const sortedSections = useMemo(() => {
    return [...group.sections].sort((a, b) => {
      if (a.stat === "A" && b.stat !== "A") return -1;
      if (a.stat !== "A" && b.stat === "A") return 1;
      return a.no.localeCompare(b.no, undefined, { numeric: true });
    });
  }, [group.sections]);

  const hasMultipleSections = group.sections.length > 1;

  const handleSectionSelect = (index: number) => {
    setSelectedIndex(index);
    setDropdownOpen(false);
  };

  return (
    <div
      className={`p-3 bg-white rounded-lg border border-gray-150 transition-all hover:shadow-sm ${
        hasConflict_ ? "opacity-60" : ""
      } ${isScheduled ? "ring-2 ring-amber-400/50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-gray-900 truncate">{group.code}</p>
            <span
              className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                available
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {available ? "Open" : "Full"}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 truncate">{group.title}</p>
        </div>
      </div>

      {/* Section selector */}
      {hasMultipleSections ? (
        <div className="mt-2 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
          >
            <span className="truncate">
              {selectedSection.schd} {selectedSection.no} · {selectedSection.meets || "TBA"} ·{" "}
              {selectedSection.instr || "TBA"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-[200px] overflow-y-auto">
              {sortedSections.map((section, idx) => {
                const originalIndex = group.sections.findIndex((s) => s.crn === section.crn);
                const isSelected = originalIndex === selectedIndex;
                const isAvailable = section.stat === "A";

                return (
                  <button
                    key={section.crn}
                    onClick={() => handleSectionSelect(originalIndex)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[11px] transition-colors ${
                      isSelected ? "bg-amber-50" : "hover:bg-gray-50"
                    } ${!isAvailable ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">
                          {section.schd} {section.no}
                        </span>
                        <span className="text-gray-400">·</span>
                        <span className="truncate">{section.meets || "TBA"}</span>
                      </div>
                      <div className="text-gray-500 mt-0.5">{section.instr || "TBA"}</div>
                    </div>
                    <span
                      className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {isAvailable ? "Open" : "Full"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
          <span>
            {selectedSection.schd} {selectedSection.no}
          </span>
          <span>{selectedSection.meets || "TBA"}</span>
          <span>{selectedSection.instr || "TBA"}</span>
        </div>
      )}

      {selectedSection.credits && (
        <div className="mt-1 text-[11px] text-gray-500">{selectedSection.credits} cr</div>
      )}

      {hasConflict_ && (
        <p className="mt-1.5 text-[11px] text-red-600 font-medium">
          Conflicts with {hasConflict_.code}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        {!isScheduled && (
          <button
            onClick={() => onAdd(selectedSection)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
        {isScheduled && (
          <span className="text-[11px] text-amber-700 font-medium px-2.5 py-1">Scheduled</span>
        )}
        {!isWishlisted && !isScheduled && (
          <button
            onClick={() => onWishlist(selectedSection)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors"
          >
            <Heart className="w-3 h-3" />
          </button>
        )}
        {isWishlisted && (
          <span className="flex items-center gap-1 px-2 py-1 text-[11px] text-rose-500">
            <Heart className="w-3 h-3 fill-current" />
          </span>
        )}
      </div>
    </div>
  );
}
