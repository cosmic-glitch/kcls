"use client";

import type { Library, LibrarySystem, DriveTimeResult } from "@/lib/types";
import { SYSTEM_DISPLAY_NAMES } from "@/lib/types";
import { isOpenNow, getTodayHours } from "@/lib/time";
import { getSizeCategory } from "@/lib/filters";

const SYSTEM_BADGE_STYLES: Record<LibrarySystem, string> = {
  kcls: "bg-indigo-100 text-indigo-700",
  spl: "bg-emerald-100 text-emerald-700",
  "sno-isle": "bg-sky-100 text-sky-700",
  everett: "bg-amber-100 text-amber-700",
  "pierce-county": "bg-rose-100 text-rose-700",
  tacoma: "bg-violet-100 text-violet-700",
};

const SYSTEM_PIN_BG: Record<LibrarySystem, string> = {
  kcls: "bg-indigo-600",
  spl: "bg-emerald-600",
  "sno-isle": "bg-sky-600",
  everett: "bg-amber-600",
  "pierce-county": "bg-rose-600",
  tacoma: "bg-violet-600",
};

interface LibraryCardProps {
  library: Library;
  driveTime: DriveTimeResult | null;
  isExpanded: boolean;
  onClick: () => void;
  now: Date;
  majorityHours: string | null;
  pinLabel?: string;
}

const SIZE_BADGE_STYLES = {
  large: "bg-purple-100 text-purple-700",
  medium: "bg-blue-100 text-blue-700",
  small: "bg-pink-100 text-pink-700",
} as const;

function StarRating({ rating }: { rating: number }) {
  const percentage = (rating / 5) * 100;
  return (
    <div className="relative inline-block text-[10px] leading-none">
      <span className="text-gray-300 tracking-wider">★★★★★</span>
      <span
        className="absolute top-0 left-0 text-amber-500 tracking-wider overflow-hidden whitespace-nowrap"
        style={{ width: `${percentage}%` }}
      >
        ★★★★★
      </span>
    </div>
  );
}

export function LibraryCard({
  library,
  driveTime,
  isExpanded,
  onClick,
  now,
  majorityHours,
  pinLabel,
}: LibraryCardProps) {
  const open = isOpenNow(library.hours, now);
  const todayHours = getTodayHours(library.hours, now);
  const hasDifferentHours = open && todayHours !== null && todayHours !== majorityHours;
  const sizeCategory = getSizeCategory(library.sqft);

  return (
    <div
      onClick={onClick}
      className={`flex items-center px-5 py-2.5 cursor-pointer transition-all relative border-b border-gray-100 ${
        isExpanded
          ? "bg-indigo-50/50 border-l-[3px] border-l-indigo-600"
          : "hover:bg-indigo-50/30 border-l-[3px] border-l-transparent hover:border-l-indigo-400"
      }`}
    >
      {/* Pin label */}
      {pinLabel && (
        <div className={`w-6 h-6 rounded-full ${SYSTEM_PIN_BG[library.system]} text-white text-[10px] font-bold flex items-center justify-center shrink-0 mr-2.5`}>
          {pinLabel}
        </div>
      )}

      {/* Library info */}
      <div className="flex-[2.2] min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1.5">
          {library.name}
          <span
            className={`inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${SYSTEM_BADGE_STYLES[library.system]}`}
          >
            {SYSTEM_DISPLAY_NAMES[library.system]}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">
          {library.address}
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          {open ? (
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
              ● Open
            </span>
          ) : (
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200">
              ● Closed
            </span>
          )}
          {hasDifferentHours && (
            <span className="text-[10px] text-gray-400 italic">
              Different hours
            </span>
          )}
        </div>
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
              {library.sqft.toLocaleString()}
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

      {/* Google Rating + Reviews */}
      <div className="flex-[0.8] text-center">
        <div className="font-bold text-[15px] text-gray-900">
          {library.googleRating}
        </div>
        <StarRating rating={library.googleRating} />
        <div className="text-[10px] text-gray-400 mt-0.5">
          {library.googleReviewCount} reviews
        </div>
      </div>
    </div>
  );
}
