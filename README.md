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

Create or import this repository as a Vercel project, and configure:

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

## CI/CD with GitHub Actions

`.github/workflows/ci.yml` checks every push and pull request. A push to `main`, including a merged pull request, deploys to Vercel production only after the tests and build succeed. Pull requests and other branches only run checks. Direct pushes to `main` also deploy; require pull requests in a GitHub ruleset if you want merges to be the only route to production.

One-time setup:

1. Create/import the Vercel project with **Root Directory** `site` and Node 22.x, using the settings above.
2. In GitHub, open **Settings → Secrets and variables → Actions → New repository secret**, then add:

   | Secret | Value |
   | --- | --- |
   | `VERCEL_TOKEN` | A token from [Vercel account tokens](https://vercel.com/account/tokens) with access to this project's team |
   | `VERCEL_ORG_ID` | The `orgId` from the linked project's `.vercel/project.json` |
   | `VERCEL_PROJECT_ID` | The `projectId` from the linked project's `.vercel/project.json` |

   To retrieve the IDs, run this from the **repository root**, select the existing project, then inspect the generated `.vercel/project.json` locally:

   ```sh
   pnpm dlx vercel@63.1.2 link
   ```

   Keep the generated `.vercel/` directory ignored. Do not commit tokens. The IDs and token must belong to the same Vercel project/team.

3. Commit and push this workflow. The next push/merge to `main` runs **Check and deploy app** in GitHub's Actions tab.
4. Optionally protect `main` with pull requests and the required `check` status. The workflow uses the GitHub `production` environment; leave required reviewers unset for automatic deployment.

The deployment job pulls production settings, builds a Vercel artifact, and uploads it with `--prebuilt --prod`. It uses a pinned Vercel CLI and serializes production deployments. Missing secrets fail with a setup message; failed checks prevent the deployment job from running.

`site/vercel.json` disables Vercel's automatic Git deployments so this workflow controls releases and failed checks cannot be bypassed by a parallel Git deployment. Automatic Vercel previews are also disabled. This follows [Vercel's GitHub Actions deployment pattern](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

## Verify changes

From `site/`:

```sh
pnpm test
pnpm run build
pnpm exec playwright install chromium
pnpm run test:e2e
```

GitHub Actions runs unit tests and the production build on pushes and pull requests, then deploys successful pushes to `main`. Browser tests run locally with the command above.

## Repository layout

- `site/`: application, pnpm lockfile, tests, developer scripts and Vercel configuration.
- `site/public/`: location/stall data, supplied reference documents and bundled map libraries.
- Root PDF and Markdown files: original supplied source material.
- `.github/workflows/ci.yml`: automated unit/build checks and Vercel production deployment.

Dependencies, build output, test reports, source ZIPs, environment files and local `.vercel/` state are ignored by Git. The repository uses one Git history at the top level.

See [the app README](site/README.md) for detailed developer commands and data refresh instructions. Original application code is [MIT-licensed](LICENSE); third-party materials retain their terms in [third-party notices](site/THIRD_PARTY_NOTICES.md). Confirm current participation and offers with the vendor.
