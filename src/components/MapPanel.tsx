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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initStarted = useRef(false);
  const hasCenteredOnUser = useRef(false);

  // Initialize map once
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey || !mapRef.current) {
      setError("Google Maps API key not configured");
      return;
    }

    setOptions({ key: apiKey, v: "weekly" });

    importLibrary("maps")
      .then((mapsLib) => {
        const { Map } = mapsLib as google.maps.MapsLibrary;

        mapInstanceRef.current = new Map(mapRef.current!, {
          center: { lat: 47.5, lng: -122.2 },
          zoom: 10,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        setMapReady(true);
      })
      .catch(() => setError("Failed to load Google Maps"));
  }, []);

  // Center on user location — runs once when we first get a location
  useEffect(() => {
    if (!mapReady || !userLocation || hasCenteredOnUser.current) return;
    const map = mapInstanceRef.current;
    if (!map) return;
    hasCenteredOnUser.current = true;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    map.setZoom(11);
  }, [mapReady, userLocation]);

  // Update markers when libraries change
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;
  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    libraries.forEach((lib, index) => {
      const label = String.fromCharCode(65 + (index % 26));

      const marker = new google.maps.Marker({
        map,
        position: { lat: lib.lat, lng: lib.lng },
        title: lib.name,
        label: {
          text: label,
          color: "white",
          fontWeight: "700",
          fontSize: "11px",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4f46e5",
          fillOpacity: 1,
          strokeColor: "#7c3aed",
          strokeWeight: 2,
          scale: 14,
        },
      });

      marker.addListener("click", () => onPinClickRef.current(lib.id));
      markersRef.current.push(marker);
    });

    const loc = userLocationRef.current;
    if (loc) {
      const userMarker = new google.maps.Marker({
        map,
        position: { lat: loc.lat, lng: loc.lng },
        title: "Your location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#059669",
          strokeWeight: 2,
          scale: 8,
        },
      });
      markersRef.current.push(userMarker);
    }
  }, [libraries, mapReady]);

  if (error) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        {error}
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full" />;
}
