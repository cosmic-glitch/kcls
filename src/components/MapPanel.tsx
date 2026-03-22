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
  const [containerHeight, setContainerHeight] = useState(600);

  // Measure available height
  useEffect(() => {
    const updateHeight = () => {
      const el = mapRef.current?.parentElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.height > 0) {
          setContainerHeight(rect.height);
        }
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Initialize map
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    // Ensure the div has dimensions before creating map
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
  }, [containerHeight]); // Re-init when height changes from 0 to real value

  // Center on user location
  useEffect(() => {
    if (!map || !userLocation || hasCenteredOnUser.current) return;
    hasCenteredOnUser.current = true;
    const bounds = new google.maps.LatLngBounds();
    const offset = 0.15;
    bounds.extend({ lat: userLocation.lat - offset, lng: userLocation.lng - offset });
    bounds.extend({ lat: userLocation.lat + offset, lng: userLocation.lng + offset });
    map.fitBounds(bounds);
  }, [map, userLocation]);

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
      <div style={{ width: "100%", height: containerHeight }} className="bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        {error}
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: "100%", height: containerHeight }} />;
}
