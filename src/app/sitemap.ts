import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getAllCategorySlugs, getAllServiceSlugs, getAllSymptomSlugs } from '@/server/queries/catalog';
import { getAllProviderSlugs } from '@/server/queries/providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/** Arabic is unprefixed, so `/ar/...` must never appear in the sitemap. */
function url(locale: string, path: string) {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${siteUrl}${prefix}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, services, symptoms, providers] = await Promise.all([
    getAllCategorySlugs(),
    getAllServiceSlugs(),
    getAllSymptomSlugs(),
    getAllProviderSlugs(),
  ]);

  const paths = [
    '',
    '/services',
    '/workshops',
    '/offers',
    '/garage',
    '/track',
    '/about',
    ...categories.map((slug) => `/services/${slug}`),
    ...services.map((row) => `/services/${row.categorySlug}/${row.slug}`),
    ...symptoms.map((slug) => `/symptoms/${slug}`),
    ...providers.map((slug) => `/workshops/${slug}`),
  ];

  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: url(locale, path),
      lastModified: new Date(),
      // The home page and the two directory roots are the entry points; detail
      // pages sit below them.
      priority: path === '' ? 1 : path.split('/').length === 2 ? 0.8 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((other) => [other, url(other, path)]),
        ),
      },
    })),
  );
}
