# ISC2 Tampa Bay Chapter Website

## Build & Dev

- `npm run build` — build the static site
- `npm run serve` — dev server with live reload
- `npx @11ty/eleventy --dryrun` — validate templates without writing output

## Architecture

- **Eleventy v3** static site generator with **Nunjucks** templates
- Content data lives in `src/_data/*.json` (events, leadership, navigation, site config)
- All pages use `base.njk` layout with shared `header.njk` and `footer.njk`
- Plain CSS with custom properties in `:root` (no preprocessor)
- Deployed to **GitHub Pages** via GitHub Actions on push to `main`
- Custom domain: `isc2chapter-tampabay.org`

## Conventions

- Event dates must be `YYYY-MM-DD` format
- Event times must be `h:MM AM/PM` format
- Event types: `chapter`, `community`, `holiday`
- Events in `events.json` are ordered reverse chronologically (newest first)
- Images go in `src/images/`
- New pages follow pattern: `src/{page}/index.njk` with YAML front matter (title, description, layout)
- Leadership images should be named `firstname-lastname.jpg`

## Key Files

- `eleventy.config.js` — Eleventy config with custom date/event filters
- `src/_data/events.json` — Chapter events calendar
- `src/_data/leadership.json` — Board members and leadership team
- `src/_data/site.json` — Site name, email, logo, social links
- `src/_data/navigation.json` — Main nav menu items
- `src/css/style.css` — All site styles
- `.github/workflows/deploy.yml` — CI/CD pipeline

## Do Not Edit Directly

- `package-lock.json` — managed by npm
- `src/CNAME` — custom domain config, do not change
- `_site/` — build output, gitignored
