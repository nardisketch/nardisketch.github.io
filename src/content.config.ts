import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

/* The handful of images shown in the "Destaques" strip on the home page.
   The full gallery page is NOT driven by this — it auto-includes every file
   in src/assets/gallery/ (see src/lib/galleryImages.ts). */
const featured = defineCollection({
  loader: file('src/content/pt/featured.json'),
  schema: z.object({
    order: z.number().int(), // display order in the strip
    alt: z.string().default('Ilustração — Nardi Sketch'),
    span: z.union([z.literal(1), z.literal(2)]).default(1), // optional: span 2 columns
  }),
});

const packages = defineCollection({
  loader: file('src/content/pt/packages.json'),
  schema: z.object({
    section: z.enum(['simples', 'adicionais', 'especiais']),
    order: z.number().int(),
    name: z.string(),
    price: z.string().optional(),
    priceStrike: z.string().optional(), // crossed-out price (especiais)
    priceNote: z.string().optional(),
    features: z.array(z.string()).default([]), // bullet list (simples / especiais)
    paragraphs: z.array(z.string()).default([]), // prose lines (adicionais)
    hidden: z.boolean().default(false), // kept in data but not rendered
  }),
});

const terms = defineCollection({
  loader: file('src/content/pt/terms.json'),
  schema: z.object({
    kind: z.enum(['step', 'info']),
    order: z.number().int(),
    marker: z.string(), // "01".."06" for steps, an emoji for info items
    title: z.string(),
    body: z.string(),
  }),
});

const site = defineCollection({
  loader: file('src/content/pt/site.json'),
  schema: z.object({
    brand: z.string(),
    brandLines: z.array(z.string()),
    author: z.string(),
    tagline: z.string(),
    aboutHeading: z.string(),
    aboutParagraphs: z.array(z.string()),
    whatsapp: z.object({
      number: z.string(),
      display: z.string(),
      prefill: z.string(),
    }),
    email: z.string().email(),
    social: z.array(
      z.object({
        label: z.string(),
        handle: z.string(),
        url: z.string().url(),
      }),
    ),
    ui: z.object({
      navLinks: z.array(z.object({ label: z.string(), href: z.string() })),
      galleryHeading: z.string(),
      galleryButton: z.string(),
      galleryPageHeading: z.string(),
      galleryBackLabel: z.string(),
      packagesSimplesHeading: z.string(),
      packagesAdicionaisHeading: z.string(),
      packagesEspeciaisHeading: z.string(),
      termsHeading: z.string(),
      termsSubtitle: z.string(),
      contactHeading: z.string(),
      contactBlock1: z.string(),
      contactBlock2: z.string(),
      whatsappAriaLabel: z.string(),
    }),
  }),
});

export const collections = { featured, packages, terms, site };
