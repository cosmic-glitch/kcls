"use client";

import type { UserLocation } from "@/lib/types";

interface TopBarProps {
  location: UserLocation | null;
  locationLoading: boolean;
  locationError: string | null;
  todayHours: string | null;
}

export function TopBar({ location, locationLoading, locationError, todayHours }: TopBarProps) {
  return (
    <header className="bg-white px-7 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-lg shadow-md shadow-indigo-600/20">
          📚
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          KCLS <span className="text-indigo-600">Finder</span>
        </span>
      </div>

      {todayHours && (
        <div className="text-center leading-tight">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Today</div>
          <div className="text-xs font-semibold text-gray-700">{todayHours}</div>
        </div>
      )}

      <div className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full text-sm text-gray-600">
        {locationLoading ? (
          <>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span>Detecting location...</span>
          </>
        ) : location ? (
          <>
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50" />
            <span>{location.label}</span>
            <span className="text-xs text-gray-400">auto-detected</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span className="text-gray-400">
              {locationError ?? "No location"}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
