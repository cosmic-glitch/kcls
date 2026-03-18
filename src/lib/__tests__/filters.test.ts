import { getSizeCategory, filterLibraries, sortLibraries } from "../filters";
import type { Library, Filters, SortConfig, DriveTimeResult } from "../types";

const makeLibrary = (overrides: Partial<Library>): Library => ({
  id: "test",
  name: "Test Library",
  address: "123 Test St",
  lat: 47.6,
  lng: -122.1,
  phone: "(555) 555-5555",
  website: "https://example.com",
  googlePlaceId: "ChIJ_test",
  googleRating: 4.0,
  googleReviewCount: 100,
  sqft: 20000,
  photos: [],
  hours: { monday: "10:00 AM - 9:00 PM" },
  popularTimes: {},
  wheelchairAccessible: true,
  lastUpdated: "2026-03-15",
  ...overrides,
});

describe("getSizeCategory", () => {
  it("returns 'small' for < 10000 sqft", () => {
    expect(getSizeCategory(8000)).toBe("small");
  });
  it("returns 'medium' for 10000-30000 sqft", () => {
    expect(getSizeCategory(20000)).toBe("medium");
  });
  it("returns 'large' for > 30000 sqft", () => {
    expect(getSizeCategory(50000)).toBe("large");
  });
  it("returns null for null sqft", () => {
    expect(getSizeCategory(null)).toBeNull();
  });
  it("returns 'medium' for exactly 10000", () => {
    expect(getSizeCategory(10000)).toBe("medium");
  });
  it("returns 'large' for exactly 30001", () => {
    expect(getSizeCategory(30001)).toBe("large");
  });
});

describe("filterLibraries", () => {
  const libraries = [
    makeLibrary({ id: "a", googleRating: 4.5, sqft: 50000 }),
    makeLibrary({ id: "b", googleRating: 3.5, sqft: 8000 }),
    makeLibrary({ id: "c", googleRating: 4.2, sqft: null }),
  ];

  const defaultFilters: Filters = {
    maxDriveMinutes: null,
    minRating: null,
    sizeCategory: null,
    openNow: false,
  };

  it("returns all libraries with no filters", () => {
    const result = filterLibraries(libraries, defaultFilters, [], new Date());
    expect(result).toHaveLength(3);
  });

  it("filters by minimum rating", () => {
    const result = filterLibraries(
      libraries,
      { ...defaultFilters, minRating: 4.0 },
      [],
      new Date()
    );
    expect(result.map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("filters by size category", () => {
    const result = filterLibraries(
      libraries,
      { ...defaultFilters, sizeCategory: "large" },
      [],
      new Date()
    );
    expect(result.map((l) => l.id)).toEqual(["a"]);
  });

  it("includes null-sqft libraries when size filter is null", () => {
    const result = filterLibraries(libraries, defaultFilters, [], new Date());
    expect(result.map((l) => l.id)).toContain("c");
  });

  it("filters by drive time", () => {
    const driveTimes: DriveTimeResult[] = [
      { libraryId: "a", durationMinutes: 10, distanceMiles: 3 },
      { libraryId: "b", durationMinutes: 40, distanceMiles: 15 },
      { libraryId: "c", durationMinutes: 20, distanceMiles: 8 },
    ];
    const result = filterLibraries(
      libraries,
      { ...defaultFilters, maxDriveMinutes: 30 },
      driveTimes,
      new Date()
    );
    expect(result.map((l) => l.id)).toEqual(["a", "c"]);
  });
});

describe("sortLibraries", () => {
  const libraries = [
    makeLibrary({ id: "a", name: "Alpha", googleRating: 4.0, googleReviewCount: 100, sqft: 20000 }),
    makeLibrary({ id: "b", name: "Beta", googleRating: 4.8, googleReviewCount: 50, sqft: 50000 }),
    makeLibrary({ id: "c", name: "Charlie", googleRating: 4.3, googleReviewCount: 200, sqft: null }),
  ];

  it("sorts by rating descending", () => {
    const config: SortConfig = { field: "googleRating", direction: "desc" };
    const result = sortLibraries(libraries, config, []);
    expect(result.map((l) => l.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by name ascending", () => {
    const config: SortConfig = { field: "name", direction: "asc" };
    const result = sortLibraries(libraries, config, []);
    expect(result.map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by review count descending", () => {
    const config: SortConfig = { field: "googleReviewCount", direction: "desc" };
    const result = sortLibraries(libraries, config, []);
    expect(result.map((l) => l.id)).toEqual(["c", "a", "b"]);
  });

  it("sorts by sqft descending, null goes last", () => {
    const config: SortConfig = { field: "sqft", direction: "desc" };
    const result = sortLibraries(libraries, config, []);
    expect(result.map((l) => l.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts by drive time ascending", () => {
    const driveTimes: DriveTimeResult[] = [
      { libraryId: "a", durationMinutes: 20, distanceMiles: 8 },
      { libraryId: "b", durationMinutes: 5, distanceMiles: 2 },
      { libraryId: "c", durationMinutes: 15, distanceMiles: 6 },
    ];
    const config: SortConfig = { field: "driveTime", direction: "asc" };
    const result = sortLibraries(libraries, config, driveTimes);
    expect(result.map((l) => l.id)).toEqual(["b", "c", "a"]);
  });
});
