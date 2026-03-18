"use client";

import type { Library, DriveTimeResult } from "@/lib/types";
import { getTodayHours, getCurrentBusyness } from "@/lib/time";
import { PopularTimesChart } from "./PopularTimesChart";

interface LibraryDetailProps {
  library: Library;
  driveTime: DriveTimeResult | null;
  now: Date;
}

const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

export function LibraryDetail({ library, driveTime, now }: LibraryDetailProps) {
  const todayHours = getTodayHours(library.hours, now);
  const dayName = DAY_NAMES[now.getDay()];
  const todayPopular = library.popularTimes[dayName];
  const currentHour = now.getHours();
  const busyness = getCurrentBusyness(library.popularTimes, now);

  const directionsUrl = driveTime
    ? `https://www.google.com/maps/dir/?api=1&destination=${library.lat},${library.lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(library.address)}`;

  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${library.googlePlaceId}`;

  return (
    <div className="bg-white border-t border-indigo-200 px-6 py-5 mx-1 shadow-sm">
      <div className="flex gap-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            {library.name}
          </h3>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Hours Today
              </div>
              <div className="text-sm text-gray-900">
                {todayHours ?? "Closed today"}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Phone
              </div>
              <div className="text-sm text-gray-900">{library.phone}</div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Accessibility
              </div>
              <div className="text-sm text-gray-900">
                {library.wheelchairAccessible ? "♿ Accessible" : "—"}
              </div>
            </div>
          </div>

          {todayPopular && (
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Busy Right Now
                {busyness !== null && (
                  <span className="ml-2 normal-case tracking-normal font-medium text-gray-500">
                    ({busyness}% busy)
                  </span>
                )}
              </div>
              <PopularTimesChart data={todayPopular} currentHour={currentHour} />
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg hover:-translate-y-0.5 transition-all shadow-md shadow-indigo-600/25"
            >
              Get Directions
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-gray-600 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Google Maps
            </a>
            <a
              href={library.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white text-gray-600 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              KCLS Page
            </a>
          </div>
        </div>

        {library.photos.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Photos
            </div>
            <div className="flex gap-2">
              {library.photos.slice(0, 3).map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${library.name} photo ${i + 1}`}
                  className="w-28 h-[70px] object-cover rounded-lg border border-gray-100"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
