# PayLah supported merchant finder

Explore 121 supported Singapore hawker locations on an interactive map. Search by name, address or postal code, find locations near you, and hover or tap a pin for participating stall names and units.

## Develop locally

Use Node.js 22.12+ within the Node 22 release line and pnpm 8.15.6.

```sh
cd site
pnpm install --frozen-lockfile
pnpm run dev
```

Open http://127.0.0.1:5173. Edit `site/src/` for automatic reload. No application secrets or API keys are required. Internet access supplies map tiles and fonts; geolocation asks for browser permission.

## Deploy on Vercel

Push this repository to your Git provider, import it as a Vercel project, and configure:

| Setting | Value |
| --- | --- |
| Root Directory | `site` |
| Framework Preset | Vite |
| Install Command | Automatic (detected from `pnpm-lock.yaml`) |
| Build Command | `pnpm run build` |
| Output Directory | `dist` |
| Node.js Version | 22.x |

`site/vercel.json` defines the framework, build command and output directory. No application environment variables are needed. For exact pnpm version pinning, optionally set the Vercel build environment variable `ENABLE_EXPERIMENTAL_COREPACK=1`; the project declares `pnpm@8.15.6`.

Vercel serves the map and data from the static build over HTTPS. Check Deployment Protection if you want visitors to access the published app without signing in. See [Vercel’s Vite guide](https://vercel.com/docs/frameworks/frontend/vite), [package manager detection](https://vercel.com/docs/package-managers) and [Corepack setup](https://vercel.com/docs/builds/configure-a-build#corepack).

## Verify changes

From `site/`:

```sh
pnpm test
pnpm run build
pnpm exec playwright install chromium
pnpm run test:e2e
```

GitHub Actions runs unit tests and the production build on pushes and pull requests. Browser tests run locally with the command above.

## Repository layout

- `site/`: application, pnpm lockfile, tests, developer scripts and Vercel configuration.
- `site/public/`: location/stall data, supplied reference documents and bundled map libraries.
- Root PDF and Markdown files: original supplied source material.
- `.github/workflows/ci.yml`: automated unit/build checks.

Dependencies, build output, test reports, source ZIPs, environment files and local `.vercel/` state are ignored by Git. The repository uses one Git history at the top level.

See [the app README](site/README.md) for detailed developer commands and data refresh instructions. Original application code is [MIT-licensed](LICENSE); third-party materials retain their terms in [third-party notices](site/THIRD_PARTY_NOTICES.md). Confirm current participation and offers with the vendor.
