import { asc, eq, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  maintenanceRules,
  serviceCategories,
  services,
  vehicleMakes,
  vehicleModels,
} from '@/db/schema';
import type { Locale } from '@/i18n/routing';

/**
 * Reference data for the demo garage.
 *
 * The garage itself never touches the server — the car and its history live in
 * `localStorage`. What comes from the database is only the shape of the
 * problem: the make/model list for the form, and the maintenance intervals the
 * projection runs against. Those are catalog facts, not user data.
 */

export type GarageMake = {
  slug: string;
  name: string;
  models: { slug: string; name: string; yearFrom: number; yearTo: number | null }[];
};

export type GarageRule = {
  serviceSlug: string;
  categorySlug: string;
  name: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  note: string | null;
};

export async function getGarageReference(locale: Locale) {
  const isAr = locale === 'ar';

  const [makeRows, modelRows, ruleRows] = await Promise.all([
    db.select().from(vehicleMakes).orderBy(asc(vehicleMakes.sort)),
    db.select().from(vehicleModels).orderBy(asc(vehicleModels.nameEn)),
    db
      .select({
        serviceSlug: services.slug,
        categorySlug: serviceCategories.slug,
        nameAr: services.nameAr,
        nameEn: services.nameEn,
        intervalKm: maintenanceRules.intervalKm,
        intervalMonths: maintenanceRules.intervalMonths,
        noteAr: maintenanceRules.noteAr,
        noteEn: maintenanceRules.noteEn,
      })
      .from(maintenanceRules)
      .innerJoin(services, eq(services.id, maintenanceRules.serviceId))
      .innerJoin(serviceCategories, eq(serviceCategories.id, services.categoryId))
      .where(isNotNull(services.id))
      .orderBy(asc(serviceCategories.sort), asc(services.sort)),
  ]);

  const makes: GarageMake[] = makeRows.map((make) => ({
    slug: make.slug,
    name: isAr ? make.nameAr : make.nameEn,
    models: modelRows
      .filter((model) => model.makeId === make.id)
      .map((model) => ({
        slug: model.slug,
        name: isAr ? model.nameAr : model.nameEn,
        yearFrom: model.yearFrom,
        yearTo: model.yearTo,
      })),
  }));

  const rules: GarageRule[] = ruleRows.map((rule) => ({
    serviceSlug: rule.serviceSlug,
    categorySlug: rule.categorySlug,
    name: isAr ? rule.nameAr : rule.nameEn,
    intervalKm: rule.intervalKm,
    intervalMonths: rule.intervalMonths,
    note: isAr ? rule.noteAr : rule.noteEn,
  }));

  return { makes, rules };
}
