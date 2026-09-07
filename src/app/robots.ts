import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The booking flow and a specific booking are per-visitor state. Neither
      // is useful in a search result, and a half-filled form is a poor landing
      // page for someone arriving from one.
      disallow: ['/book', '/booking/', '/en/book', '/en/booking/', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
