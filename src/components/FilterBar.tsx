"use client";

import type { Filters } from "@/lib/types";

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
    <div className="bg-white px-7 py-3 flex items-center gap-3.5 flex-wrap border-b border-gray-200">
      {/* Distance filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Distance
        </span>
        <select
          value={filters.maxDriveMinutes ?? ""}
          onChange={(e) =>
            update({
              maxDriveMinutes: e.target.value ? Number(e.target.value) : null,
            })
          }
          disabled={!hasLocation}
          className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-normal cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Any</option>
          <option value="15">Within 15 min</option>
          <option value="30">Within 30 min</option>
          <option value="45">Within 45 min</option>
          <option value="60">Within 60 min</option>
        </select>
        {!hasLocation && (
          <span className="text-xs text-gray-400 italic">
            Needs location
          </span>
        )}
      </div>

      {/* Rating filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Rating
        </span>
        <select
          value={filters.minRating ?? ""}
          onChange={(e) =>
            update({
              minRating: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
        >
          <option value="">Any</option>
          <option value="3">3+ ★</option>
          <option value="4">4+ ★</option>
          <option value="4.5">4.5+ ★</option>
        </select>
      </div>

      {/* Size filter */}
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
