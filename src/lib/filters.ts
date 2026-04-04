import type {
  Library,
  Filters,
  SortConfig,
  SizeCategory,
  DriveTimeResult,
} from "./types";
import { isOpenNow } from "./time";

export function getSizeCategory(sqft: number | null): SizeCategory | null {
  if (sqft === null) return null;
  if (sqft < 10000) return "small";
  if (sqft <= 30000) return "medium";
  return "large";
}

export function filterLibraries(
  libraries: Library[],
  filters: Filters,
  driveTimes: DriveTimeResult[],
  now: Date
): Library[] {
  const driveTimeMap = new Map(
    driveTimes.map((dt) => [dt.libraryId, dt])
  );

  return libraries.filter((lib) => {
    if (filters.system !== null && lib.system !== filters.system) {
      return false;
    }

    if (filters.minRating !== null && lib.googleRating < filters.minRating) {
      return false;
    }

    if (filters.sizeCategory !== null) {
      const category = getSizeCategory(lib.sqft);
      if (category !== filters.sizeCategory) return false;
    }

    if (filters.openNow && !isOpenNow(lib.hours, now)) {
      return false;
    }

    if (filters.maxDriveMinutes !== null) {
      const dt = driveTimeMap.get(lib.id);
      if (!dt || dt.durationMinutes > filters.maxDriveMinutes) return false;
    }

    return true;
  });
}

export function sortLibraries(
  libraries: Library[],
  sort: SortConfig,
  driveTimes: DriveTimeResult[]
): Library[] {
  const driveTimeMap = new Map(
    driveTimes.map((dt) => [dt.libraryId, dt])
  );

  const sorted = [...libraries].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    switch (sort.field) {
      case "name":
        aVal = a.name;
        bVal = b.name;
        break;
      case "googleRating":
        aVal = a.googleRating;
        bVal = b.googleRating;
        break;
      case "googleReviewCount":
        aVal = a.googleReviewCount;
        bVal = b.googleReviewCount;
        break;
      case "sqft": {
        const aSqft = a.sqft;
        const bSqft = b.sqft;
        if (aSqft === null && bSqft === null) return 0;
        if (aSqft === null) return 1;
        if (bSqft === null) return -1;
        aVal = aSqft;
        bVal = bSqft;
        break;
      }
      case "driveTime": {
        const aDt = driveTimeMap.get(a.id);
        const bDt = driveTimeMap.get(b.id);
        if (!aDt && !bDt) return 0;
        if (!aDt) return 1;
        if (!bDt) return -1;
        aVal = aDt.durationMinutes;
        bVal = bDt.durationMinutes;
        break;
      }
      default:
        return 0;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      const cmp = aVal.localeCompare(bVal);
      return sort.direction === "asc" ? cmp : -cmp;
    }

    const diff = (aVal as number) - (bVal as number);
    return sort.direction === "asc" ? diff : -diff;
  });

  return sorted;
}
