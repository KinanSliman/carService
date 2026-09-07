/**
 * The promo rail. `artKey` names a committed SVG composition rather than an
 * uploaded image — there is no admin panel and no upload path in this build.
 */

export type SeedBanner = {
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  ctaAr: string;
  ctaEn: string;
  href: string;
  artKey: string;
  hue: number;
};

export const banners: SeedBanner[] = [
  {
    slug: 'summer-ac',
    titleAr: 'جهّز مكيّفك قبل الصيف',
    titleEn: 'Get your AC ready for summer',
    subtitleAr: 'كشف تسريب مجاني مع أي تعبئة غاز',
    subtitleEn: 'Free leak check with any regas',
    ctaAr: 'احجز الآن',
    ctaEn: 'Book now',
    href: '/services/ac-cooling',
    artKey: 'ac',
    hue: 190,
  },
  {
    slug: 'oil-bundle',
    titleAr: 'باقة الزيت والفلاتر',
    titleEn: 'Oil & filter bundle',
    subtitleAr: 'زيت وفلتر وفحص 20 نقطة من 120 ر.ق',
    subtitleEn: 'Oil, filter and a 20-point check from QAR 120',
    ctaAr: 'اعرف التفاصيل',
    ctaEn: 'See details',
    href: '/services/engine-oil/oil-change',
    artKey: 'oil',
    hue: 40,
  },
  {
    slug: 'mobile-service',
    titleAr: 'الورشة تجيك لين عندك',
    titleEn: 'The workshop comes to you',
    subtitleAr: 'زيت وبطاريات وبنشر في موقعك',
    subtitleEn: 'Oil, batteries and punctures at your location',
    ctaAr: 'جرّب الخدمة المتنقلة',
    ctaEn: 'Try mobile service',
    href: '/workshops?mode=mobile',
    artKey: 'mobile',
    hue: 152,
  },
  {
    slug: 'inspection-season',
    titleAr: 'موعد الاستمارة قرب؟',
    titleEn: 'Registration renewal coming up?',
    subtitleAr: 'تجهيز كامل للفحص الدوري في ساعة',
    subtitleEn: 'Full inspection prep in one hour',
    ctaAr: 'جهّز سيارتك',
    ctaEn: 'Prepare your car',
    href: '/services/diagnostics/inspection-prep',
    artKey: 'inspection',
    hue: 220,
  },
  {
    slug: 'detailing-offer',
    titleAr: 'تلميع وحماية سيراميك',
    titleEn: 'Polish & ceramic protection',
    subtitleAr: 'حماية تدوم ضد الشمس والغبار',
    subtitleEn: 'Protection that lasts against sun and dust',
    ctaAr: 'شوف الورش',
    ctaEn: 'See workshops',
    href: '/services/body-paint/ceramic-coating',
    artKey: 'shine',
    hue: 280,
  },
];
