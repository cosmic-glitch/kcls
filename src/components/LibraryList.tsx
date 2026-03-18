"use client";

import { useState } from "react";
import type { Library, SortConfig, SortField, DriveTimeResult } from "@/lib/types";
import { LibraryCard } from "./LibraryCard";
import { LibraryDetail } from "./LibraryDetail";

interface LibraryListProps {
  libraries: Library[];
  driveTimes: DriveTimeResult[];
  sort: SortConfig;
  onSortChange: (sort: SortConfig) => void;
  now: Date;
}

const COLUMNS: { label: string; field: SortField; flex: string }[] = [
  { label: "Library", field: "name", flex: "flex-[2.2]" },
  { label: "Rating", field: "googleRating", flex: "flex-[0.7] text-center" },
  { label: "Reviews", field: "googleReviewCount", flex: "flex-[0.6] text-center" },
  { label: "Drive", field: "driveTime", flex: "flex-[0.7] text-center" },
  { label: "Size", field: "sqft", flex: "flex-[0.6] text-center" },
];

export function LibraryList({
  libraries,
  driveTimes,
  sort,
  onSortChange,
  now,
}: LibraryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const driveTimeMap = new Map(driveTimes.map((dt) => [dt.libraryId, dt]));

  const handleSort = (field: SortField) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      onSortChange({
        field,
        direction: field === "name" ? "asc" : "desc",
      });
    }
  };

  const handleCardClick = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (libraries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium mb-2">No libraries match your filters</p>
        <p className="text-sm">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f6fa]">
      {/* Sort headers */}
      <div className="flex px-5 py-2.5 bg-white border-b border-gray-200 sticky top-0 z-10">
        {COLUMNS.map((col) => (
          <button
            key={col.field}
            onClick={() => handleSort(col.field)}
            className={`${col.flex} text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors select-none ${
              sort.field === col.field
                ? "text-indigo-500"
                : "text-gray-400 hover:text-indigo-400"
            }`}
          >
            {col.label}
            {sort.field === col.field && (
              <span className="ml-0.5">
                {sort.direction === "asc" ? " ↑" : " ↓"}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Library cards */}
      {libraries.map((lib) => (
        <div key={lib.id}>
          <LibraryCard
            library={lib}
            driveTime={driveTimeMap.get(lib.id) ?? null}
            isExpanded={expandedId === lib.id}
            onClick={() => handleCardClick(lib.id)}
            now={now}
          />
          {expandedId === lib.id && (
            <LibraryDetail
              library={lib}
              driveTime={driveTimeMap.get(lib.id) ?? null}
              now={now}
            />
          )}
        </div>
      ))}
    </div>
  );
}
