# Refactor Plan — Portfolio Site → Product-Led Consulting Site

Status: approved for planning | Owner: Wes | Date: 2026-09-09 (rev 2 — post review)
Companion docs: `site_plan.md` (north-star page plan), `products.md` (product list)
Implementation agents: read this file first; do not invent structure beyond it.

---

## 1. Objective

Refactor the current single-page portfolio (static HTML at repo root, GitHub Pages
legacy deploy from `main`) into a **multi-page, SEO-friendly, product-led consulting
site**:

- Products (Extropian ecosystem) become first-class pages with licensing posture.
- Consulting/engineering services get their own page.
- Portfolio becomes a supporting page (selected + earlier work).
- Current WebGL demos move to a `/pocs/` page.
- Reuse existing media and most copy; keep the dark engineering-grid visual language.

## 2. Locked decisions

1. **Generator: Eleventy (11ty) v3** — templates under `src/`, generated into `dist/`,
   deployed via GitHub Actions artifact (Pages legacy mode switched off at cutover).
2. **Media, styles, scripts, demo libs stay at the repo root** and are passthrough-copied
   into `dist/` (project-root-relative `addPassthroughCopy`). Zero git moves of the
   150MB media tree; legacy root pages stay fully servable until cutover; URL paths
   (`/img/...`, `/vid/...`, `/styles/...`, `/scripts/...`, `/assets/...`) are unchanged.
3. **All 11 products get detail pages**, each carrying two public badge fields —
   **Type** and **Licensing** — with values defined in §6.3. No maturity/"status"
   badge: that concept is dropped until Wes asks for it back.
4. **Lean motion**: shared fixed header/footer, scramble-text accent on page H1s (over
   real, crawlable text), GSAP slider only on the portfolio featured row, no loading
   screen on subpages, no pinned fullscreen effects.
5. Plan recorded in this file.
6. **Home features 5 major products**: CAE Workbench, Spatial UI, Synthesis, Composer,
   Geometry (featuredOnHome: true).
7. **Analytics (wiley.js) included on every page** via the base head partial.
8. **LinkedIn canonical handle**: `/in/extropian-engineer` (the new one).

## 3. Current state (verified 2026-09-09)

### 3.1 Content assets
- `index.html` (690 lines, single scroll page): hero (logo + scramble "Wes Cramblitt"),
  What I Do (3 capability articles w/ videos), Case Studies (CAPARS, HyperFat/Whoosh,
  Autoligo, AlphaACT, Solvere + 2 testimonials), Past Work (16 filterable project cards),
  Demos (2 live WebGL canvases: CFD + raycaster), Why Work With Me (4 bullets), Engage
  (5 engagement models), Contact (email + LinkedIn + X). No `<title>`/meta description,
  no `<html lang>`.
- `archive.html` (194 lines): chronological full history (10 entries w/ years). Links
  LinkedIn `/in/wescramblitt` while index.html uses `/in/extropian-engineer` — resolved: use `/in/extropian-engineer` everywhere (see §2.8).
- `scripts/`: `header-tabs.js` (scrollspy), `slides.js` (section slider — document-wide
  auto-init on `.section` with >1 `.article`), `scrolling-sections.js` (pinned 3D cards,
  NOT used), `responsive-videos.js` (HEAD-probes `-mobile`/`-tablet` variants on every
  debounced resize), `loading-screen.js`, `header-scramble.js` (writes empty H1/H2 via
  scrambleText — H1 is NOT in raw HTML today), demo dirs `cfd-demo/`, `cpu-raycaster-demo/`,
  `dice-demo/` (disabled), libs `graphics/`, `math/`, `simulation/` (imported with
  root-absolute paths `/scripts/...`).
- Media: `img/` 79 files + `icons/` subdir (62MB), `vid/` 20 files (82MB), `assets/`
  (mesh+textures for demos, 9.8MB).
- Design system: `styles/*.css` — fonts.css (Iceland, fluid `--fs-*`), background.css
  (`.engineering-grid`), articles.css, card.css, header.css (#55a selected, #595 CTA),
  hero.css, links.css, slides.css, canvas.css, loading.css, core.css, scrolling-sections.css
  (unused — keep file on disk, don't link it).
- GSAP 3.14.2 from jsdelivr — ~30 plugins loaded; only core + ScrambleText actually
  exercised (`slides.js` uses core only; ScrollTrigger block in header-tabs is commented
  out). Keep core + ScrambleText; drop the rest.
- Domain/deploy: GitHub Pages legacy from `main` root; CNAME `extropianengineer.com`
  (HTTPS enforced). `origin` = `wesleycramblitt/extropianengineer`.
- Analytics: `https://cdn.fromwiley.com/wiley.js` (`data-site="k955budqzmmokm97"`) on
  index only.
- Hygiene: stray tracked file named `'` deleted in worktree (`git status` dirty);
  `.gitignore` contains `.aider*` (line 1: `aider*` matches `.aider` too — fine).

### 3.2 Copy inventory (where new-page text comes from)
| New page section | Source |
|---|---|
| Home H1/H2 blocks | `site_plan.md` §`/` |
| What I Do capability language | index.html `#whatido` article copy |
| Why-work-with-me bullets | index.html `#whyworkwithme` |
| Engagement models | index.html `#engage` |
| Case-study writeups + testimonials | index.html `#casestudies`, `#pastwork`, archive.html |
| Product one-liners | `products.md` (needs light copy edit — see §7.2 note) |
| /engineering H2s | `site_plan.md` §`/engineering` |

---

## 4. Target information architecture

| Path | Purpose | Source |
|---|---|---|
| `/` (index) | Product-led landing | site_plan `/` |
| `/products/` | Ecosystem listing, 4 categories | site_plan `/products` |
| `/products/<slug>/` ×11 | Product detail pages | site_plan `/products/[product]` |
| `/engineering/` | Licensing + custom development | site_plan `/engineering` |
| `/portfolio/` | Selected featured rows + earlier work | site_plan `/portfolio` |
| `/about/` | Bio, expertise, building, OSS, interests, contact | site_plan `/about` |
| `/pocs/` | Live WebGL demos | site_plan `/pocs` |
| `/404.html` | Custom not-found | new |
| `sitemap.xml`, `robots.txt` | SEO | new |

### 4.1 Product categories (for `/products/`)
- **Simulation & AI**: Extropian Physics, Extropian Optimization, Extropian Synthesis
- **Engineering UI**: Extropian CAE Workbench, Extropian Spatial UI
- **Visualization & interaction**: Extropian Render, Extropian Composer, Extropian Viz
- **Core platform**: Extropian CAE (unified format), Extropian Geometry, Extropian Assets

### 4.2 Product slugs (11 — count verified against products.md)
`caeworkbench`, `spatialui`, `synthesis`, `composer`, `render`, `geometry`, `cae`
(unified format), `viz`, `physics`, `optimization`, `assets`.

### 4.3 Nav (all pages, header)
Logo → `/`; Products → `/products/`; Engineering → `/engineering/`; Portfolio →
`/portfolio/`; About → `/about/`; Demos → `/pocs/` (label TBD §13); Contact mailto
button in header right; footer = socials + email + copyright. Drop the old floating
bottom-right cluster.

---

## 5. Architecture — Eleventy

### 5.1 Repo layout (target — media/styles/scripts never move)
```
package.json
.eleventy.js
.gitignore            (+ dist/)
README.md             (updated: install/build/serve/deploy)
site_plan.md          (unchanged)
products.md           (kept as human-readable index; header note: canonical copy in src/products/*.md)
docs/refactor-plan.md (this file)
index.html            (LEGACY — delete only after cutover verified, §5.3)
archive.html          (LEGACY — delete only after cutover verified)
'                     (stray file — git rm in Phase 0)
img/  vid/  assets/   (static sources — passthrough copy, NEVER moved)
styles/  scripts/     (static sources — passthrough copy, NEVER moved)
CNAME                 (passthrough copy)
.github/workflows/deploy.yml
src/
  _data/
    site.json         (name, url, email, socials, nav, analytics, defaults)
    portfolio.js      (featured + earlier entries incl. quotes/media)
  _includes/
    layouts/base.njk        (head + header + footer + json-ld; front matter: title,
                             description, ogImage, extraCss[], extraScripts[], bodyClass)
    layouts/product.njk     (product detail template)
    partials/head.njk, header.njk, footer.njk, seo.njk, cards/*.njk
  index.njk           (assembled LAST — Phase 4)
  products.njk
  products/*.md       (11 files, front matter per §7.2)
  engineering.njk
  portfolio.njk
  about.njk
  pocs.njk
  archive.njk         (redirect stub → /portfolio/, noindex)
  404.njk             (noindex)
  sitemap.xml.njk
  robots.njk          (permalink /robots.txt)
dist/                 (generated, gitignored)
```

### 5.2 Config essentials
- `.eleventy.js`: `dir: { input: "src", output: "dist" }`; passthrough copy
  (project-root-relative — resolves from repo root, not `src/`):
  `"img"`, `"vid"`, `"assets"`, `"styles"`, `"scripts"`, `"CNAME"`, `".nojekyll"`.
- Templates Nunjucks; markdown product pages use `layout: layouts/product.njk` and
  directory permalinks `/products/<fileSlug>/`.
- Output keeps legacy paths `/img/...`, `/vid/...`, `/assets/...`, `/scripts/...` so
  demo module imports and fetches work unchanged (one exception fixed in §7.7).
- package.json: `"build": "eleventy"`, `"serve": "eleventy --serve"`;
  devDependency `@11ty/eleventy@^3.1.6` (Node ≥18; local v22, CI Node 24).
- No plugins; sitemap is a Nunjucks template over `collections.all`.

### 5.3 Deployment & cutover (strict sequence — do not reorder)
`.github/workflows/deploy.yml`:
```yaml
name: Deploy Eleventy site to Pages
on:
  push: { branches: ["main"] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency: { group: "pages", cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with: { node-version: "24", cache: "npm" }
      - run: npm ci
      - run: npx @11ty/eleventy
      - uses: actions/upload-pages-artifact@v5
        with: { path: "dist" }
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/deploy-pages@v5
```
(Action majors verified 2026-09-09; re-verify majors at implementation — checkout v7 /
setup-node v7 exist. Custom domain ⇒ no `--pathprefix`.)

Cutover steps:
1. Develop Phases 0–5 on `main` (legacy root pages + media untouched → live site
   unaffected).
2. Push infra commit (workflow + src/ + package.json). Run workflow manually
   (`workflow_dispatch`) to confirm green + inspect artifact/deploy preview URL.
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Verify live site on extropianengineer.com + HTTPS + all URLs from §4.
5. Only then: delete legacy `index.html`, `archive.html` (their content now lives in
   `src/`), and the stray `'` file. Rollback path at any point: flip Pages source back
   to "Deploy from a branch" — root legacy files still work because media was never moved.

### 5.4 Legacy URL handling
- `/archive.html` → generated stub: meta-refresh 0 → `/portfolio/`, `noindex`,
  canonical `/portfolio/`.
- Old in-page anchors (`#whatido`, `#casestudies`, `#pastwork`, `#demos`, `#engage`,
  `#whyworkwithme`, `#contact`) die with the legacy page. Where a section survives on
  the new home, keep its id; otherwise no stub.
- All internal links use trailing-slash form; sitemap emits trailing slashes.

---

## 6. Content model

### 6.1 `src/_data/site.json`
name "Extropian Engineer"; person "Wes Cramblitt"; url https://extropianengineer.com;
email wes@extropianengineer.com; linkedin (canonical handle — open item §13);
x https://x.com/extropianeng; github https://github.com/wesleycramblitt;
analyticsSite k955budqzmmokm97; nav array.

### 6.2 Product front matter (`src/products/*.md`)
```
title, tagline (edited-for-publication from products.md — grammar fixes only, no
               factual invention; Wes sign-off in Phase 2),
category (§4.1), type (§6.3 — one of: Software Package | Modular repository |
End user product), licensing (§6.3 — one of: BUSL | Open Source | Perpetual | SaaS),
order (within category), featuredOnHome (bool),
media: { type: video|image|none, src, poster? }   // optional
capabilities: [ ... ]        // H2 "Core capabilities"
foundation: [ ... ]          // H2 "Technical foundation"
licensing: [ ... ]           // H2 "Licensing & customization"
related: [ slug, ... ]
```
Body markdown = long-form intro paragraph under the H2 description.
**Copy-edit pass required**: products.md contains typos/fragments (Render "supoprt",
CAE "for to represent", Physics dangling "built", Viz tagline "Post Processing",
Synthesis run-on). Do not ship verbatim. Keep products.md as summary index only —
prepend a comment line pointing to src/products/*.md as canonical.

### 6.3 Product badges: Type & Licensing
Two public badge fields replace the earlier "status" concept (maturity is OUT of scope
until Wes says otherwise). Values are stored verbatim in front matter; a `badges` key in
site.json documents the allowed sets for consistent template rendering.

**Type** — what the artifact is:
- `Software Package` — an installable, runnable software deliverable.
- `Modular repository` — source-level component/library integrated into larger systems.
- `End user product` — a complete application aimed at end users.

**Licensing** — how it is offered 
- `BUSL` — Source-available while having an Additional Use Grant to prevent competitive product or services.
- `Open Source` — open-source licensed, typically GPL
- `Perpetual` — Closed source, perptual one-time license for organizational use.
- `SaaS` — hosted subscription.

**Proposed per-product assignment — Wes reviews at the Phase 2 kickoff (same sign-off
as the tagline copy-edit; adjust freely, these are starting points only):**

| Product | Type | Licensing |
|---|---|---|
| CAE Workbench | End user product | BUSL |
| Spatial UI | Modular repository | Perpetual |
| Synthesis | End user product | Perpetual |
| Composer | End user product | Perpetual |
| Render | Modular repository | BUSL |
| Geometry | Modular repository | Open Source |
| CAE (unified format) | Modular repository | Open Source |
| Viz | Software Package | Perpetual |
| Physics | Modular repository | Perpetual |
| Optimization | Modular repository | Open Source |
| Assets | Modular repository | Open Source |

### 6.4 Portfolio data (`src/_data/portfolio.js`)
Entry: `{ id, title, years, client?, category, featured, summary, detail, media
{type, src, poster?}, quote? {text, by}, tags[] }`. Copy verbatim from current
index/archive (keep all quotes); dedupe media (alphaact.gif == AA_FIRE_Gif_Rev20.gif).

**Featured (5):** CAPARS (Sandia), HyperFat/Whoosh (active), Autoligo, AlphaACT, Solvere.
**Earlier (10):** Real-time multiphysics simulator (2026–), Skills Over Paper,
HealthIQ, Brain Break, IGrad, Casino Poker Games, Dorger, CARES, Envista, MDAD — years
from archive.html.

---

## 7. Page-by-page spec

Shared: base layout provides fixed header/footer, analytics include, SEO head (§10),
`<html lang="en">`, body class `engineering-grid` + optional `bodyClass`.

### 7.1 Home `/` (assembled in Phase 4 — needs products + portfolio data)
1. Hero: H1 "Building an ecosystem of modular, high-performance scientific software"
   (real text in markup; scramble is an enhancement only) + subline from site_plan;
   background art (hero media map §8.1); CTAs "View Products", "Start an Engagement".
2. License / Customize / Build — 3 cards (site_plan copy) → `/engineering/`.
3. "Turn technical IP into usable software" — statement block (site_plan copy).
4. "Products I'm building" — grid of 5 featured product cards: **CAE Workbench,
   Spatial UI, Synthesis, Composer, Geometry** (title, tagline, optional media, Type +
   Licensing badges) + "View all 11 products" → `/products/`.
5. "Engineering background" — excerpt + link → `/about/`.
6. "Work with me" — teaser + CTA → `/engineering/`.
7. "Past portfolio" — 4 selected cards (CAPARS, HyperFat, Autoligo, AlphaACT)
   + link → `/portfolio/`.
8. Contact band.

### 7.2 Product pages `/products/<slug>/` (11, Phase 2)
Template-driven from front matter: H1 + Type + Licensing badges (badge styling
classes: `.badge--type`, `.badge--license`); H2 tagline/description (body);
Core capabilities (bullet grid); Technical foundation (list + related-product chips);
Licensing & customization (neutral copy — flexible-negotiation language from site_plan
§/engineering: negotiated around software, deployment model, scope, and ownership; the
Licensing badge gives the at-a-glance model) + per-product mailto CTA with prefilled
subject. Optional media block when `media.src` present. Breadcrumb Home / Products /
name. `Product` JSON-LD (§10).

### 7.3 `/products/` (Phase 2)
H1 Products; intro; **product browser component with ALL products** — same component
as home: filter chips (category) + search over the rail list, large slideshow stage
(name, badges, description, detail link). Below: "Every product, one click away" chip
links to all detail pages; cross-link to `/engineering/` ("custom development when
products aren't enough"). Product detail pages remain the deepest information layer.

### 7.4 `/engineering/` (Phase 3)
One-column flow per site_plan §`/engineering`: (1) Work with existing software;
(2) Customize an existing product; (3) Build on the ecosystem; (4) Flexible licensing —
licensing models as cards (perpetual / SaaS-hosted / project-scoped development /
stewardship retainer, aligned with existing engagement models); (5) Custom development
— fold in current engagement models: Technical Assessment, Fixed-Scope Modernization
Sprint, Embedded Specialist, Ongoing Stewardship, Strategic Product Partnership (copy
from `#engage`); (6) IP & ownership — visual comparison (Extropian IP licensed vs
client-owned project development); (7) A product-led approach; (8) Start a project CTA
band (mailto + 15-min fit call note). Case-study testimonials support sections 2–3.

### 7.5 `/portfolio/` (Phase 3)
H1 Portfolio; H2 "Selected engineering work" — **slider (opt-in, §9) or stacked rows**
for 5 featured entries (media + summary + quote where present); H2 "Earlier work" —
compact cards grid. No duplicated video source on the page.

### 7.6 `/about/` (Phase 3)
H1 "About Wes Cramblitt"; sections per site_plan, split live vs stubbed:
- LIVE now: Scientific software engineering (short positioning derived from existing
  public copy); Areas of expertise (cards from current What-I-Do/case-study stack);
  What I'm building (ecosystem overview from products data → `/products/`); Contact
  band (mailto + socials, live).
- STUBBED (clearly marked placeholders awaiting Wes input): Bio, Technical background,
  Interests; Open source & software ecosystem (link GitHub handle
  https://github.com/wesleycramblitt now; repo list later).
`Person` JSON-LD (name + sameAs extropian-engineer LinkedIn).

### 7.7 `/pocs/` (Phase 4)
Port the existing demo markup + controls verbatim from index `#demos`. **Required fix:
`scripts/cpu-raycaster-demo/app.js:13` fetches `"assets/mesh/cat.json"` page-relative —
add leading slash (`"/assets/mesh/cat.json"`)** so it survives at `/pocs/`. Optionally
enable `dice-demo` if it still runs. Canvases init only when this page is loaded
(front-matter-gated module include). WebGL smoke test must include switching the mesh
dropdown to Cat (silent 404 otherwise — loadJson swallows errors).

### 7.8 `/404.html`, `sitemap.xml`, `robots.txt`
404: branded + nav + links to /products, /portfolio, contact; `noindex`.
Sitemap: `collections.all` filtered to exclude `/404.html` and any `noindex` page
(archive stub), emit `site.url + url` with trailing slash.
Robots: `robots.njk` with `permalink: /robots.txt` (plain .txt files are NOT copied by
default — template with permalink avoids the trap).

---

## 8. Media reuse map (verified against current HTML)

### 8.1 Referenced today → keep assigned
| File | Current use | New home |
|---|---|---|
| vid/whoosh.webm (160KB) | HyperFat solver UI | Portfolio featured (HyperFat); candidate CAE Workbench product visual (same UI lineage) |
| vid/proto.mp4 (9.7MB) | Multiphysics simulator UI | Portfolio earlier (simulator); candidate product visual — re-encode first (§11) |
| vid/capars.webm (3.5MB) | CAPARS case study | Portfolio featured CAPARS |
| vid/autoligo.webm (3MB) | Autoligo case study | Portfolio featured Autoligo |
| vid/particles.mp4 (3.1MB) | "Make Complex Results Interactive" | Home positioning block; candidate Spatial UI/Composer visual |
| vid/gpucompute.webm (+-mobile/-tablet) | commented "Optimization & Inverse Design" | Candidate Physics/Optimization visual; else portfolio |
| vid/skillsoverpaper.webm (5MB) | Earlier work | Portfolio earlier |
| vid/brainbreak.mp4 (19MB) | Earlier work | Portfolio earlier (re-encode or click-to-load, §11) |
| vid/doubleballroulette.webm (15MB) | Earlier work | Portfolio earlier (re-encode or click-to-load, §11) |
| img/alphaact.gif | AlphaACT | Portfolio featured (dedupe vs AA_FIRE_Gif_Rev20.gif) |
| img/solvere.jpg | Solvere | Portfolio featured Solvere |
| img/healthiq.png, igrad.png, dorger.png, cares.webp, envista.jpg, mdad.png | Earlier work | Portfolio earlier cards |
| img/sphere.png | CFD/raycaster card | /pocs + candidate Render visual |
| img/logo.png | Brand | Header/footer/favicon |
| img/work.png (2.1MB), work-xl.png (2.1MB) | Hero bg responsive pair | Home hero bg (right-size, §11). NOTE: work-desktop.png exists but is unused today — archive unless Wes wants it |
| assets/mesh, assets/textures | Demo assets | /pocs only (paths unchanged after §7.7 fix) |

### 8.2 Orphan pools (triage Phase 5 with Wes — contact sheets available)
- `vid/03.02.2026_08.30.15_REC0.mp4` (19MB, Feb 2026) — likely current
  simulator/workbench footage → prime product-media candidate (confirm + compress).
- `vid/modernization*.webm`, `debug*.webm` — unused cuts; candidates for /engineering
  modernization copy; else archive/delete.
- `vid/baccarat*.webm` — casino alternates → portfolio alt media or delete.
- `img/Screenshot_20260131_174*.png` + `20260201_*` + `20260204_*` (~30) — recent
  product/UI screenshots; several byte-identical to `autoligo*.png` (dedupe). Likely
  product media for CAE Workbench/Spatial UI/Render/Physics → Wes visual confirm.
- `img/autoligo*.png` (7) — Autoligo detail shots (portfolio gallery).
- `img/capars.png`, `capars1.png` — CAPARS shots (portfolio gallery / posters).
- `img/ChatGPT-Image-*.png`, `img/DALL·E-*.webp` (4) — AI art; candidates: hero bg,
  Synthesis/Composer cards, OG image.
- `img/comingsoon.png` — placeholder motif for "in development" products.
- `img/222.png`, `333.png`, `ss.png`, `sop.png`, `ncRNA.png`, `Q8W3K0-1.png`,
  `history360.png`, `mccc.png`, `changetracker.png`, `Screenshot-2025-*.jpg`,
  `1740*.gif/jpg`, `img/whoosh.webp`, `icons/circuit.png` — stale/portfolio-era →
  delete or archive after Wes glance.
- Products without dedicated media (Synthesis, Composer, Viz, Optimization, Geometry,
  CAE format, Spatial UI, Assets) do NOT block launch: card/detail design supports a
  no-media state (badge + typographic treatment + optional generic art above).

### 8.3 Posters & CLS
Autoplay muted loop inline only above the fold. Every `<video>` gets a `poster`
(matching png/jpg where available, else ffmpeg-extracted frame) AND CSS `aspect-ratio`
reservation (videos have no intrinsic ratio — posters don't reserve space). Earlier-work
videos: `preload="none"` + poster + click-to-play.

---

## 9. Design system & interaction

- Keep: fonts.css tokens, `.engineering-grid` background, `.article-content`/`.box`
  article pattern, card.css, header language, accent palette (#55a / #595), Iceland.
- New CSS: `layout.css` (page shells/containers/spacing), `nav.css` (active state via
  `page.url`), `cards.css` (product/portfolio cards + Type/Licensing badges, `.badge--type` /
`.badge--license`), `footer.css`;
  refresh `hero.css` for page heroes. Keep `slides.css`. Never link
  `scrolling-sections.css` or `loading.css` (files stay for reference).
- **Per-page asset loading** (front matter in base layout):
  `extraScripts: []` (e.g. gsap core + scramble only where needed),
  `extraCss: []`, `bodyClass`. Demo modules load ONLY on `/pocs` via `bodyClass`
  guard (as today, `<script type="module">` tags live only in pocs.njk).
- `scripts/global.js`: nav active state, footer year, H1 scramble **enhancement over
  real markup text** (H1/H2 text present in raw HTML — crawlable; scramble animates
  into it). Scramble never required for content to exist.
- `slides.js` reuse: **scope the init** — change the `window.load` hook to call
  `initAllSectionSliders(document.querySelector("[data-slider]"))` and mark only the
  portfolio featured container `data-slider`. Never load on `/pocs/`, `/engineering/`.
- Drop: loading-screen, header-tabs scrollspy, scrolling-sections, unused GSAP plugins
  (load only gsap core + ScrambleText; add ScrollTrigger only if a page truly needs it —
  current sliders don't).
- Keep `responsive-videos.js` but only if `-mobile`/`-tablet` variants are retained;
  when retained, probe at initial load + orientation change (not every debounced resize).

---

## 10. SEO plan
- `<html lang="en">`; base layout emits `<title>`, meta description, canonical
  (`site.url + page.url`), OG/Twitter, robots per page front matter (defaults in
  site.json).
- Real H1/H2 semantics per site_plan on every page; H1 visible in raw HTML (no
  scramble-only heroes).
- JSON-LD: WebSite + Organization in base; `Product` (name, description, category, url)
  on product pages — no `offers` (badge values are positioning, not structured-data
claims); `Person` on /about.
- sitemap/robots/404 per §7.8.
- Fix current debt (no titles/descriptions, empty H1); product detail pages target
  long-tail ("CAE workbench", "GPU multiphysics solver", "scientific software licensing").

## 11. Performance notes
- Re-encode priority: `brainbreak.mp4` (~19MB), `03.02.2026_*.mp4` (~19MB),
  `doubleballroulette.webm` (~15MB), `proto.mp4` (~10MB) → webm/h264 target <2–4MB
  each; originals stay in git history only. `whoosh.webm` (160KB) is fine.
- Right-size hero art (`work.png`/`work-xl.png` ≈2.1MB each).
- Lazy-load below-fold `<img>`; explicit `aspect-ratio` for video boxes; click-to-play
  for earlier-work cards.
- No duplicated autoplay video source within a page (new pages dedupe vs today).
- Fonts + GSAP fetched only per page manifest (§9).
- Targets: Lighthouse ≥90 perf (post media pass), ≥95 SEO/a11y, no console errors.

## 12. Phases (implementation order — Home assembles last)

**Phase 0 — Scaffold (legacy-safe)**: `git rm "'"`; package.json; `.eleventy.js`;
base layout + partials (head/header/footer/seo) + site.json; deploy.yml; robots/404/
archive stubs; `.nojekyll` at root (passthrough). DoD: `npm ci && npm run build` green;
`eleventy --serve` serves every §4 URL with shared chrome; legacy root page still works
at `/` during dev (untouched); no root files moved.

**Phase 1 — Design system + shared components**: layout.css/nav.css/cards.css/footer.
css/hero refresh; header/footer/nav; Type/Licensing badge styles; per-page
front-matter wiring
(extraScripts/extraCss/bodyClass); global.js scramble-over-text. DoD: styled placeholders
at all URLs, desktop + mobile; H1 text present in raw HTML of every page.

**Phase 2 — Products**: Wes reviews the §6.3 Type/Licensing proposal table; write 11
front-matter files (type + licensing values confirmed; status field does not exist)
with copy-edited taglines (Wes sign-off); product.njk; `/products/` listing with 4
categories. DoD: 11 detail URLs render with Type/Licensing badges,
breadcrumb/JSON-LD, no dead links; no-media products look intentional.

**Phase 3 — Engineering, Portfolio, About**: copy per §7.4–7.6 (portfolio.js data from
current pages incl. all quotes; dedupe media refs). DoD: content complete; featured
slider opt-in works; earlier-work cards lazy/click-to-play; placeholders on About
clearly marked where Wes input pending.

**Phase 4 — Home + /pocs + SEO sweep**: assemble home from finished data (§7.1);
port demos incl. **cat.json leading-slash fix**; sitemap/robots/404 verification; meta
sweep. DoD: all §4 URLs live locally; WebGL smoke test incl. Cat mesh dropdown; H1s
present in raw HTML; sitemap excludes 404/noindex; Lighthouse SEO ≥95; dead-link check
(e.g. `lychee` or scripted link pass over dist) clean.

**Phase 5 — Media pass**: dedupe (§8.2), re-encode videos, posters + aspect ratios,
hero right-sizing, orphan triage with Wes (delete vs archive), responsive-videos
decision. DoD: portfolio page payload <8MB; Lighthouse perf ≥90; no console errors.

**Phase 6 — Cutover & launch**: push infra commit; run workflow manually → green on
clean runner; Settings → Pages Source "GitHub Actions"; verify live site + HTTPS + all
URLs + sitemap fetch; THEN delete legacy root html files; update README; external link
sanity (LinkedIn/X handles); confirm analytics present on live pages.

## 13. Open items for Wes (non-blocking; resolved items removed)
1. About stub content still pending: Bio, technical background, interests, OSS repo
   list (Profile link ships now — see §7.6).
2. Fold current 5 engagement models under /engineering as proposed (§7.4)?
3. Header label "Demos" vs "POCs" for /pocs/.
4. Orphan media triage (§8.2) — Wes eyeballs contact sheets during Phase 5.
5. Delete legacy root html + stray `'` file after cutover (planned in Phase 6 — confirm).

Decided 2026-09-09: badge fields = Type + Licensing, maturity status dropped (§2.3,
§6.3) · home featured five (§2.6) · wiley.js on all pages (§2.7) · LinkedIn =
/in/extropian-engineer (§2.8) · About stub set (§7.6).

Open (small): confirm or amend the proposed per-product Type/Licensing table in §6.3 —
needed at the Phase 2 kickoff, not before.
