import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Course } from "../types.ts";

interface Props {
  courses: Course[];
  conflictWith: Course;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConflictDialog({ courses, conflictWith, onConfirm, onCancel }: Props) {
  const [closing, setClosing] = useState(false);

  const handleCancel = () => {
    setClosing(true);
    setTimeout(onCancel, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 transition-all ${
          closing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-full">
            <AlertTriangle className="w-5 h-5 text-cu-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Schedule Conflict</h3>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">{courses[0].code}</span> ({courses[0].schd} {courses[0].no}) conflicts with{" "}
              <span className="font-medium">{conflictWith.code}</span> ({conflictWith.schd} {conflictWith.no}).
            </p>
            <p className="text-sm text-gray-500 mt-2">Add anyway?</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-cu-gold rounded-lg hover:bg-cu-gold transition-colors"
          >
            Add Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
