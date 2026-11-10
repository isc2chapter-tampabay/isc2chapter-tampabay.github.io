# ISC2 Tampa Bay Chapter Website

## Build & Dev

- `npm run build` — build the static site
- `npm run serve` — dev server with live reload
- `npx @11ty/eleventy --dryrun` — validate templates without writing output

## Architecture

- **Eleventy v3** static site generator with **Nunjucks** templates
- **Events and presentations live in Cloudflare D1** (`isc2-tampa-db`), not in JSON. Edit them via `/admin` (Cloudflare Access protected). `src/_data/events.js` / `presentations.js` fetch `/api/*` at build time; `src/js/dynamic.js` re-fetches in the browser. `events.json` / `presentations.json` are fallbacks only used if the API is unreachable at build — editing them does not change the live site.
- Other content data lives in `src/_data/*.json` (leadership, navigation, site config)
- Cloudflare Pages Functions in `functions/` serve `/api/*` (D1, R2 uploads, subscribe); `functions/_middleware.js` gates writes and `/admin` behind Cloudflare Access
- All pages use `base.njk` layout with shared `header.njk` and `footer.njk`
- Plain CSS with custom properties in `:root` (no preprocessor)
- Deployed to **Cloudflare Pages** (`isc2-tampa-bay-chapter`), built from this GitHub repo on push to `main` (`.github/workflows/deploy.yml` also defines a wrangler deploy)
- Custom domain: `isc2chapter-tampabay.org`

## Conventions

- Event dates must be `YYYY-MM-DD` format
- Event times must be `h:MM AM/PM` format
- Event types: `chapter`, `community`, `holiday`
- D1 `events` schema is in `schema.sql`; `start_time`, `end_time`, `location` are required
- Images go in `src/images/`
- New pages follow pattern: `src/{page}/index.njk` with YAML front matter (title, description, layout)
- Leadership images should be named `firstname-lastname.jpg`

## Key Files

- `eleventy.config.js` — Eleventy config with custom date/event filters
- `src/_data/events.js` — Loads events from D1 API (falls back to `events.json`)
- `functions/api/*.js` — API endpoints backed by D1/R2
- `wrangler.toml` — Cloudflare Pages / D1 / R2 bindings
- `src/_data/leadership.json` — Board members and leadership team
- `src/_data/site.json` — Site name, email, logo, social links
- `src/_data/navigation.json` — Main nav menu items
- `src/css/style.css` — All site styles
- `.github/workflows/deploy.yml` — CI/CD pipeline

## Do Not Edit Directly

- `package-lock.json` — managed by npm
- `src/CNAME` — custom domain config, do not change
- `_site/` — build output, gitignored
