const base = import.meta.env.BASE_URL; // e.g. "/portfolio/"

/**
 * Prefix a root-relative path with the configured `base`.
 * Use for hand-written links, files in `public/`, canonical/og URLs.
 * Do NOT use for imported images (`<Image>` / `imported.src`) — Astro adds
 * the base itself — nor for same-page hash anchors.
 */
export function withBase(path: string): string {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
