import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { banners } from '@/db/schema';

export async function getActiveBanners() {
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sort));
}

export type BannerRow = Awaited<ReturnType<typeof getActiveBanners>>[number];
