"use client";

import type { Library, DriveTimeResult } from "@/lib/types";
import { isOpenNow, getTodayHours } from "@/lib/time";
import { getSizeCategory } from "@/lib/filters";

interface LibraryCardProps {
  library: Library;
  driveTime: DriveTimeResult | null;
  isExpanded: boolean;
  onClick: () => void;
  now: Date;
}

const SIZE_BADGE_STYLES = {
  large: "bg-purple-100 text-purple-700",
  medium: "bg-blue-100 text-blue-700",
  small: "bg-pink-100 text-pink-700",
} as const;

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25;
  return (
    <span className="text-[10px] text-amber-500 tracking-wider">
      {"★".repeat(fullStars)}
      {hasHalf ? "★" : ""}
      {"☆".repeat(5 - fullStars - (hasHalf ? 1 : 0))}
    </span>
  );
}

export function LibraryCard({
  library,
  driveTime,
  isExpanded,
  onClick,
  now,
}: LibraryCardProps) {
  const open = isOpenNow(library.hours, now);
  const todayHours = getTodayHours(library.hours, now);
  const sizeCategory = getSizeCategory(library.sqft);

  return (
    <div
      onClick={onClick}
      className={`flex items-center px-5 py-4 cursor-pointer transition-all relative border-b border-gray-100 ${
        isExpanded
          ? "bg-indigo-50/50 border-l-[3px] border-l-indigo-600"
          : "hover:bg-indigo-50/30 border-l-[3px] border-l-transparent hover:border-l-indigo-400"
      }`}
    >
      {/* Library info */}
      <div className="flex-[2.2] min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">
          {library.name}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">
          {library.address}
        </div>
        <div className="mt-1">
          {open ? (
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
              ● Open{todayHours ? ` until ${todayHours.split(" - ")[1]}` : ""}
            </span>
          ) : (
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
              ● Closed
            </span>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex-[0.7] text-center">
        <div className="font-bold text-[15px] text-gray-900">
          {library.googleRating}
        </div>
        <StarRating rating={library.googleRating} />
      </div>

      {/* Reviews */}
      <div className="flex-[0.6] text-center text-sm text-gray-500">
        {library.googleReviewCount}
      </div>

      {/* Drive time */}
      <div className="flex-[0.7] text-center">
        {driveTime ? (
          <>
            <div className="font-semibold text-sm text-gray-900">
              {driveTime.durationMinutes} min
            </div>
            <div className="text-[11px] text-gray-400">
              {driveTime.distanceMiles.toFixed(1)} mi
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-300">—</div>
        )}
      </div>

      {/* Size */}
      <div className="flex-[0.6] text-center">
        {library.sqft ? (
          <>
            <div className="text-sm text-gray-600">
              {library.sqft >= 1000
                ? `${Math.round(library.sqft / 1000)}K ft²`
                : `${library.sqft} ft²`}
            </div>
            {sizeCategory && (
              <span
                className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5 ${SIZE_BADGE_STYLES[sizeCategory]}`}
              >
                {sizeCategory === "medium" ? "Med" : sizeCategory}
              </span>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-300">—</div>
        )}
      </div>
    </div>
  );
}
