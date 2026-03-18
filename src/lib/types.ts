export interface Library {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  website: string;
  googlePlaceId: string;
  googleRating: number;
  googleReviewCount: number;
  sqft: number | null;
  photos: string[];
  hours: Record<string, string>;
  popularTimes: Record<string, number[]>;
  wheelchairAccessible: boolean;
  lastUpdated: string;
}

export type SizeCategory = "small" | "medium" | "large";

export type SortField = "name" | "googleRating" | "googleReviewCount" | "driveTime" | "sqft";

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface Filters {
  maxDriveMinutes: number | null;
  minRating: number | null;
  sizeCategory: SizeCategory | null;
  openNow: boolean;
}

export interface DriveTimeResult {
  libraryId: string;
  durationMinutes: number;
  distanceMiles: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}
