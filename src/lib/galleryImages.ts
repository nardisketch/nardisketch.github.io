import type { ImageMetadata } from 'astro';

/* Every image file in src/assets/gallery/ — the full gallery page is built
   straight from this list, so adding artwork is just dropping a file in that
   folder. */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gallery/*.{png,jpg,jpeg,webp,avif}',
  { eager: true },
);

export const galleryImages: { id: string; image: ImageMetadata }[] = Object.entries(modules)
  .map(([path, mod]) => ({
    id: path.split('/').pop()!.replace(/\.[^.]+$/, ''),
    image: mod.default,
  }))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const byId = new Map(galleryImages.map((g) => [g.id, g.image]));

/** Look up a single gallery image by file stem, e.g. "001". Used by the
    home-page "Destaques" strip (src/content/pt/featured.json). */
export function galleryImage(id: string): ImageMetadata {
  const image = byId.get(id);
  if (!image) {
    throw new Error(`No gallery image found for id "${id}" (src/assets/gallery/${id}.*)`);
  }
  return image;
}
