import { getEntry } from 'astro:content';

/** The single `site` config entry (src/content/pt/site.json → id "config"). */
export async function getSite() {
  const entry = await getEntry('site', 'config');
  if (!entry) throw new Error('Missing content entry: site/config');
  return entry.data;
}
