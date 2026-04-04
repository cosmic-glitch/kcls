"use client";

import type { Filters, LibrarySystem } from "@/lib/types";
import { SYSTEM_DISPLAY_NAMES } from "@/lib/types";

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  totalCount: number;
  filteredCount: number;
  hasLocation: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
  hasLocation,
}: FilterBarProps) {
  const update = (partial: Partial<Filters>) =>
    onFiltersChange({ ...filters, ...partial });

  return (
    <div className="bg-white px-7 py-3 flex items-center gap-5 flex-wrap border-b border-gray-200">
      {/* Distance slider */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
          Distance
        </span>
        {hasLocation ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={filters.maxDriveMinutes ?? 60}
              onChange={(e) => {
                const val = Number(e.target.value);
                update({ maxDriveMinutes: val >= 60 ? null : val });
              }}
              className="flex-1 h-1.5 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-gray-600 font-medium w-14 text-right">
              {filters.maxDriveMinutes
                ? `≤ ${filters.maxDriveMinutes} min`
                : "Any"}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Needs location</span>
        )}
      </div>

      {/* Rating slider */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">
          Rating
        </span>
        <div className="flex items-center gap-2 flex-1">
          <input
            type="range"
            min={0}
            max={50}
            step={1}
            value={filters.minRating ? filters.minRating * 10 : 0}
            onChange={(e) => {
              const val = Number(e.target.value) / 10;
              update({ minRating: val > 0 ? val : null });
            }}
            className="flex-1 h-1.5 accent-indigo-600 cursor-pointer"
          />
          <span className="text-xs text-gray-600 font-medium w-12 text-right">
            {filters.minRating ? `${filters.minRating.toFixed(1)}+ ★` : "Any"}
          </span>
        </div>
      </div>

      {/* Size filter (dropdown — no sqft data available yet) */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Size
        </span>
        <select
          value={filters.sizeCategory ?? ""}
          onChange={(e) =>
            update({
              sizeCategory: (e.target.value || null) as Filters["sizeCategory"],
            })
          }
          className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <option value="">Any</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* System filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          System
        </span>
        <select
          value={filters.system ?? ""}
          onChange={(e) =>
            update({
              system: (e.target.value || null) as Filters["system"],
            })
          }
          className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <option value="">All</option>
          {(Object.entries(SYSTEM_DISPLAY_NAMES) as [LibrarySystem, string][]).map(
            ([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            )
          )}
        </select>
      </div>

      {/* Open Now toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={filters.openNow}
          onClick={() => update({ openNow: !filters.openNow })}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            filters.openNow
              ? "bg-gradient-to-r from-indigo-600 to-purple-600"
              : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              filters.openNow ? "translate-x-4 left-0.5" : "left-0.5"
            }`}
          />
        </button>
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Open Now
        </span>
      </label>

      {/* Results count */}
      <span className="ml-auto text-xs text-gray-400">
        Showing {filteredCount} of {totalCount} libraries
      </span>
    </div>
  );
}
