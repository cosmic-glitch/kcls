"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { Library, UserLocation } from "@/lib/types";

interface MapPanelProps {
  libraries: Library[];
  userLocation: UserLocation | null;
  highlightedLibraryId: string | null;
  onPinClick: (libraryId: string) => void;
}

export function MapPanel({
  libraries,
  userLocation,
  highlightedLibraryId,
  onPinClick,
}: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || !mapRef.current) {
      setError("Google Maps API key not configured");
      return;
    }

    setOptions({ key: apiKey, v: "weekly", libraries: ["marker"] });

    importLibrary("maps")
      .then(({ Map }) => {
        const center = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : { lat: 47.6062, lng: -122.1321 };

        mapInstanceRef.current = new Map(mapRef.current!, {
          center,
          zoom: 11,
          mapId: "kcls-finder-map",
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
      })
      .catch(() => setError("Failed to load Google Maps"));
  }, []);

  // Update markers when libraries change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => (marker.map = null));
    markersRef.current.clear();

    libraries.forEach((lib, index) => {
      const pinContent = document.createElement("div");
      pinContent.style.cssText = `
        width:28px;height:28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 8px rgba(79,70,229,0.35);cursor:pointer;
      `;
      const letter = document.createElement("span");
      letter.textContent = String.fromCharCode(65 + (index % 26));
      letter.style.cssText = `
        transform:rotate(45deg);font-size:11px;font-weight:700;
        color:white;font-family:Inter,system-ui,sans-serif;
      `;
      pinContent.appendChild(letter);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: lib.lat, lng: lib.lng },
        content: pinContent,
        title: lib.name,
      });

      marker.addListener("click", () => onPinClick(lib.id));
      markersRef.current.set(lib.id, marker);
    });

    if (userLocation) {
      const userDot = document.createElement("div");
      userDot.style.cssText = `
        width:14px;height:14px;background:#10b981;
        border:3px solid rgba(16,185,129,0.3);border-radius:50%;
        box-shadow:0 0 12px rgba(16,185,129,0.4);
      `;
      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
        content: userDot,
        title: "Your location",
      });
    }
  }, [libraries, userLocation, onPinClick]);

  if (error) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        {error}
      </div>
    );
  }

  return <div ref={mapRef} className="flex-1 min-h-0" />;
}
