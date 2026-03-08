import { useState, useMemo, useEffect } from "react";
import { Plus, Heart, ChevronDown } from "lucide-react";
import type { Course, CourseGroup } from "../types.ts";
import { hasConflict } from "../utils/conflicts.ts";

const priorityColors: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-emerald-500",
  5: "bg-blue-500"
};

interface Props {
  priority: number;
  group: CourseGroup;
  scheduledCourses: Course[];
  wishlist: Course[];
  onAdd: (courses: Course[]) => void;
  onReplaceSection?: (oldCrn: string, newCourse: Course) => void;
  onAddToWishlist: (course: Course) => void;
  onRemoveFromWishlist: (course: Course) => void;
}

export default function CourseCard({
  priority,
  group,
  scheduledCourses,
  wishlist,
  onAdd,
  onReplaceSection,
  onAddToWishlist,
  onRemoveFromWishlist
}: Props) {
  // Split sections into primaries and dependents
  const primaries = useMemo(() => group.sections.filter(s => s.is_enroll_section === "1"), [group.sections]);
  const dependents = useMemo(() => group.sections.filter(s => s.is_enroll_section === "0"), [group.sections]);
  const hasLinkedSections = dependents.length > 0;

  // Dropdown state
  const [lectureDropdownOpen, setLectureDropdownOpen] = useState(false);
  const [dependentDropdownOpen, setDependentDropdownOpen] = useState(false);

  // Find scheduled primary index
  const scheduledPrimaryIndex = useMemo(() => {
    return primaries.findIndex(s => scheduledCourses.some(c => c.crn === s.crn));
  }, [primaries, scheduledCourses]);

  // Find scheduled dependent index
  const scheduledDependentIndex = useMemo(() => {
    return dependents.findIndex(s => scheduledCourses.some(c => c.crn === s.crn));
  }, [dependents, scheduledCourses]);

  // Determine initial selected primary index
  const initialPrimaryIndex = useMemo(() => {
    // If any primary is already scheduled, select that
    if (scheduledPrimaryIndex >= 0) return scheduledPrimaryIndex;

    // Otherwise default to first available primary
    const availableIndex = primaries.findIndex(s => s.stat === "A");
    if (availableIndex >= 0) return availableIndex;

    // Fall back to first primary
    return 0;
  }, [primaries, scheduledPrimaryIndex]);

  const [selectedPrimaryIndex, setSelectedPrimaryIndex] = useState(initialPrimaryIndex);

  // Update selection if scheduled course changes
  useEffect(() => {
    if (scheduledPrimaryIndex >= 0 && scheduledPrimaryIndex !== selectedPrimaryIndex) {
      setSelectedPrimaryIndex(scheduledPrimaryIndex);
    }
  }, [scheduledPrimaryIndex, selectedPrimaryIndex]);

  const selectedPrimary = primaries[selectedPrimaryIndex] ?? primaries[0];

  // Compute linked dependents for the selected primary
  const linkedCrns = useMemo(() => {
    if (!selectedPrimary?.linked_crns) return [];
    return selectedPrimary.linked_crns.split(",").filter(Boolean);
  }, [selectedPrimary]);

  const linkedDependents = useMemo(() => {
    return dependents.filter(d => linkedCrns.includes(d.crn));
  }, [dependents, linkedCrns]);

  // Auto-select non-conflicting primary when schedule changes
  useEffect(() => {
    // Don't override if this course's primary is already scheduled
    if (scheduledPrimaryIndex >= 0) return;

    // Find first primary without a conflict
    const betterIdx = primaries.findIndex(p => !hasConflict(p, scheduledCourses));
    if (betterIdx >= 0 && betterIdx !== selectedPrimaryIndex) {
      setSelectedPrimaryIndex(betterIdx);
    }
  }, [scheduledCourses]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select non-conflicting dependent when schedule or primary changes
  useEffect(() => {
    // Don't override if this course's dependent is already scheduled
    if (scheduledDependentIndex >= 0 && linkedDependents.some(d => d.crn === dependents[scheduledDependentIndex]?.crn))
      return;

    const betterIdx = linkedDependents.findIndex(d => !hasConflict(d, scheduledCourses));
    if (betterIdx >= 0 && betterIdx !== selectedDependentIndex) {
      setSelectedDependentIndex(betterIdx);
    }
  }, [scheduledCourses, linkedDependents]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasLinkedDependents = linkedDependents.length > 0;

  // Determine initial selected dependent index
  const initialDependentIndex = useMemo(() => {
    // If any dependent is already scheduled, select that
    if (scheduledDependentIndex >= 0) {
      const scheduledDep = dependents[scheduledDependentIndex];
      if (linkedCrns.includes(scheduledDep.crn)) {
        return linkedDependents.findIndex(d => d.crn === scheduledDep.crn);
      }
    }

    // Otherwise default to first available linked dependent
    const availableIndex = linkedDependents.findIndex(s => s.stat === "A");
    if (availableIndex >= 0) return availableIndex;

    // Fall back to first linked dependent
    return 0;
  }, [linkedDependents, scheduledDependentIndex, linkedCrns, dependents]);

  const [selectedDependentIndex, setSelectedDependentIndex] = useState(initialDependentIndex);

  // Reset dependent selection when primary changes
  useEffect(() => {
    const newIndex = initialDependentIndex;
    if (newIndex >= 0 && newIndex < linkedDependents.length) {
      setSelectedDependentIndex(newIndex);
    } else {
      setSelectedDependentIndex(0);
    }
  }, [selectedPrimaryIndex, linkedCrns.length]);

  const selectedDependent = linkedDependents[selectedDependentIndex] ?? linkedDependents[0];

  // Determine the label for the dependent dropdown
  const dependentLabel = useMemo(() => {
    if (linkedDependents.length === 0) return "Section";
    const firstSchd = linkedDependents[0].schd;
    return (
      {
        REC: "Recitation",
        LAB: "Lab",
        PRA: "Practicum",
        SEM: "Seminar"
      }[firstSchd] ?? "Section"
    );
  }, [linkedDependents]);

  // Conflict detection
  const primaryConflict = selectedPrimary ? hasConflict(selectedPrimary, scheduledCourses) : null;
  const dependentConflict =
    selectedDependent && hasLinkedDependents ? hasConflict(selectedDependent, scheduledCourses) : null;
  const hasConflict_ = primaryConflict || dependentConflict;

  // Scheduled state
  const isPrimaryScheduled = selectedPrimary ? scheduledCourses.some(c => c.crn === selectedPrimary.crn) : false;
  const isDependentScheduled =
    selectedDependent && hasLinkedDependents ? scheduledCourses.some(c => c.crn === selectedDependent.crn) : false;
  const isScheduled = isPrimaryScheduled || (hasLinkedDependents && isDependentScheduled);

  // Wishlist state (only for primary)
  const isWishlisted = selectedPrimary ? wishlist.some(c => c.crn === selectedPrimary.crn) : false;

  // Availability
  const primaryAvailable = selectedPrimary?.stat === "A";
  const dependentAvailable = selectedDependent?.stat === "A";
  const available = primaryAvailable && (!hasLinkedDependents || dependentAvailable);

  // Sort sections: available first, then by no ascending
  const sortSections = (sections: Course[]) => {
    return [...sections].sort((a, b) => {
      if (a.stat === "A" && b.stat !== "A") return -1;
      if (a.stat !== "A" && b.stat === "A") return 1;
      return a.no.localeCompare(b.no, undefined, { numeric: true });
    });
  };

  const sortedPrimaries = useMemo(() => sortSections(primaries), [primaries]);
  const sortedDependents = useMemo(() => sortSections(linkedDependents), [linkedDependents]);

  const hasMultiplePrimaries = primaries.length > 1;
  const hasMultipleDependents = linkedDependents.length > 1;

  const handlePrimarySelect = (index: number) => {
    const originalIndex = primaries.findIndex(s => s.crn === sortedPrimaries[index].crn);
    const newPrimary = primaries[originalIndex];
    // If this primary was scheduled, replace it live
    if (isPrimaryScheduled && newPrimary && onReplaceSection) {
      onReplaceSection(selectedPrimary.crn, newPrimary);
    }
    setSelectedPrimaryIndex(originalIndex);
    setLectureDropdownOpen(false);
  };

  const handleDependentSelect = (index: number) => {
    const originalIndex = linkedDependents.findIndex(s => s.crn === sortedDependents[index].crn);
    const newDependent = linkedDependents[originalIndex];
    // If this dependent was scheduled, replace it live
    if (isDependentScheduled && newDependent && onReplaceSection) {
      onReplaceSection(selectedDependent.crn, newDependent);
    }
    setSelectedDependentIndex(originalIndex);
    setDependentDropdownOpen(false);
  };

  // Render dropdown for a section type
  const renderDropdown = (
    label: string,
    sections: Course[],
    selected: Course,
    sortedSections: Course[],
    isOpen: boolean,
    setIsOpen: (v: boolean) => void,
    onSelect: (idx: number) => void,
    hasMultiple: boolean
  ) => {
    if (!selected) return null;
    if (!hasMultiple) {
      // Single section - just display inline
      return (
        <div className="mt-2">
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
            <span>
              {selected.schd} {selected.no}
            </span>
            <span>{selected.meets || "TBA"}</span>
            <span>{selected.instr || "TBA"}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
        >
          <span className="truncate">
            {selected.schd} {selected.no} · {selected.meets || "TBA"} · {selected.instr || "TBA"}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-50 overflow-y-auto">
            {sortedSections.map((section, idx) => {
              const isSelected = section.crn === selected.crn;
              const isAvailable = section.stat === "A";

              return (
                <button
                  key={section.crn}
                  onClick={() => onSelect(idx)}
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
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const handleAdd = () => {
    if (!selectedPrimary) return;

    if (hasLinkedSections) {
      if (hasLinkedDependents && selectedDependent) {
        onAdd([selectedPrimary, selectedDependent]);
      } else {
        // Primary has no linked dependents (e.g., online section)
        onAdd([selectedPrimary]);
      }
    } else {
      // No linked sections at all - just add the selected primary
      onAdd([selectedPrimary]);
    }
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
            <span className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
            <p className="font-semibold text-sm text-gray-900 truncate">{group.code}</p>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 truncate">{group.title}</p>
        </div>
      </div>

      {hasLinkedSections ? (
        <>
          {/* Lecture dropdown */}
          {renderDropdown(
            "Lecture",
            primaries,
            selectedPrimary,
            sortedPrimaries,
            lectureDropdownOpen,
            setLectureDropdownOpen,
            handlePrimarySelect,
            hasMultiplePrimaries
          )}

          {/* Dependent dropdown - only if primary has linked dependents */}
          {hasLinkedDependents &&
            renderDropdown(
              dependentLabel,
              linkedDependents,
              selectedDependent,
              sortedDependents,
              dependentDropdownOpen,
              setDependentDropdownOpen,
              handleDependentSelect,
              hasMultipleDependents
            )}
        </>
      ) : (
        // No linked sections - single dropdown over all sections (all are primaries)
        renderDropdown(
          "Section",
          primaries,
          selectedPrimary,
          sortedPrimaries,
          lectureDropdownOpen,
          setLectureDropdownOpen,
          handlePrimarySelect,
          hasMultiplePrimaries
        )
      )}

      {selectedPrimary?.credits && <div className="mt-1 text-[11px] text-gray-500">{selectedPrimary.credits} cr</div>}

      {primaryConflict && (
        <p className="mt-1.5 text-[11px] text-red-600 font-medium">Conflicts with {primaryConflict.code}</p>
      )}
      {!primaryConflict && dependentConflict && (
        <p className="mt-1.5 text-[11px] text-red-600 font-medium">
          {dependentLabel} conflicts with {dependentConflict.code}
        </p>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        {!isScheduled && (
          <button
            onClick={handleAdd}
            disabled={hasLinkedSections && hasLinkedDependents && !selectedDependent}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-cu-gold text-white hover:bg-amber-600 active:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
        {isScheduled && <span className="text-[11px] text-amber-700 font-medium px-2.5 py-1">Scheduled</span>}
        {!isWishlisted && !isScheduled && (
          <button
            onClick={() => onAddToWishlist(selectedPrimary)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-500 hover:text-rose-500 rounded-md hover:bg-rose-50 transition-colors"
          >
            <Heart className="w-3 h-3" />
          </button>
        )}
        {isWishlisted && (
          <button
            onClick={() => onRemoveFromWishlist(selectedPrimary)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Heart className="w-3 h-3 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
}
