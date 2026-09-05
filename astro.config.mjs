// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // User site (repo `nardisketch.github.io`) — served at the domain root, no base path.
  site: 'https://nardisketch.github.io',
  // Emit /gallery.html (not /gallery/) so the current public URL keeps working.
  build: { format: 'file' },
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
});
