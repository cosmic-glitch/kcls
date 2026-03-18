# KCLS Library Finder — Design Spec

## Overview

A web app that helps anyone in King County find a KCLS library branch to visit based on distance, Google rating, review count, size, hours, and other attributes. Users see a ranked, sortable, filterable list alongside an interactive map.

## Goals

- Let users quickly compare nearby KCLS branches (~50 total) on multiple criteria
- Auto-detect user location; no login or library card required
- Keep infrastructure minimal: static data, no database, near-zero ongoing cost

## Architecture

**Fully static approach.** Library data is pre-fetched into a JSON file via a CLI script, committed to the repo, and deployed as a static asset. The only runtime API calls are client-side: Google Maps Distance Matrix for drive times from the user's location.

```
┌─────────────────────────────────────────────┐
│  CLI Script (manual, ~monthly)              │
│  Google Places API → libraries.json         │
│  + manual-overrides.json merge              │
└──────────────────┬──────────────────────────┘
                   │ commit & deploy
┌──────────────────▼──────────────────────────┐
│  Vercel (static Next.js)                    │
│  ┌────────────────────────────────────────┐ │
│  │ Browser                                │ │
│  │ - Loads libraries.json (static)        │ │
│  │ - Requests geolocation                 │ │
│  │ - Calls Distance Matrix API (2 reqs)   │ │
│  │ - All filter/sort logic client-side    │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Data Model

Each library entry in `data/libraries.json`:

```json
{
  "id": "bellevue",
  "name": "Bellevue Library",
  "address": "1111 110th Ave NE, Bellevue, WA 98004",
  "lat": 47.6168,
  "lng": -122.1852,
  "phone": "(425) 450-1765",
  "website": "https://kcls.org/locations/bellevue-library/",
  "googlePlaceId": "ChIJ...",
  "googleRating": 4.5,
  "googleReviewCount": 312,
  "sqft": 50000,
  "photos": ["url1", "url2"],
  "hours": {
    "monday": "10:00 AM - 9:00 PM",
    "tuesday": "10:00 AM - 9:00 PM"
  },
  "popularTimes": {},
  "wheelchairAccessible": true,
  "lastUpdated": "2026-03-15"
}
```

**Data sources:**
- Google Places API: name, address, coordinates, rating, review count, photos, hours, wheelchair accessibility, popular times, place ID
- Manual overrides file (`scripts/manual-overrides.json`): sqft and any other supplemental data not available from Google

The `sqft` field is optional. Libraries without it render "—" in the size column and are excluded from size-specific filter values (but shown when filter is "Any").

## Data Refresh Script

A Node.js CLI script at `scripts/fetch-library-data.ts`:

1. Maintains a hardcoded list of all KCLS branch Google Place IDs
2. Fetches current data from Google Places API for each branch
3. Merges with `scripts/manual-overrides.json` (overrides take precedence)
4. Writes `src/data/libraries.json`
5. User commits and deploys

**Usage:**
```bash
GOOGLE_API_KEY=xxx npx tsx scripts/fetch-library-data.ts
```

Expected to be run manually, roughly monthly. Library data is slow-moving.

## Frontend Layout

Single-page app with three zones:

### Top Bar
- App title ("KCLS Library Finder")
- Auto-detected location display with green pulse indicator ("Redmond, WA — auto-detected")
- Fallback to manual location input if geolocation is denied

### Filter Bar
Below the top bar. Controls:
- **Distance**: dropdown — Within 15 / 30 / 45 / 60 min (disabled until location is available)
- **Rating**: dropdown — Any / 3+ / 4+ / 4.5+
- **Size**: dropdown — Any / Small / Medium / Large
- **Open Now**: toggle switch
- **Results count**: "Showing X of 50 libraries"

All filters are combinative (AND logic).

### Main Area — Split View

**Left panel (~58%): Library list**
- Sortable column headers: Library, Rating, Reviews, Drive Time, Size
- Click header to sort ascending/descending
- Each row is a card showing: name, address, open/closed status badge, rating (number + stars), review count, drive time + distance, size + category badge (Large/Medium/Small)
- Clicking a card expands an inline detail panel below it showing:
  - Full hours for today
  - Phone number
  - Wheelchair accessibility
  - Popular times bar chart
  - Photos (from Google)
  - Action buttons: Get Directions, Google Maps, KCLS Page

**Right panel (~42%): Map**
- Google Maps embed with pins for all filtered libraries
- Pin letters correspond to list position
- User location shown as green dot
- Clicking a pin highlights the corresponding list card (and vice versa)

### Visual Design
- Light theme (always, no dark mode)
- White top bar and filter bar, soft gray (#f5f6fa) background
- White library cards with subtle shadow, lift on hover
- Indigo/purple (#4f46e5 → #7c3aed) accent gradient for buttons, active states, map pins
- Green badges for open, orange for closed
- Color-coded size badges: purple (Large), blue (Medium), pink (Small)
- Inter font family

### Responsive Behavior
- On narrow screens (< 768px), map hides behind a "Show Map" toggle button
- Library list goes full width
- Filter bar wraps or collapses behind a "Filters" button

## Drive Time Calculation

1. On page load, browser requests geolocation permission
2. If granted, user coordinates are sent to Google Maps Distance Matrix API
   - API supports 25 destinations per request, so ~2 requests for 50 libraries
   - Results cached in session storage to avoid re-fetching on filter/sort changes
3. If denied, a text input appears for address or zip code entry
   - Address is geocoded via Google Geocoding API, then Distance Matrix is called
4. Distance filter is disabled with a note ("Enable location to filter by distance") until location is available

## Error Handling

- **Geolocation denied**: Location input bar appears. Distance/drive time columns show "—". All other features work.
- **No filter matches**: "No libraries match your filters" message with "Clear filters" button.
- **Missing data fields**: Cards render "—" for missing values. Size filter excludes unknown-size libraries from specific size categories but includes them under "Any".
- **Google Maps API errors**: Map panel shows fallback message. List still works fully from static JSON.
- **Slow network**: Libraries load instantly from static JSON. Drive times may lag — show loading spinners in drive time cells until resolved.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API via `@googlemaps/js-api-loader`
- **Hosting**: Vercel (static export)
- **APIs** (client-side): Google Maps Distance Matrix, Google Maps embed
- **APIs** (build-time / CLI): Google Places API
- **No database, no server functions, no auth**

## Project Structure

```
kcls/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main (only) page
│   ├── components/
│   │   ├── LibraryList.tsx     # Sortable list with cards
│   │   ├── LibraryCard.tsx     # Individual row card
│   │   ├── LibraryDetail.tsx   # Expanded detail panel
│   │   ├── MapPanel.tsx        # Google Maps embed
│   │   ├── FilterBar.tsx       # Filter controls
│   │   └── LocationPrompt.tsx  # Geolocation / manual entry
│   ├── hooks/
│   │   ├── useGeolocation.ts   # Browser geolocation hook
│   │   └── useDriveTimes.ts    # Distance Matrix API + caching
│   ├── lib/
│   │   ├── types.ts            # Library data types
│   │   ├── filters.ts          # Filter/sort logic
│   │   └── time.ts             # Open/closed status calculation
│   └── data/
│       └── libraries.json      # Static library data
├── scripts/
│   ├── fetch-library-data.ts   # CLI data refresh script
│   └── manual-overrides.json   # Manual sqft etc.
├── public/
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Dependencies

- `next` (v15)
- `react`, `react-dom` (v19)
- `tailwindcss`
- `@googlemaps/js-api-loader`
- `tsx` (dev, for running the fetch script)

## API Keys

- **Google Maps JavaScript API key**: Used client-side, restricted to the deployed domain. Exposed in browser but safe with domain restriction. Environment variable: `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.
- **Google Places API key**: Used only in the CLI fetch script, never deployed. Passed as environment variable at script runtime: `GOOGLE_API_KEY`.

## Out of Scope

- User accounts / login
- Favorites or saved libraries
- Dark mode
- Real-time data (all data is cached)
- Server-side rendering of drive times
- Mobile native app
