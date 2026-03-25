"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { Library, UserLocation } from "@/lib/types";

interface MapPanelProps {
  libraries: Library[];
  userLocation: UserLocation | null;
  highlightedLibraryId: string | null;
  onPinClick: (libraryId: string) => void;
}

let mapsLoaded = false;

export function MapPanel({
  libraries,
  userLocation,
  highlightedLibraryId,
  onPinClick,
}: MapPanelProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const hasCenteredOnUser = useRef(false);
  // No dynamic height measurement — use CSS calc directly

  // Initialize map
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError("Google Maps API key not configured");
      return;
    }

    if (!mapsLoaded) {
      setOptions({ key: apiKey, v: "weekly" });
      mapsLoaded = true;
    }

    let cancelled = false;

    importLibrary("maps")
      .then((mapsLib) => {
        if (cancelled) return;
        const { Map } = mapsLib as google.maps.MapsLibrary;

        const instance = new Map(el, {
          center: { lat: 47.6, lng: -122.15 },
          zoom: 10,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        setMap(instance);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load Google Maps");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Center on user location — fit bounds to nearest ~8 libraries
  useEffect(() => {
    if (!map || !userLocation || hasCenteredOnUser.current || libraries.length === 0) return;
    hasCenteredOnUser.current = true;

    const withDist = libraries.map((lib) => ({
      lib,
      dist: Math.pow(lib.lat - userLocation.lat, 2) + Math.pow(lib.lng - userLocation.lng, 2),
    }));
    withDist.sort((a, b) => a.dist - b.dist);
    const nearest = withDist.slice(0, 5);

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    for (const { lib } of nearest) {
      bounds.extend({ lat: lib.lat, lng: lib.lng });
    }
    map.fitBounds(bounds, 20);
  }, [map, userLocation, libraries]);

  // Update markers
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  const updateMarkers = useCallback(() => {
    if (!map) return;

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
          fontSize: "9px",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4f46e5",
          fillOpacity: 1,
          strokeColor: "#7c3aed",
          strokeWeight: 2,
          scale: 10,
        },
      });

      marker.addListener("click", () => onPinClickRef.current(lib.id));
      markersRef.current.push(marker);
    });

    if (userLocation) {
      const userMarker = new google.maps.Marker({
        map,
        position: { lat: userLocation.lat, lng: userLocation.lng },
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
  }, [map, libraries, userLocation]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        {error}
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
