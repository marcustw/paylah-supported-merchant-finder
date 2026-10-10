# Hawker Nearby — local developer app

An MIT-licensed, vanilla JavaScript application mapping all 121 locations in the supplied PayLah! hawker list. Runs locally without a ChatGPT account, backend, environment variables or API key.

## Start developing

Use Node.js 22 (22.12 or newer) and pnpm 8.15.6 (or `nvm use` to select Node 22).

```sh
cd site
pnpm install --frozen-lockfile
pnpm run dev
```

Open **http://127.0.0.1:5173**. The Vite server binds only to your machine. Edit the source files and the browser updates automatically. Press Ctrl+C in the server terminal to stop it. If port 5173 is occupied, stop the existing server or run `pnpm run dev --port 5174`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Local development with automatic reload and CSS hot updates |
| `pnpm start` | Alias for the development server |
| `pnpm run build` | Generate the static application in `dist/` |
| `pnpm run preview` | Serve the built app locally at http://127.0.0.1:4173 |
| `pnpm test` | Data completeness, search, distance and radius tests |
| `pnpm run test:e2e` | Browser tests; starts the dev server if needed |
| `pnpm run source` | Create a portable source ZIP in `releases/` (requires Python 3) |

For browser tests, install Chromium once with `pnpm exec playwright install chromium` after `pnpm install --frozen-lockfile`.

## Source layout

- `index.html`: page structure and entry point.
- `src/app.js`: interactive map, geolocation, search, list and UI states.
- `src/geo.js`: distance calculations, filtering and sorting.
- `src/style.css`: responsive styles.
- `public/vendors.json`: coordinates and source provenance for all 121 locations.
- `public/supported-hawkers.md`: supplied location list.
- `public/participating-merchants.pdf`: original supplied DBS merchant document.
- `public/lib/`: locally bundled Leaflet and clustering libraries, with licences.
- `scripts/geocode.py`: populate missing coordinates from OneMap, preserving cached results.
- `tests/`: Node unit tests and Playwright browser tests.
- `vite.config.js`: local server and build configuration.
- `dist/`: generated output, not source; do not edit it.

## Features and data

Explore the island-wide clustered map; search names, addresses and listed postal codes; use device location for nearest-first results and 1/3/5/10 km filters; or choose a point on the map. Pins open location details and Google Maps directions.

The app is local, but map tiles, Google Fonts and directions use internet services. The vendor list and map libraries are local. Without internet, tiles may be unavailable; list search and distance calculations still work. Device location requires browser permission; localhost is supported. Coordinates stay in browser memory and are cleared on reload.

Coordinates were matched to exact postal codes through Singapore OneMap on 10 October 2026. Each record retains the lookup URL and returned address. The running app does not call the geocoding API. Python 3 is only needed for the optional data refresh and source archive scripts, not for normal development.

Distances are straight-line estimates, not walking distances. Locations are mostly centres and markets, not individual stalls. Check participation and current offers with the vendor. This project is not affiliated with DBS.

## Licence

Original code, tests and documentation are MIT-licensed; see `LICENSE`. Third-party libraries, supplied documents and data retain their own terms in `THIRD_PARTY_NOTICES.md`.

The application supports local development and static deployment to Vercel. See the repository README for Vercel setup.

## Participating stalls

Hover a map pin to view all its participating stall names and units. Click a pin or a location in the list to keep the details open; on mobile, tap. Long lists scroll inside the popup.

`public/participating-stalls.md` is the supplied stall listing. Run `python3 scripts/import-stalls.py` to regenerate `public/stalls.json` after updating it. The importer verifies all 133 source sections and 3,955 table entries, then combines sections with the same postal code. The map uses the existing 121 supported locations: 118 match the stall file, three have no matching entry, and one matching centre lists no stalls. Missing and empty entries are explicitly shown.

## Vercel

Import the repository into Vercel and set **Root Directory** to `site`. `vercel.json` selects Vite, builds with `pnpm run build`, and serves `dist`. Leave the Install Command at its automatic default so Vercel detects pnpm from `pnpm-lock.yaml`. Node 22 is selected by `package.json`. No application environment variables or API keys are needed.

To pin the exact pnpm 8.15.6 version on Vercel, optionally enable `ENABLE_EXPERIMENTAL_COREPACK=1` in the project build environment; Vercel then uses the `packageManager` field.

GitHub Actions deploys production after successful tests/builds on pushes to `main`. Automatic Vercel Git deployments are disabled in `vercel.json`. See [CI/CD setup in the repository README](../README.md#cicd-with-github-actions) for the three required GitHub secrets.

References: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [package manager detection](https://vercel.com/docs/package-managers), [Corepack setup](https://vercel.com/docs/builds/configure-a-build#corepack).
