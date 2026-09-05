import type { ImageMetadata } from 'astro';

/* Eagerly import every gallery source image so content entries can be matched
   to an optimizable asset by id ("001" -> src/assets/gallery/001.png). */
const images = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gallery/*.png',
  { eager: true },
);

export function galleryImage(id: string): ImageMetadata {
  const match = images[`../assets/gallery/${id}.png`];
  if (!match) {
    throw new Error(`No gallery image found for id "${id}" (src/assets/gallery/${id}.png)`);
  }
  return match.default;
}
