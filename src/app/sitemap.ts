import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Static sitemap for the MVP's core routes. As SEO landing pages are added
 * (see section 17 of the brief, e.g. /cheap-flights-from-sydney), append
 * them here rather than generating thousands of thin programmatic pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/search`, changeFrequency: "daily", priority: 0.6 },
  ];
}
