# Extropian Engineer — extropianengineer.com

Product-led consulting site: a multi-page, SEO-friendly Eleventy static site
generated from `src/` into `dist/`, deployed to GitHub Pages via GitHub Actions.

## Local development

    npm install
    npm run serve        # http://localhost:8080 (eleventy --serve)
    npm run build        # compile into dist/

## Layout

- `src/` — templates, layouts (`src/_includes`), data (`src/_data`)
  - `src/products/*.md` — product pages (canonical product copy; `products.md`
    at the repo root is only a human-readable index)
  - `src/_data/portfolio.js` — portfolio entries
- `img/ vid/ assets/ styles/ scripts/` — static sources, passthrough-copied
  into `dist/` unchanged (paths like `/img/...` are stable)
- `dist/` — build output (gitignored)
- `docs/refactor-plan.md` — architecture & implementation plan

## Deploy

Push to `main` → `.github/workflows/deploy.yml` builds Eleventy and deploys the
`dist/` artifact to GitHub Pages (source setting: GitHub Actions).
Custom domain: extropianengineer.com (no path prefix).
