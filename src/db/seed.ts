import 'dotenv/config';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { addDays, subDays } from 'date-fns';

config({ path: '.env.local', override: false });

import * as schema from './schema';
import { categories } from './seed/data/catalog';
import { symptoms } from './seed/data/symptoms';
import { makes } from './seed/data/vehicles';
import { providers as providerData, hourOverrides } from './seed/data/providers';
import { banners as bannerData } from './seed/data/banners';
import { generateUniqueBookingCode } from '@/server/services/booking-code';

const TZ = 'Asia/Qatar';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

/** QAR, rounded to the nearest 5 — nobody quotes 137.40 for a brake job. */
function shiftPrice(base: number, factor: number): string {
  return (Math.round((base * factor) / 5) * 5).toFixed(2);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`seed: ${message}`);
}

async function main() {
  const startedAt = Date.now();
  const now = new Date();

  // A seed that appends is a seed that lies about being reproducible.
  await db.delete(schema.bookingItems);
  await db.delete(schema.bookings);
  await db.delete(schema.reviews);
  await db.delete(schema.providerServices);
  await db.delete(schema.providerHourOverrides);
  await db.delete(schema.providerHours);
  await db.delete(schema.providers);
  await db.delete(schema.symptomServices);
  await db.delete(schema.symptomOptions);
  await db.delete(schema.symptoms);
  await db.delete(schema.maintenanceRules);
  await db.delete(schema.services);
  await db.delete(schema.serviceCategories);
  await db.delete(schema.vehicleModels);
  await db.delete(schema.vehicleMakes);
  await db.delete(schema.banners);

  // ---------------------------------------------------------------- catalog

  const serviceIdBySlug = new Map<string, number>();
  const serviceBySlug = new Map<string, (typeof categories)[number]['services'][number]>();

  for (const [index, category] of categories.entries()) {
    const [inserted] = await db
      .insert(schema.serviceCategories)
      .values({
        slug: category.slug,
        nameAr: category.nameAr,
        nameEn: category.nameEn,
        blurbAr: category.blurbAr,
        blurbEn: category.blurbEn,
        iconKey: category.iconKey,
        hotspotKey: category.hotspotKey,
        sort: index,
      })
      .returning({ id: schema.serviceCategories.id });

    assert(inserted, `category ${category.slug} was not inserted`);

    for (const [serviceIndex, service] of category.services.entries()) {
      assert(
        service.priceMode === 'quote' ? service.basePrice === null : service.basePrice !== null,
        `${service.slug}: quote-only services must have no basePrice, priced ones must have one`,
      );

      const [insertedService] = await db
        .insert(schema.services)
        .values({
          categoryId: inserted.id,
          slug: service.slug,
          nameAr: service.nameAr,
          nameEn: service.nameEn,
          summaryAr: service.summaryAr,
          summaryEn: service.summaryEn,
          priceMode: service.priceMode,
          basePrice: service.basePrice === null ? null : service.basePrice.toFixed(2),
          durationMin: service.durationMin,
          deliveryModes: service.deliveryModes,
          isPopular: service.isPopular ?? false,
          sort: serviceIndex,
        })
        .returning({ id: schema.services.id });

      assert(insertedService, `service ${service.slug} was not inserted`);
      serviceIdBySlug.set(service.slug, insertedService.id);
      serviceBySlug.set(service.slug, service);

      if (service.maintenance) {
        await db.insert(schema.maintenanceRules).values({
          serviceId: insertedService.id,
          intervalKm: service.maintenance.intervalKm,
          intervalMonths: service.maintenance.intervalMonths,
          noteAr: service.maintenance.noteAr ?? null,
          noteEn: service.maintenance.noteEn ?? null,
        });
      }
    }
  }

  // --------------------------------------------------------------- symptoms

  for (const [index, symptom] of symptoms.entries()) {
    const [insertedSymptom] = await db
      .insert(schema.symptoms)
      .values({
        slug: symptom.slug,
        labelAr: symptom.labelAr,
        labelEn: symptom.labelEn,
        questionAr: symptom.questionAr,
        questionEn: symptom.questionEn,
        iconKey: symptom.iconKey,
        urgency: symptom.urgency,
        sort: index,
      })
      .returning({ id: schema.symptoms.id });

    assert(insertedSymptom, `symptom ${symptom.slug} was not inserted`);

    const optionKeys = new Set(symptom.options.map((o) => o.key));

    await db.insert(schema.symptomOptions).values(
      symptom.options.map((option, optionIndex) => ({
        symptomId: insertedSymptom.id,
        optionKey: option.key,
        labelAr: option.labelAr,
        labelEn: option.labelEn,
        verdictAr: option.verdictAr,
        verdictEn: option.verdictEn,
        sort: optionIndex,
      })),
    );

    // The primary key is (symptom, service), so a service recommended under two
    // different options collapses to one row: keep the better-ranked one and
    // drop its option gate, since it is recommended either way.
    const byService = new Map<string, { option: string | null; rank: number }>();
    for (const link of symptom.services) {
      assert(
        serviceIdBySlug.has(link.slug),
        `symptom ${symptom.slug} references unknown service "${link.slug}"`,
      );
      assert(
        link.option === null || optionKeys.has(link.option),
        `symptom ${symptom.slug} references unknown option "${link.option}"`,
      );
      const existing = byService.get(link.slug);
      if (!existing) {
        byService.set(link.slug, { option: link.option, rank: link.rank });
      } else {
        byService.set(link.slug, {
          option: existing.option === link.option ? existing.option : null,
          rank: Math.min(existing.rank, link.rank),
        });
      }
    }

    await db.insert(schema.symptomServices).values(
      [...byService.entries()].map(([slug, link]) => ({
        symptomId: insertedSymptom.id,
        serviceId: serviceIdBySlug.get(slug)!,
        optionKey: link.option,
        rank: link.rank,
      })),
    );
  }

  // --------------------------------------------------------------- vehicles

  for (const [index, make] of makes.entries()) {
    const [insertedMake] = await db
      .insert(schema.vehicleMakes)
      .values({ slug: make.slug, nameAr: make.nameAr, nameEn: make.nameEn, sort: index })
      .returning({ id: schema.vehicleMakes.id });

    assert(insertedMake, `make ${make.slug} was not inserted`);

    await db.insert(schema.vehicleModels).values(
      make.models.map((model) => ({
        makeId: insertedMake.id,
        slug: model.slug,
        nameAr: model.nameAr,
        nameEn: model.nameEn,
        yearFrom: model.yearFrom,
        yearTo: model.yearTo ?? null,
      })),
    );
  }

  // -------------------------------------------------------------- providers

  const providerIdBySlug = new Map<string, number>();
  /** provider slug -> service slug -> price/duration actually offered. */
  const offerings = new Map<string, Map<string, { price: string | null; durationMin: number }>>();

  for (const provider of providerData) {
    const ratingCount = provider.reviews.length;
    const ratingAvg =
      ratingCount === 0
        ? 0
        : provider.reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount;

    const [insertedProvider] = await db
      .insert(schema.providers)
      .values({
        slug: provider.slug,
        nameAr: provider.nameAr,
        nameEn: provider.nameEn,
        aboutAr: provider.aboutAr,
        aboutEn: provider.aboutEn,
        logoKey: provider.logoKey,
        coverHue: provider.coverHue,
        zoneAr: provider.zoneAr,
        zoneEn: provider.zoneEn,
        zoneNumber: provider.zoneNumber,
        streetAr: provider.streetAr,
        streetEn: provider.streetEn,
        lat: provider.lat.toFixed(6),
        lng: provider.lng.toFixed(6),
        phone: provider.phone,
        isVerified: provider.isVerified,
        deliveryModes: provider.deliveryModes,
        ratingAvg: ratingAvg.toFixed(2),
        ratingCount,
        bayCount: provider.bayCount,
      })
      .returning({ id: schema.providers.id });

    assert(insertedProvider, `provider ${provider.slug} was not inserted`);
    providerIdBySlug.set(provider.slug, insertedProvider.id);

    await db.insert(schema.providerHours).values(
      provider.hours.map((h) => ({
        providerId: insertedProvider.id,
        weekday: h.weekday,
        opensAt: h.opensAt ?? null,
        closesAt: h.closesAt ?? null,
        breakStart: h.breakStart ?? null,
        breakEnd: h.breakEnd ?? null,
        isClosed: h.isClosed ?? false,
      })),
    );

    const providerOfferings = new Map<string, { price: string | null; durationMin: number }>();

    for (const serviceSlug of provider.services) {
      const service = serviceBySlug.get(serviceSlug);
      assert(service, `provider ${provider.slug} offers unknown service "${serviceSlug}"`);
      const serviceId = serviceIdBySlug.get(serviceSlug)!;

      const price =
        service.basePrice === null ? null : shiftPrice(service.basePrice, provider.priceFactor);
      // Bigger workshops with more bays turn jobs around slightly faster.
      const durationMin =
        provider.bayCount >= 4
          ? Math.max(15, Math.round((service.durationMin * 0.9) / 5) * 5)
          : service.durationMin;

      await db.insert(schema.providerServices).values({
        providerId: insertedProvider.id,
        serviceId,
        price,
        durationMin,
      });
      providerOfferings.set(serviceSlug, { price, durationMin });
    }

    offerings.set(provider.slug, providerOfferings);

    await db.insert(schema.reviews).values(
      provider.reviews.map((review) => ({
        providerId: insertedProvider.id,
        rating: review.rating,
        authorName: review.author,
        bodyAr: review.bodyAr,
        bodyEn: review.bodyEn,
        createdAt: subDays(now, review.daysAgo),
      })),
    );
  }

  for (const override of hourOverrides) {
    const providerId = providerIdBySlug.get(override.providerSlug);
    assert(providerId, `override references unknown provider "${override.providerSlug}"`);
    await db.insert(schema.providerHourOverrides).values({
      providerId,
      day: formatInTimeZone(addDays(now, override.offsetDays), TZ, 'yyyy-MM-dd'),
      opensAt: override.opensAt ?? null,
      closesAt: override.closesAt ?? null,
      isClosed: override.isClosed ?? false,
      reasonAr: override.reasonAr,
      reasonEn: override.reasonEn,
    });
  }

  // ---------------------------------------------------------------- banners

  await db.insert(schema.banners).values(
    bannerData.map((banner, index) => ({
      slug: banner.slug,
      titleAr: banner.titleAr,
      titleEn: banner.titleEn,
      subtitleAr: banner.subtitleAr,
      subtitleEn: banner.subtitleEn,
      ctaAr: banner.ctaAr,
      ctaEn: banner.ctaEn,
      href: banner.href,
      artKey: banner.artKey,
      hue: banner.hue,
      sort: index,
      isActive: true,
    })),
  );

  // --------------------------------------------------------------- bookings
  //
  // Nothing in the public UI can advance a booking's status, so the seed is the
  // only place the timeline component is ever seen in its later states. Every
  // status therefore appears at least once, with a plausible scheduled_at
  // relative to it: completed ones in the past, requested ones ahead.

  const demoBookings: {
    providerSlug: string;
    services: string[];
    contactName: string;
    phone: string;
    vehicleLabel: string;
    mode: 'at_center' | 'mobile' | 'pickup';
    /** Negative = in the past. */
    offsetDays: number;
    atHour: number;
    status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'canceled';
    notes?: string;
  }[] = [
    {
      providerSlug: 'doha-auto-center',
      services: ['oil-change', 'air-filter'],
      contactName: 'عبدالله المري',
      phone: '+97455512480',
      vehicleLabel: 'تويوتا لاند كروزر 2019',
      mode: 'at_center',
      offsetDays: -14,
      atHour: 9,
      status: 'completed',
    },
    {
      providerSlug: 'gulf-tyre-lube',
      services: ['wheel-alignment', 'wheel-balancing'],
      contactName: 'Rajesh Kumar',
      phone: '+97466638104',
      vehicleLabel: 'Nissan Altima 2021',
      mode: 'at_center',
      offsetDays: -9,
      atHour: 17,
      status: 'completed',
      notes: 'السيارة تسحب لليمين على طريق سلوى.',
    },
    {
      providerSlug: 'pearl-car-care',
      services: ['full-detailing', 'ozone-treatment'],
      contactName: 'مريم الأنصاري',
      phone: '+97433397512',
      vehicleLabel: 'لكزس آر إكس 2022',
      mode: 'pickup',
      offsetDays: -5,
      atHour: 10,
      status: 'completed',
    },
    {
      providerSlug: 'al-nukhba-workshop',
      services: ['oil-leak-repair', 'obd-scan'],
      contactName: 'خالد السليطي',
      phone: '+97455073366',
      vehicleLabel: 'نيسان باترول 2016',
      mode: 'at_center',
      offsetDays: -2,
      atHour: 8,
      status: 'canceled',
      notes: 'تم التأجيل بسبب سفر.',
    },
    {
      providerSlug: 'al-rayyan-auto-ac',
      services: ['ac-leak-test', 'ac-regas'],
      contactName: 'سعد الرميحي',
      phone: '+97444419920',
      vehicleLabel: 'ميتسوبيشي باجيرو 2018',
      mode: 'at_center',
      offsetDays: 0,
      atHour: 11,
      status: 'in_progress',
      notes: 'المكيّف لا يبرّد إطلاقًا منذ أسبوع.',
    },
    {
      providerSlug: 'al-badr-auto-electrical',
      services: ['battery-replacement', 'alternator-starter'],
      contactName: 'Zainab Malik',
      phone: '+97477714058',
      vehicleLabel: 'Hyundai Tucson 2020',
      mode: 'mobile',
      offsetDays: 0,
      atHour: 16,
      status: 'in_progress',
    },
    {
      providerSlug: 'umm-salal-inspection',
      services: ['inspection-prep', 'brake-fluid'],
      contactName: 'صقر المريخي',
      phone: '+97455628841',
      vehicleLabel: 'جي إم سي يوكن 2017',
      mode: 'at_center',
      offsetDays: 1,
      atHour: 9,
      status: 'confirmed',
    },
    {
      providerSlug: 'sayarati-mobile',
      services: ['oil-change', 'cabin-filter'],
      contactName: 'لطيفة الخاطر',
      phone: '+97466690273',
      vehicleLabel: 'كيا سبورتاج 2021',
      mode: 'mobile',
      offsetDays: 2,
      atHour: 13,
      status: 'confirmed',
      notes: 'الموقع: برج في الخليج الغربي، موقف B2.',
    },
    {
      providerSlug: 'al-khor-4x4',
      services: ['shock-absorbers', 'wheel-alignment'],
      contactName: 'حمد المهاشير',
      phone: '+97455180934',
      vehicleLabel: 'تويوتا لاند كروزر 2014',
      mode: 'at_center',
      offsetDays: 3,
      atHour: 8,
      status: 'requested',
      notes: 'تجهيز للبر قبل نهاية الشهر.',
    },
    {
      providerSlug: 'al-wakrah-body-paint',
      services: ['dent-removal', 'scratch-removal'],
      contactName: 'أحمد العبيدلي',
      phone: '+97433041667',
      vehicleLabel: 'مرسيدس الفئة E 2020',
      mode: 'pickup',
      offsetDays: 4,
      atHour: 10,
      status: 'requested',
    },
    {
      providerSlug: 'al-fahad-quick-service',
      services: ['oil-change'],
      contactName: 'Joseph Fernandes',
      phone: '+97470025519',
      vehicleLabel: 'Honda Civic 2019',
      mode: 'at_center',
      offsetDays: 5,
      atHour: 19,
      status: 'requested',
    },
    {
      providerSlug: 'al-amana-engine',
      services: ['water-pump', 'serpentine-belt'],
      contactName: 'عبدالعزيز الكعبي',
      phone: '+97455439028',
      vehicleLabel: 'فورد إكسبلورر 2015',
      mode: 'pickup',
      offsetDays: 6,
      atHour: 8,
      status: 'requested',
      notes: 'رائحة احتراق وحرارة مرتفعة في الزحام.',
    },
  ];

  const usedCodes = new Set<string>();

  for (const demo of demoBookings) {
    const providerId = providerIdBySlug.get(demo.providerSlug);
    assert(providerId, `booking references unknown provider "${demo.providerSlug}"`);
    const providerOfferings = offerings.get(demo.providerSlug)!;

    const localDay = formatInTimeZone(addDays(now, demo.offsetDays), TZ, 'yyyy-MM-dd');
    const scheduledAt = fromZonedTime(
      `${localDay}T${String(demo.atHour).padStart(2, '0')}:00:00`,
      TZ,
    );

    const items = demo.services.map((slug) => {
      const service = serviceBySlug.get(slug);
      assert(service, `booking references unknown service "${slug}"`);
      const offering = providerOfferings.get(slug);
      assert(
        offering,
        `provider ${demo.providerSlug} does not offer "${slug}" — fix the seed, not the data`,
      );
      return { slug, service, offering };
    });

    const subtotal = items.reduce(
      (sum, item) => sum + (item.offering.price === null ? 0 : Number(item.offering.price)),
      0,
    );
    const durationMin = items.reduce((sum, item) => sum + item.offering.durationMin, 0);
    const calloutFee = demo.mode === 'at_center' ? 0 : demo.mode === 'mobile' ? 50 : 75;
    const hasQuoteItems = items.some((item) => item.offering.price === null);

    const code = await generateUniqueBookingCode((candidate) => usedCodes.has(candidate));
    usedCodes.add(code);

    const [insertedBooking] = await db
      .insert(schema.bookings)
      .values({
        code,
        contactName: demo.contactName,
        contactPhone: demo.phone,
        phoneLast4: demo.phone.slice(-4),
        vehicleLabel: demo.vehicleLabel,
        providerId,
        mode: demo.mode,
        scheduledAt,
        durationMin,
        status: demo.status,
        source: 'seed',
        subtotal: subtotal.toFixed(2),
        calloutFee: calloutFee.toFixed(2),
        total: (subtotal + calloutFee).toFixed(2),
        hasQuoteItems: hasQuoteItems ? 1 : 0,
        notes: demo.notes ?? null,
        // Bookings are requested before they happen, not on the day.
        createdAt: subDays(scheduledAt, demo.offsetDays >= 0 ? 2 : 3),
      })
      .returning({ id: schema.bookings.id });

    assert(insertedBooking, `booking ${code} was not inserted`);

    await db.insert(schema.bookingItems).values(
      items.map((item) => ({
        bookingId: insertedBooking.id,
        serviceId: serviceIdBySlug.get(item.slug)!,
        nameArSnapshot: item.service.nameAr,
        nameEnSnapshot: item.service.nameEn,
        priceSnapshot: item.offering.price,
        durationMinSnapshot: item.offering.durationMin,
      })),
    );
  }

  // A statuses-covered check, because "the timeline is visible in every state"
  // is a property of the seed and nothing else enforces it.
  const seededStatuses = new Set(demoBookings.map((b) => b.status));
  for (const status of ['requested', 'confirmed', 'in_progress', 'completed', 'canceled']) {
    assert(seededStatuses.has(status as never), `no seeded booking has status "${status}"`);
  }

  const serviceCount = serviceIdBySlug.size;
  const reviewCount = providerData.reduce((sum, p) => sum + p.reviews.length, 0);
  const modelCount = makes.reduce((sum, m) => sum + m.models.length, 0);

  console.log(
    [
      'seeded:',
      `  ${categories.length} categories, ${serviceCount} services`,
      `  ${symptoms.length} symptoms`,
      `  ${providerData.length} providers, ${reviewCount} reviews, ${hourOverrides.length} hour overrides`,
      `  ${makes.length} makes, ${modelCount} models`,
      `  ${bannerData.length} banners`,
      `  ${demoBookings.length} demo bookings across ${seededStatuses.size} statuses`,
      `  in ${Date.now() - startedAt}ms`,
    ].join('\n'),
  );
}

await main();
await client.end();
