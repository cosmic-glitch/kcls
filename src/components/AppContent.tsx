"use client";

import { useState, useMemo, useCallback } from "react";
import librariesData from "@/data/libraries.json";
import type { Library, Filters, SortConfig, UserLocation } from "@/lib/types";
import { filterLibraries, sortLibraries } from "@/lib/filters";
import { getMajorityHours } from "@/lib/time";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDriveTimes } from "@/hooks/useDriveTimes";
import { TopBar } from "@/components/TopBar";
import { LocationPrompt } from "@/components/LocationPrompt";
import { FilterBar } from "@/components/FilterBar";
import { LibraryList } from "@/components/LibraryList";
import { MapPanel } from "@/components/MapPanel";

// Add default system for libraries that don't have one yet (pre-migration data)
const libraries = (librariesData as (Library | Omit<Library, "system">)[]).map((lib) => ({
  ...lib,
  system: "system" in lib ? lib.system : "kcls" as const,
})) as Library[];

export default function AppContent() {
  const { location: autoLocation, loading: geoLoading, error: geoError } = useGeolocation();
  const [manualLocation, setManualLocation] = useState<UserLocation | null>(null);
  const userLocation = manualLocation ?? autoLocation;

  const { driveTimes, loading: driveLoading } = useDriveTimes(libraries, userLocation);

  const [filters, setFilters] = useState<Filters>({
    maxDriveMinutes: null,
    minRating: null,
    sizeCategory: null,
    openNow: false,
    system: null,
  });

  const [sort, setSort] = useState<SortConfig>({
    field: "driveTime",
    direction: "asc",
  });

  const now = useMemo(() => new Date(), []);
  const majorityHours = useMemo(() => getMajorityHours(libraries, now), [now]);

  const filtered = useMemo(
    () => filterLibraries(libraries, filters, driveTimes, now),
    [filters, driveTimes, now]
  );

  const sorted = useMemo(
    () => sortLibraries(filtered, sort, driveTimes),
    [filtered, sort, driveTimes]
  );

  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handlePinClick = useCallback((libraryId: string) => {
    setHighlightedId(libraryId);
  }, []);

  const showLocationPrompt = !geoLoading && !userLocation;

  return (
    <main className="min-h-screen bg-[#f5f6fa] flex flex-col">
      <TopBar
        location={userLocation}
        locationLoading={geoLoading}
        locationError={geoError}
        todayHours={majorityHours}
      />

      {showLocationPrompt && (
        <LocationPrompt onLocationSet={setManualLocation} />
      )}

      {driveLoading && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-7 py-2 text-xs text-indigo-600 font-medium">
          Calculating drive times...
        </div>
      )}

      {/* Mobile: stacked map + list */}
      <div className="md:hidden flex flex-col" style={{ height: "calc(100vh - 110px)" }}>
        <div style={{ height: "200px", minHeight: "200px" }}>
          <MapPanel
            libraries={sorted}
            userLocation={userLocation}
            highlightedLibraryId={highlightedId}
            onPinClick={handlePinClick}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <LibraryList
            libraries={sorted}
            driveTimes={driveTimes}
            sort={sort}
            onSortChange={setSort}
            now={now}
            majorityHours={majorityHours}
            highlightedId={highlightedId}
          />
        </div>
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden md:flex flex-1 min-h-0" style={{ height: "calc(100vh - 170px)" }}>
        <div className="flex-[0_0_58%] overflow-y-auto border-r border-gray-200">
          <LibraryList
            libraries={sorted}
            driveTimes={driveTimes}
            sort={sort}
            onSortChange={setSort}
            now={now}
            majorityHours={majorityHours}
            highlightedId={highlightedId}
          />
        </div>
        <div className="flex-1" style={{ height: "calc(100vh - 170px)" }}>
          <MapPanel
            libraries={sorted}
            userLocation={userLocation}
            highlightedLibraryId={highlightedId}
            onPinClick={handlePinClick}
          />
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={libraries.length}
        filteredCount={sorted.length}
        hasLocation={!!userLocation}
      />
    </main>
  );
}
