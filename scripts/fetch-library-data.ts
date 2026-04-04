import { LIBRARY_BRANCHES } from "./library-branches";
import type { LibrarySystem } from "../src/lib/types";
import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("Error: GOOGLE_API_KEY environment variable is required.");
  console.error("Usage: GOOGLE_API_KEY=xxx npx tsx scripts/fetch-library-data.ts");
  console.error("Optional: --system <key> to fetch only one system (e.g., --system spl)");
  process.exit(1);
}

// Parse --system flag for single-system fetching
const systemArg = process.argv.indexOf("--system");
const targetSystem: LibrarySystem | null =
  systemArg !== -1 ? (process.argv[systemArg + 1] as LibrarySystem) : null;

interface PlaceResult {
  id: string;
  system: LibrarySystem;
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

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

async function findPlace(query: string): Promise<string | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
  );
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", API_KEY!);

  const res = await fetch(url.toString());
  const data = await res.json();
  return data.candidates?.[0]?.place_id ?? null;
}

async function getPlaceDetails(placeId: string): Promise<Partial<PlaceResult> | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,geometry,formatted_phone_number,website,rating,user_ratings_total,photos,opening_hours,wheelchair_accessible_entrance"
  );
  url.searchParams.set("key", API_KEY!);

  const res = await fetch(url.toString());
  const data = await res.json();
  const result = data.result;
  if (!result) return null;

  const hours: Record<string, string> = {};
  if (result.opening_hours?.periods) {
    for (const period of result.opening_hours.periods) {
      const dayName = DAY_MAP[period.open.day];
      if (dayName && period.open?.time && period.close?.time) {
        const openTime = formatTime(period.open.time);
        const closeTime = formatTime(period.close.time);
        hours[dayName] = `${openTime} - ${closeTime}`;
      }
    }
  }

  // Download photos at build time to avoid embedding API key in public JSON.
  const photos: string[] = [];
  const photoDir = path.join(__dirname, "..", "public", "photos");
  fs.mkdirSync(photoDir, { recursive: true });
  for (const photo of (result.photos ?? []).slice(0, 5)) {
    const ref = photo.photo_reference;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${ref}&key=${API_KEY}`;
    try {
      const photoRes = await fetch(photoUrl, { redirect: "follow" });
      if (photoRes.ok) {
        const buffer = Buffer.from(await photoRes.arrayBuffer());
        const filename = `${placeId}-${photos.length}.jpg`;
        fs.writeFileSync(path.join(photoDir, filename), buffer);
        photos.push(`/photos/${filename}`);
      }
    } catch {
      // Skip failed photo downloads
    }
  }

  return {
    name: result.name,
    address: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    phone: result.formatted_phone_number ?? "",
    website: result.website ?? "",
    googlePlaceId: placeId,
    googleRating: result.rating ?? 0,
    googleReviewCount: result.user_ratings_total ?? 0,
    photos,
    hours,
    wheelchairAccessible: result.wheelchair_accessible_entrance ?? false,
  };
}

function formatTime(time: string): string {
  const hour = parseInt(time.slice(0, 2), 10);
  const min = time.slice(2);
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h}:${min} ${period}`;
}

// Strip system-specific suffixes and generate a slug, prefixed by system key
const SYSTEM_SUFFIXES = [
  /\s*kcls\s*/gi,
  /\s*seattle public library\s*/gi,
  /\s*sno-isle libraries\s*/gi,
  /\s*everett public library\s*/gi,
  /\s*pierce county library\s*/gi,
  /\s*tacoma public library\s*/gi,
];

function toId(name: string, system: LibrarySystem): string {
  let slug = name.toLowerCase();
  for (const suffix of SYSTEM_SUFFIXES) {
    slug = slug.replace(suffix, "");
  }
  slug = slug
    .replace(/library connection @ /gi, "")
    .replace(/\s+library$/i, "")
    .replace(/\s+branch$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${system}-${slug}`;
}

async function main() {
  // Load manual overrides
  const overridesPath = path.join(__dirname, "manual-overrides.json");
  let overrides: Record<string, Partial<PlaceResult>> = {};
  try {
    overrides = JSON.parse(fs.readFileSync(overridesPath, "utf-8"));
  } catch {
    console.log("No manual overrides found, proceeding without them.");
  }

  const results: PlaceResult[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Determine which systems to fetch
  const systemsToFetch = targetSystem
    ? { [targetSystem]: LIBRARY_BRANCHES[targetSystem] }
    : LIBRARY_BRANCHES;

  for (const [systemKey, branches] of Object.entries(systemsToFetch)) {
    const system = systemKey as LibrarySystem;
    console.log(`\n=== ${systemKey.toUpperCase()} (${branches.length} branches) ===\n`);

    for (const branchName of branches) {
      console.log(`Fetching: ${branchName}...`);

      try {
        const placeId = await findPlace(branchName);
        if (!placeId) {
          console.warn(`  ⚠ Could not find place for: ${branchName}`);
          continue;
        }

        const details = await getPlaceDetails(placeId);
        if (!details) {
          console.warn(`  ⚠ Could not get details for: ${branchName}`);
          continue;
        }

        const id = toId(branchName, system);
        const override = overrides[id] ?? {};

        results.push({
          id,
          system,
          name: details.name ?? branchName,
          address: details.address ?? "",
          lat: details.lat ?? 0,
          lng: details.lng ?? 0,
          phone: details.phone ?? "",
          website: details.website ?? "",
          googlePlaceId: details.googlePlaceId ?? placeId,
          googleRating: details.googleRating ?? 0,
          googleReviewCount: details.googleReviewCount ?? 0,
          sqft: override.sqft ?? null,
          photos: details.photos ?? [],
          hours: details.hours ?? {},
          popularTimes: override.popularTimes ?? {},
          wheelchairAccessible: details.wheelchairAccessible ?? false,
          lastUpdated: today,
          ...override,
        });

        console.log(`  ✓ ${details.name} (${details.googleRating}★, ${details.googleReviewCount} reviews)`);

        // Rate limit: 150ms between requests
        await new Promise((r) => setTimeout(r, 150));
      } catch (err) {
        console.error(`  ✗ Error fetching ${branchName}:`, err);
      }
    }
  }

  // Write output
  const outPath = path.join(__dirname, "..", "src", "data", "libraries.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nDone! Wrote ${results.length} libraries to ${outPath}`);
}

main();
