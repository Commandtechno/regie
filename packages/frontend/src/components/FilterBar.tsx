import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Department } from "../types.ts";

interface Props {
  departments: Department[];
  filters: Record<string, string | undefined>;
  onFilterChange: (filters: Record<string, string | undefined>) => void;
}

const LEVELS = ["", "1000", "2000", "3000", "4000", "5000"];
const TYPES = ["", "LEC", "LAB", "REC", "SEM"];
const CAREERS = ["", "UGRD", "GRAD", "LAW"];
const STATUSES = ["", "A", "F"];

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 min-w-30">
      <label className="block text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cu-gold/40 focus:border-cu-gold cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterBar({ departments, filters, onFilterChange }: Props) {
  const [open, setOpen] = useState(false);

  const deptOptions = [
    { value: "", label: "All Depts" },
    ...departments.map(d => ({ value: d.code, label: `${d.code} (${d.count})` }))
  ];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-1 transition-colors"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Filters
        {Object.values(filters).filter(Boolean).length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-cu-gold rounded-full text-[10px] font-medium">
            {Object.values(filters).filter(Boolean).length}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          <SelectField
            label="Department"
            value={filters.department || ""}
            options={deptOptions}
            onChange={v => onFilterChange({ department: v || undefined })}
          />
          <SelectField
            label="Level"
            value={filters.level || ""}
            options={LEVELS.map(l => ({ value: l, label: l || "All Levels" }))}
            onChange={v => onFilterChange({ level: v || undefined })}
          />
          <SelectField
            label="Type"
            value={filters.schd || ""}
            options={TYPES.map(t => ({ value: t, label: t || "All Types" }))}
            onChange={v => onFilterChange({ schd: v || undefined })}
          />
          <SelectField
            label="Career"
            value={filters.career || ""}
            options={CAREERS.map(c => ({ value: c, label: c || "All" }))}
            onChange={v => onFilterChange({ career: v || undefined })}
          />
          {/* <SelectField
            label="Status"
            value={filters.status || ""}
            options={STATUSES.map(s => ({
              value: s,
              label: s === "A" ? "Available" : s === "F" ? "Full" : "All"
            }))}
            onChange={v => onFilterChange({ status: v || undefined })}
          /> */}
        </div>
      )}
    </div>
  );
}
