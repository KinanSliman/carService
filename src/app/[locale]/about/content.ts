import type { Locale } from '@/i18n/routing';

/**
 * The case study's prose.
 *
 * Kept out of `messages/*.json` deliberately: those files are interface
 * strings, short and reused, and dropping several hundred words of long-form
 * copy into them makes the real UI catalog unreadable. This is content, and it
 * lives with the page that renders it.
 */

export type CaseStudySection = {
  heading: string;
  body: string[];
  /** Rendered as a "we did X instead of Y" comparison, when present. */
  comparison?: { generic: string; here: string };
  /** Rendered as a labelled list of decisions. */
  points?: { label: string; text: string }[];
};

export type CaseStudy = {
  title: string;
  intro: string;
  sections: CaseStudySection[];
  stackTitle: string;
  stack: { label: string; value: string }[];
  outOfScopeTitle: string;
  outOfScopeIntro: string;
  outOfScope: string[];
  demoTitle: string;
  demoIntro: string;
  demoCodeLabel: string;
  demoPhoneLabel: string;
  demoStatusLabel: string;
};

const en: CaseStudy = {
  title: 'About this project',
  intro:
    'Karaj is a portfolio build: a car servicing and maintenance marketplace for the Qatari market, Arabic-first and right-to-left by default. Every workshop, price and review on it is invented. What is real is the schema behind it, the migrations, and the scheduling logic.',
  sections: [
    {
      heading: 'The problem with the obvious design',
      body: [
        'Almost every service-booking site answers the same brief the same way: a gradient hero, a centred headline, and a three-by-three grid of icon tiles labelled with category names. It is fast to build and it tests badly, because it asks the visitor to already know what the part is called.',
        'Somebody whose car pulls to the right does not think "wheel alignment". They think about the thing the car is doing. So this build has two navigation models, both derived from the content rather than bolted on top of it.',
      ],
      comparison: {
        generic: 'A 3×3 grid of category tiles, all the same size, under the same grey shadow.',
        here: 'A diagram of a car you point at, and a rail of symptoms you recognise.',
      },
    },
    {
      heading: 'Two ways in',
      body: [
        'The first is spatial. The home page draws a car in line art with eight named zones, each mapped to a service category through a `hotspot_key` column. Tapping the front wheel opens brakes; tapping the bonnet opens oil and filters. Every zone is keyboard-operable with a visible focus ring, and the same categories appear as ordinary links underneath, which is both the touch fallback and the crawlable path.',
        'The second is symptomatic. Ten symptoms, each with one narrowing question, ending in a plain-language verdict and one to three recommended services. It stops after one question on purpose: the honest answer past that point is still "a technician has to look at it", so the flow ends where its confidence does.',
      ],
    },
    {
      heading: 'The part that is actually hard',
      body: [
        'Slot availability is the one piece of genuinely non-trivial server logic here, and it is the thing that separates a styled catalog from an application.',
        'Opening hours are stored as local wall-clock times plus a weekday, never as instants, and converted to UTC once at the boundary with date-fns-tz. A date-specific override table handles public holidays and Ramadan hours. A job has to finish before closing, so a three-hour service is never offered at 19:30 against a 20:00 close. A midday break splits the day into two windows rather than blocking the slots that straddle it. Capacity is per bay. And the slot is re-checked server-side at submit, because the picker was rendered from a snapshot and the last bay may have gone since.',
        'It is a pure module over plain inputs, which is why it has 24 tests and no database.',
      ],
    },
    {
      heading: 'Right-to-left, properly',
      body: [
        'Arabic is the default locale and it is not prefixed, so the canonical URL is `/` rather than `/ar`. Locale detection is off: an Arabic-first site that redirects an English browser to the English build means the design nobody sees is the one it was made for.',
        'Everything uses logical properties — inline-start and inline-end, never left and right — and an ESLint rule fails the build on the Tailwind utilities that silently break in RTL. The car faces the direction the language is read in.',
      ],
    },
    {
      heading: 'Decisions worth naming',
      body: [],
      points: [
        {
          label: 'No component library',
          text: 'The brief asked for something that does not look templated, and a reviewer recognises default shadcn instantly. The primitives here are about two hundred lines.',
        },
        {
          label: 'No carousel library',
          text: 'CSS scroll-snap handles the banner and the rails, is RTL-correct without configuration, and costs nothing.',
        },
        {
          label: 'Drizzle rather than Prisma',
          text: 'The availability and next-due queries are SQL-shaped. Drizzle shows the SQL thinking instead of hiding it.',
        },
        {
          label: 'No PostGIS',
          text: 'With no coverage polygons to model, plain lat/lng with Haversine ordering is enough — decided early so it never became a migration.',
        },
        {
          label: 'Prices come from provider_services',
          text: 'A "from 120 QAR" that no workshop actually charges is a lie. The figure is the cheapest price a real row carries.',
        },
        {
          label: 'The seed is a design deliverable',
          text: 'Real Qatari makes and models, Doha zone numbers, plausible workshop names and hours, and deliberately long Arabic names — because a layout tested on "Service 1" lies to you about truncation.',
        },
      ],
    },
    {
      heading: 'The honest limitations',
      body: [
        'There is no authentication, so bookings are write-only from the public side and nothing can advance one. The status timeline would therefore only ever be seen in its first state — so the seed contains bookings in every status, which is what makes the rest of that component reachable at all.',
        'Rate limiting is an in-memory fixed window keyed by IP. On a multi-instance deployment each instance enforces its own limit, and a cold start resets it. For a demo whose write path creates rows nobody reads, that is the right amount of machinery; a real product would put it in Redis.',
        'The garage lives in localStorage and does not survive a change of browser. The interface says so rather than pretending otherwise.',
      ],
    },
  ],
  stackTitle: 'Stack',
  stack: [
    { label: 'Framework', value: 'Next.js 15, App Router, React Server Components' },
    { label: 'Language', value: 'TypeScript, strict' },
    { label: 'Database', value: 'PostgreSQL 16, Drizzle ORM, migrations in git' },
    { label: 'Styling', value: 'Tailwind CSS v4 with CSS-variable tokens' },
    { label: 'i18n', value: 'next-intl, Arabic default and unprefixed' },
    { label: 'Validation', value: 'Zod, shared between form and Server Action' },
    { label: 'Tests', value: 'Vitest on availability and maintenance' },
  ],
  outOfScopeTitle: 'Intentionally out of scope',
  outOfScopeIntro:
    'These were cut on purpose, not left unfinished. Each one costs a week and produces nothing a reviewer can see.',
  outOfScope: [
    'Authentication — no users table, no sessions, no roles. Half-built auth invites you to test it and find the gaps.',
    'Payments — prices are shown, nothing is charged, and there is no payment abstraction either. An interface with one stub implementation is dead code.',
    'Admin panel — all content comes from the seed. Content management is invisible work.',
    'Provider dashboard, auctions, parts marketplace, notifications, chat, live tracking.',
  ],
  demoTitle: 'Try the booking lookup',
  demoIntro:
    'These are seeded bookings, listed so you can exercise the tracking flow without creating one. Enter the code and the last four digits together.',
  demoCodeLabel: 'Code',
  demoPhoneLabel: 'Last 4 digits',
  demoStatusLabel: 'Status',
};

const ar: CaseStudy = {
  title: 'عن المشروع',
  intro:
    'كراج مشروع تجريبي لعرض المهارات: منصة لصيانة السيارات في السوق القطري، عربية أولًا ومن اليمين إلى اليسار افتراضيًا. كل ورشة وسعر وتقييم على الموقع بيانات تجريبية. ما هو حقيقي فيه: قاعدة البيانات خلفه، وملفات الترحيل، ومنطق حساب المواعيد.',
  sections: [
    {
      heading: 'المشكلة في التصميم البديهي',
      body: [
        'أغلب مواقع حجز الخدمات تجيب على نفس المتطلبات بنفس الطريقة: واجهة بتدرّج لوني، وعنوان في المنتصف، وشبكة أيقونات ثلاثية بأسماء الأقسام. سريعة التنفيذ وضعيفة عمليًا، لأنها تفترض أن الزائر يعرف اسم القطعة أصلًا.',
        'من تسحب سيارته لليمين لا يفكر في «ضبط زوايا العجلات». يفكر في ما تفعله السيارة. لذلك في هذا المشروع طريقتان للتصفح، كلتاهما مشتقّة من المحتوى نفسه لا مضافة فوقه.',
      ],
      comparison: {
        generic: 'شبكة 3×3 من الأقسام، كلها بنفس الحجم وتحت نفس الظل الرمادي.',
        here: 'رسم لسيارة تضغط على الجزء الذي يهمّك، وشريط أعراض تتعرّف عليها.',
      },
    },
    {
      heading: 'مدخلان اثنان',
      body: [
        'الأول مكاني. الصفحة الرئيسية ترسم سيارة بخطوط بسيطة عليها ثماني مناطق مسمّاة، كل واحدة مرتبطة بقسم خدمات عبر عمود `hotspot_key`. الضغط على العجلة الأمامية يفتح الفرامل، والضغط على غطاء المحرك يفتح الزيت والمرشحات. كل منطقة قابلة للتشغيل بلوحة المفاتيح مع إطار تركيز واضح، ونفس الأقسام تظهر كروابط عادية أسفل الرسم — وهي البديل للمس ومسار الأرشفة في آن واحد.',
        'الثاني يبدأ من العَرَض. عشرة أعراض، لكل واحد سؤال واحد يضيّق الاحتمالات، وينتهي بحكم مكتوب بلغة واضحة ومن خدمة إلى ثلاث خدمات موصى بها. يتوقف بعد سؤال واحد عن قصد: الإجابة الصادقة بعد ذلك تبقى «الفحص في الورشة هو ما يحدد العطل»، فالمسار ينتهي عند حدود ثقته.',
      ],
    },
    {
      heading: 'الجزء الصعب فعلًا',
      body: [
        'توليد المواعيد المتاحة هو المنطق الخادمي غير البديهي الوحيد هنا، وهو ما يفرّق بين «كتالوج منسّق» و«تطبيق».',
        'أوقات العمل مخزّنة كوقت محلي مع يوم الأسبوع، لا كلحظات زمنية، وتُحوَّل إلى UTC مرة واحدة عند الحدود باستخدام date-fns-tz. جدول استثناءات بالتواريخ يغطي الإجازات الرسمية ودوام رمضان. العمل يجب أن ينتهي قبل الإغلاق، فلا يُعرض موعد الساعة 7:30 مساءً لخدمة تستغرق ثلاث ساعات أمام إغلاق الساعة الثامنة. واستراحة الظهيرة تقسم اليوم إلى نافذتين بدل أن تحجب المواعيد المتداخلة معها. والسعة محسوبة لكل موقف عمل. ثم يُعاد التحقق من الموعد على الخادم عند التأكيد، لأن قائمة المواعيد رُسمت من لقطة سابقة وربما حُجز آخر موقف بعدها.',
        'إنه وحدة برمجية خالصة تعمل على مدخلات بسيطة، ولذلك يغطيها 24 اختبارًا بلا قاعدة بيانات.',
      ],
    },
    {
      heading: 'من اليمين إلى اليسار، بشكل صحيح',
      body: [
        'العربية هي اللغة الافتراضية وبدون بادئة في الرابط، فالعنوان الأساسي هو `/` وليس `/ar`. وكشف اللغة من المتصفح معطّل عمدًا: موقع عربي أولًا يحوّل المتصفح الإنجليزي إلى النسخة الإنجليزية يعني أن التصميم الذي بُني له لا يراه أحد.',
        'كل التنسيقات تستخدم الخصائص المنطقية — بداية ونهاية السطر، لا يمين ويسار — وقاعدة ESLint تُفشل البناء عند استخدام أدوات Tailwind التي تنكسر بصمت في الاتجاه العربي. والسيارة في الرسم تتجه في اتجاه القراءة.',
      ],
    },
    {
      heading: 'قرارات تستحق الذكر',
      body: [],
      points: [
        {
          label: 'بدون مكتبة مكوّنات جاهزة',
          text: 'المطلوب شيء لا يبدو قالبًا جاهزًا، والمراجع يتعرّف على تنسيق shadcn الافتراضي فورًا. المكوّنات الأساسية هنا نحو مئتي سطر.',
        },
        {
          label: 'بدون مكتبة سلايدر',
          text: 'خاصية scroll-snap في CSS تكفي للشريط الإعلاني والقوائم الأفقية، وتعمل بشكل صحيح في الاتجاه العربي بلا إعدادات، وبتكلفة صفر.',
        },
        {
          label: 'Drizzle بدل Prisma',
          text: 'استعلامات المواعيد والصيانة القادمة قريبة من SQL، وDrizzle يُظهر هذا التفكير بدل إخفائه.',
        },
        {
          label: 'بدون PostGIS',
          text: 'لا توجد مناطق تغطية حقيقية لنمذجتها، فحساب المسافة بـ Haversine على إحداثيات عادية يكفي — قرار اتُخذ مبكرًا حتى لا يتحول لاحقًا إلى ملف ترحيل.',
        },
        {
          label: 'الأسعار من جدول provider_services',
          text: '«من 120 ر.ق» لا تقولها أي ورشة فعليًا هي كذبة. الرقم المعروض هو أرخص سعر في صف حقيقي.',
        },
        {
          label: 'البيانات التجريبية جزء من التصميم',
          text: 'شركات وموديلات قطرية حقيقية، وأرقام مناطق الدوحة، وأسماء وأوقات عمل معقولة، وأسماء عربية طويلة عن قصد — لأن تصميمًا مُختبرًا على «خدمة 1» يكذب عليك بشأن قصّ النصوص.',
        },
      ],
    },
    {
      heading: 'حدود المشروع بصراحة',
      body: [
        'لا يوجد تسجيل دخول، لذلك الحجوزات تُكتب فقط من جهة الزائر ولا يمكن تغيير حالتها. هذا يعني أن مؤشر الحالة لن يُرى إلا في مرحلته الأولى — لذلك تحتوي البيانات التجريبية على حجوزات في كل الحالات، وهو ما يجعل بقية المكوّن قابلًا للرؤية أصلًا.',
        'تحديد معدّل الطلبات يعتمد على عدّاد في ذاكرة العملية مرتبط بعنوان IP. على نشر متعدد النسخ تطبّق كل نسخة حدّها الخاص، وأي إعادة تشغيل تصفّره. لمشروع تجريبي مسار الكتابة فيه ينشئ صفوفًا لا يقرأها أحد، هذا هو القدر المناسب؛ منتج حقيقي كان سيضعه في Redis.',
        'الكراج التجريبي محفوظ في متصفحك ولا ينتقل معك إلى جهاز آخر. والواجهة تقول ذلك بدل أن توهمك بغيره.',
      ],
    },
  ],
  stackTitle: 'التقنيات',
  stack: [
    { label: 'إطار العمل', value: 'Next.js 15، App Router، مكوّنات خادمية' },
    { label: 'اللغة', value: 'TypeScript بوضع strict' },
    { label: 'قاعدة البيانات', value: 'PostgreSQL 16، Drizzle ORM، ملفات ترحيل في git' },
    { label: 'التنسيق', value: 'Tailwind CSS v4 مع متغيّرات CSS' },
    { label: 'تعدد اللغات', value: 'next-intl، العربية افتراضية وبدون بادئة' },
    { label: 'التحقق', value: 'Zod، مشترك بين النموذج وإجراء الخادم' },
    { label: 'الاختبارات', value: 'Vitest على منطق المواعيد والصيانة' },
  ],
  outOfScopeTitle: 'خارج النطاق عن قصد',
  outOfScopeIntro:
    'هذه أمور استُبعدت عمدًا، لا أمور لم تُنجَز. كل واحدة منها تكلّف أسبوعًا ولا تُنتج شيئًا يراه المراجع.',
  outOfScope: [
    'تسجيل الدخول — لا جدول مستخدمين ولا جلسات ولا صلاحيات. نظام دخول نصف مكتمل يدعوك لاختباره واكتشاف ثغراته.',
    'الدفع — الأسعار معروضة ولا يُخصم شيء، ولا توجد حتى طبقة تجريد للدفع. واجهة بتطبيق وهمي واحد هي شيفرة ميتة.',
    'لوحة تحكم — كل المحتوى من البيانات التجريبية. إدارة المحتوى عمل غير مرئي.',
    'لوحة الورشة، المزادات، سوق قطع الغيار، الإشعارات، المحادثة، التتبع المباشر.',
  ],
  demoTitle: 'جرّب تتبّع الحجز',
  demoIntro:
    'هذه حجوزات تجريبية، معروضة هنا حتى تجرّب مسار التتبّع دون إنشاء حجز. أدخل الرمز وآخر أربعة أرقام معًا.',
  demoCodeLabel: 'الرمز',
  demoPhoneLabel: 'آخر 4 أرقام',
  demoStatusLabel: 'الحالة',
};

export function getCaseStudy(locale: Locale): CaseStudy {
  return locale === 'ar' ? ar : en;
}
