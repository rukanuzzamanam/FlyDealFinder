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
    { url: `${siteUrl}/flexible-dates`, changeFrequency: "daily", priority: 0.6 },
    { url: `${siteUrl}/deals`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/explore`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/cheap-flights-from-sydney`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/sydney-to-bali-flights`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/sydney-to-tokyo-flights`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/sydney-to-bangkok-flights`, changeFrequency: "daily", priority: 0.7 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/cookies`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/disclaimer`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/affiliate-disclosure`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
