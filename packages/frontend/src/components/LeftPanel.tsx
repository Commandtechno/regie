import { useState } from "react";
import type { Course } from "../types.ts";
import ScheduleList from "./ScheduleList.tsx";
import WishlistPanel from "./WishlistPanel.tsx";
import ConflictDialog from "./ConflictDialog.tsx";
import AiAdvisor from "./AiAdvisor.tsx";
import { hasConflict } from "../utils/conflicts.ts";

interface Props {
  scheduledCourses: Course[];
  wishlist: Course[];
  totalCredits: number;
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (crn: string) => void;
  onReplaceSection: (oldCrn: string, newCourse: Course) => void;
  onRemoveFromWishlist: (crn: string) => void;
  onAddToWishlist: (course: Course) => void;
}

export default function LeftPanel({
  scheduledCourses,
  wishlist,
  totalCredits,
  onAddCourse,
  onRemoveCourse,
  onReplaceSection,
  onRemoveFromWishlist,
  onAddToWishlist
}: Props) {
  const [conflictState, setConflictState] = useState<{
    courses: Course[];
    conflictWith: Course;
  } | null>(null);

  const handleWishlistAdd = (course: Course) => {
    const conflict = hasConflict(course, scheduledCourses);
    if (conflict) {
      setConflictState({ courses: [course], conflictWith: conflict });
    } else {
      onAddCourse(course);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/70 dark:bg-gray-800/70 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-3">
        <ScheduleList
          courses={scheduledCourses}
          totalCredits={totalCredits}
          onRemove={onRemoveCourse}
          onReplaceSection={onReplaceSection}
        />
      </div>

      {/* <div className="border-t border-gray-200 dark:border-gray-700 mx-3" />

      <div className="p-3">
        <WishlistPanel
          items={wishlist}
          onAddToSchedule={handleWishlistAdd}
          onRemove={onRemoveFromWishlist}
        />
      </div> */}

      <div className="border-t border-gray-200 dark:border-gray-700 mx-3" />

      <div className="p-3">
        <AiAdvisor
          scheduledCourses={scheduledCourses}
          wishlist={wishlist}
          onAddCourse={onAddCourse}
          onAddToWishlist={onAddToWishlist}
          onRemoveFromWishlist={onRemoveFromWishlist}
        />
      </div>

      {conflictState && (
        <ConflictDialog
          courses={conflictState.courses}
          conflictWith={conflictState.conflictWith}
          onConfirm={() => {
            for (const course of conflictState.courses) {
              onAddCourse(course);
            }
            setConflictState(null);
          }}
          onCancel={() => setConflictState(null)}
        />
      )}
    </div>
  );
}
