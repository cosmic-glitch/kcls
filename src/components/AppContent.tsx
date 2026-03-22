"use client";

import { useState, useMemo, useCallback } from "react";
import librariesData from "@/data/libraries.json";
import type { Library, Filters, SortConfig, UserLocation } from "@/lib/types";
import { filterLibraries, sortLibraries } from "@/lib/filters";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useDriveTimes } from "@/hooks/useDriveTimes";
import { TopBar } from "@/components/TopBar";
import { LocationPrompt } from "@/components/LocationPrompt";
import { FilterBar } from "@/components/FilterBar";
import { LibraryList } from "@/components/LibraryList";
import { MapPanel } from "@/components/MapPanel";

const libraries = librariesData as Library[];

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
  });

  const [sort, setSort] = useState<SortConfig>({
    field: "driveTime",
    direction: "asc",
  });

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(
    () => filterLibraries(libraries, filters, driveTimes, now),
    [filters, driveTimes, now]
  );

  const sorted = useMemo(
    () => sortLibraries(filtered, sort, driveTimes),
    [filtered, sort, driveTimes]
  );

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

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
      />

      {showLocationPrompt && (
        <LocationPrompt onLocationSet={setManualLocation} />
      )}

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={libraries.length}
        filteredCount={sorted.length}
        hasLocation={!!userLocation}
      />

      {driveLoading && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-7 py-2 text-xs text-indigo-600 font-medium">
          Calculating drive times...
        </div>
      )}

      {/* Mobile list/map toggle */}
      <div className="md:hidden flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setShowMap(false)}
          className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
            !showMap
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-400"
          }`}
        >
          List
        </button>
        <button
          onClick={() => setShowMap(true)}
          className={`flex-1 py-2 text-xs font-semibold text-center transition-colors ${
            showMap
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-400"
          }`}
        >
          Map
        </button>
      </div>

      <div className="flex flex-1 min-h-0" style={{ height: "calc(100vh - 120px)" }}>
        <div className={`${showMap ? "hidden" : "flex-1"} md:flex-[0_0_58%] md:block overflow-y-auto border-r border-gray-200`}>
          <LibraryList
            libraries={sorted}
            driveTimes={driveTimes}
            sort={sort}
            onSortChange={setSort}
            now={now}
          />
        </div>
        <div className={`${showMap ? "flex-1" : "hidden"} md:flex-1 md:flex md:flex-col`}>
          <MapPanel
            libraries={sorted}
            userLocation={userLocation}
            highlightedLibraryId={highlightedId}
            onPinClick={handlePinClick}
          />
        </div>
      </div>
    </main>
  );
}
