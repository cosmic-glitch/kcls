"use client";

import { useState, useEffect } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { Library, UserLocation, DriveTimeResult } from "@/lib/types";

const STORAGE_KEY = "library-drive-times";
const BATCH_SIZE = 25;

interface DriveTimesState {
  driveTimes: DriveTimeResult[];
  loading: boolean;
  error: string | null;
}

function getCachedDriveTimes(locationKey: string): DriveTimeResult[] | null {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed.locationKey !== locationKey) return null;
    return parsed.driveTimes;
  } catch {
    return null;
  }
}

function setCachedDriveTimes(
  locationKey: string,
  driveTimes: DriveTimeResult[]
) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ locationKey, driveTimes })
    );
  } catch {
    // Session storage full or unavailable
  }
}

export function useDriveTimes(
  libraries: Library[],
  userLocation: UserLocation | null
): DriveTimesState {
  const [driveTimes, setDriveTimes] = useState<DriveTimeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLocation || libraries.length === 0) {
      setDriveTimes([]);
      return;
    }

    const locationKey = `${userLocation.lat.toFixed(4)},${userLocation.lng.toFixed(4)}`;
    const cached = getCachedDriveTimes(locationKey);
    if (cached) {
      setDriveTimes(cached);
      return;
    }

    let cancelled = false;

    async function fetchDriveTimes() {
      setLoading(true);
      setError(null);

      try {
        // Ensure Google Maps API is loaded (on mobile, MapPanel may not be rendered)
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
        if (!apiKey) throw new Error("Google Maps API key not configured");
        setOptions({ key: apiKey, v: "weekly" });
        await importLibrary("maps");

        const service = new google.maps.DistanceMatrixService();
        const origin = { lat: userLocation!.lat, lng: userLocation!.lng };
        const results: DriveTimeResult[] = [];

        for (let i = 0; i < libraries.length; i += BATCH_SIZE) {
          if (cancelled) return;

          const batch = libraries.slice(i, i + BATCH_SIZE);
          const destinations = batch.map((lib) => ({
            lat: lib.lat,
            lng: lib.lng,
          }));

          const response = await service.getDistanceMatrix({
            origins: [origin],
            destinations,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL,
          });

          response.rows[0].elements.forEach((element, index) => {
            if (element.status === "OK") {
              results.push({
                libraryId: batch[index].id,
                durationMinutes: Math.round(element.duration.value / 60),
                distanceMiles: parseFloat(
                  (element.distance.value / 1609.34).toFixed(1)
                ),
              });
            }
          });
        }

        if (!cancelled) {
          setDriveTimes(results);
          setCachedDriveTimes(locationKey, results);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to calculate drive times");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDriveTimes();

    return () => {
      cancelled = true;
    };
  }, [libraries, userLocation]);

  return { driveTimes, loading, error };
}
