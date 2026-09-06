import type { ImageMetadata } from 'astro';
import order from '../data/gallery.json';

/* Every image file in src/assets/gallery/, keyed by filename. */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gallery/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

const byName = new Map<string, ImageMetadata>(
  Object.entries(modules).map(([path, mod]) => [path.split('/').pop()!, mod.default]),
);

/* Display order comes from src/data/gallery.json — an explicit list of filenames.
   Filenames themselves carry no ordering meaning. */
const listed = (order as string[]).filter((name) => {
  if (byName.has(name)) return true;
  console.warn(
    `[gallery] "${name}" is listed in src/data/gallery.json but no matching file ` +
      `exists in src/assets/gallery/ — skipped`,
  );
  return false;
});

// Files not in the manifest go to the TOP (newest-first), so freshly dropped
// artwork leads the gallery without editing gallery.json.
const unlisted = [...byName.keys()]
  .filter((name) => !(order as string[]).includes(name))
  .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

if (unlisted.length > 0) {
  console.warn(
    `\n[gallery] ${unlisted.length} image(s) not in src/data/gallery.json, ` +
      `added at the top:\n${unlisted.map((n) => `  - ${n}`).join('\n')}\n`,
  );
}

/** Full gallery, in display order. `id` is the image's filename. */
export const galleryImages: { id: string; image: ImageMetadata }[] = [...unlisted, ...listed].map(
  (name) => ({ id: name, image: byName.get(name)! }),
);

/** Look up one image by filename (e.g. "001.png"). Used by the home "Destaques" strip. */
export function galleryImage(name: string): ImageMetadata {
  const image = byName.get(name);
  if (!image) {
    throw new Error(`No gallery image "${name}" in src/assets/gallery/`);
  }
  return image;
}
