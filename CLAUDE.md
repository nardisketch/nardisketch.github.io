# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio website for **"Nardi Sketch"** (Luana Nardi) — a concept artist and graphic
designer specializing in custom artwork for D&D and RPG tabletop games. Content is in
Brazilian Portuguese. Deployed to **GitHub Pages** (user site, repo `nardisketch.github.io`) at
`https://nardisketch.github.io/`.

Built with **Astro** (static output). React is used for exactly one interactive piece
(the gallery lightbox), hydrated as an island.

> Migration in progress (branch `astro-migration`). The original hand-written static
> site still lives at the repo root as a parity reference: `index.html`, `gallery.html`,
> `styles.css`, `gallery.css`, `main.js`, `gallery.js`. These are **removed at cutover**
> once the Astro build is confirmed at visual parity. Do not edit them.

## Development

```bash
npm install
npm run dev       # http://localhost:4321/
npm run build     # -> dist/
npm run preview   # serves dist/
npm run gallery   # interactive reorder tool for src/data/gallery.json
```

Node 22 (`.nvmrc`). No test suite. No linter configured.

## Architecture

- **`astro.config.mjs`** — `site` (no `base`; user site served at the root);
  `build.format: 'file'` so the gallery page is emitted as `/gallery.html`.
- **`src/pages/`** — `index.astro` (all home sections, anchor ids `#inicio` `#galeria`
  `#pacotes` `#termos` `#orcamento`) and `gallery.astro` (full masonry gallery + lightbox).
- **`src/components/`** — all `.astro` (zero JS) except `Lightbox.tsx` (React island,
  `client:idle`, on the gallery page only). `Nav.astro` carries a tiny inline `<script>`
  for the hamburger menu.
- **`src/content/pt/`** + **`src/content.config.ts`** — content collections (Zod-typed
  JSON), the single source of truth for editable text content:
  - `packages.json` — `section: 'simples'|'adicionais'|'especiais'`, `hidden` keeps an
    item in data without rendering it (the old commented-out "PACOTES ESPECIAIS" block).
  - `terms.json` — `kind: 'step'|'info'`, ordered.
  - `site.json` — singleton (`id: config`): brand, about copy, WhatsApp/email/socials,
    and a `ui` object holding section headings and nav labels.
- **`src/data/`** — plain ordered filename lists (not collections):
  - `gallery.json` — every image on the full gallery page, **in display order**. Array
    position IS the order; filenames carry no ordering meaning. Files present in
    `src/assets/gallery/` but missing here are appended at the end (with a build warning).
  - `featured.json` — the ~5 filenames shown in the home-page **Destaques** strip.
- **`src/lib/`** — `site.ts` (`getSite()`); `galleryImages.ts` (`galleryImages` — resolves
  `src/data/gallery.json` against the files in `src/assets/gallery/`, in order, appending
  any unlisted; `galleryImage(name)` looks one up by filename for the Destaques strip);
  `withBase.ts` (`withBase(path)` for hand-written links / `public/` files — NOT for
  `<Image>` or hash anchors).
- **`src/styles/`** — global CSS, imported by `BaseLayout.astro` in order
  `tokens.css` → `fonts.css` → `global.css`. `lightbox.css` is imported only by
  `gallery.astro`. `tokens.css` holds color custom properties; `@media` breakpoints are
  literal (`600px`, `768px`, plus the masonry cascade `1200/800/500`).
- **`src/assets/`** — `capa.webp` (hero), `gallery/*.png` (the full gallery), `fonts/` (self-hosted
  Elnora + Elegante, woff2 + ttf fallback). Images are served through Astro `<Image>` /
  `getImage()` as responsive WebP.

## Common tasks

- **Add artwork (full gallery):** drop an image file in `src/assets/gallery/`
  (`.png/.jpg/.webp/.avif`). It appears at the end of the gallery until you place it —
  filenames don't affect order. Position it with `npm run gallery` (interactive) or by
  moving its line in `src/data/gallery.json`.
- **Remove artwork:** delete the file (and its line in `src/data/gallery.json`).
- **Change the home-page Destaques strip:** edit `src/data/featured.json` — a list of
  ~5 filenames, in display order.
- **Change prices / packages / terms / contact:** edit the relevant file in
  `src/content/pt/`. Schemas in `src/content.config.ts` validate at build.
- **Edit section headings / nav labels:** `src/content/pt/site.json` → `ui`.

## Deployment

`.github/workflows/deploy.yml` builds with `withastro/action` and publishes with
`actions/deploy-pages` on push to `main` (PRs build only). Requires repo
**Settings → Pages → Source = "GitHub Actions"** (one-time, manual).

## Notes / caveats

- **Fonts:** Elnora and Elegante are Burntilldead "Demo Version" fonts — a paid
  commercial license is required before commercial use. Flagged with a `TODO(licensing)`
  in `src/styles/fonts.css`. Cardo + Playfair are self-hosted via `@fontsource`.
- **Base path:** the site deploys at the root, so `withBase()` is currently a
  passthrough — but keep using it for hand-written links / `public/` refs so a future
  move back to a sub-path only needs an `astro.config` change.
- **Lightbox wheel zoom** uses a manually-registered non-passive `wheel` listener
  (React's `onWheel` can't `preventDefault`). Touch/pinch/swipe are not implemented
  (the original didn't have them either).
- Rollback tag: `pre-astro` marks the last commit of the original static site.
