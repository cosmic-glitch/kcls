"use client";

import { useState } from "react";
import type { UserLocation } from "@/lib/types";

interface LocationPromptProps {
  onLocationSet: (location: UserLocation) => void;
}

export function LocationPrompt({ onLocationSet }: LocationPromptProps) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: address.trim() });

      if (result.results.length === 0) {
        setError("Could not find that address");
        return;
      }

      const { lat, lng } = result.results[0].geometry.location;
      onLocationSet({
        lat: lat(),
        lng: lng(),
        label: result.results[0].formatted_address,
      });
    } catch {
      setError("Failed to look up address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-7 py-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <span className="text-sm text-amber-800 font-medium">
          📍 Enter your location to see drive times:
        </span>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address or zip code"
          className="flex-1 max-w-xs px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Looking up..." : "Set Location"}
        </button>
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </form>
    </div>
  );
}
