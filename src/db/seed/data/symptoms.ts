/**
 * Symptom-first navigation. Each symptom asks one narrowing question; the
 * answer selects which services are recommended.
 *
 * `services` entries with `option: null` are recommended whatever the answer —
 * they are the safe baseline. Everything else is gated on one option key.
 *
 * Service slugs are resolved against the catalog by the seed, which throws on
 * a typo rather than silently seeding a symptom that recommends nothing.
 */

export type SeedSymptom = {
  slug: string;
  labelAr: string;
  labelEn: string;
  questionAr: string;
  questionEn: string;
  iconKey: string;
  /** 1 = can wait · 2 = book soon · 3 = do not drive on it. */
  urgency: 1 | 2 | 3;
  options: {
    key: string;
    labelAr: string;
    labelEn: string;
    verdictAr: string;
    verdictEn: string;
  }[];
  services: { slug: string; option: string | null; rank: number }[];
};

export const symptoms: SeedSymptom[] = [
  {
    slug: 'pulls-to-one-side',
    labelAr: 'السيارة تسحب لجهة واحدة',
    labelEn: 'The car pulls to one side',
    questionAr: 'متى تلاحظ السحب؟',
    questionEn: 'When do you notice the pull?',
    iconKey: 'steering',
    urgency: 2,
    options: [
      {
        key: 'braking',
        labelAr: 'عند الفرملة فقط',
        labelEn: 'Only when braking',
        verdictAr: 'السحب عند الفرملة تحديدًا يشير إلى كاليبر أو قماشة فرامل على جهة واحدة، وليس إلى الترصيص.',
        verdictEn: 'A pull that appears only under braking points at one caliper or pad, not at alignment.',
      },
      {
        key: 'always',
        labelAr: 'طوال الوقت',
        labelEn: 'All the time',
        verdictAr: 'السحب المستمر على طريق مستوٍ سببه غالبًا زوايا العجلات أو ضغط الإطارات.',
        verdictEn: 'A constant pull on a level road is usually alignment or tyre pressure.',
      },
      {
        key: 'after-bump',
        labelAr: 'بدأ بعد اصطدام برصيف أو مطب',
        labelEn: 'It started after hitting a kerb or bump',
        verdictAr: 'الاصطدام يغيّر زوايا العجلات وقد يثني الجنط — يحتاج فحصًا للاثنين معًا.',
        verdictEn: 'An impact shifts the geometry and can bend a rim — both need checking together.',
      },
    ],
    services: [
      { slug: 'wheel-alignment', option: null, rank: 1 },
      { slug: 'front-brake-pads', option: 'braking', rank: 1 },
      { slug: 'brake-discs', option: 'braking', rank: 2 },
      { slug: 'tyre-fitting', option: 'always', rank: 2 },
      { slug: 'wheel-balancing', option: 'after-bump', rank: 2 },
      { slug: 'shock-absorbers', option: 'after-bump', rank: 3 },
    ],
  },
  {
    slug: 'brake-squeal',
    labelAr: 'صرير عند الفرملة',
    labelEn: 'Squealing when braking',
    questionAr: 'كيف تصف الصوت؟',
    questionEn: 'How would you describe the noise?',
    iconKey: 'brake-disc',
    urgency: 3,
    options: [
      {
        key: 'squeal',
        labelAr: 'صفير حاد',
        labelEn: 'A high-pitched squeal',
        verdictAr: 'الصفير هو مؤشر التآكل المقصود في القماشة — التغيير مطلوب قريبًا وليس فورًا.',
        verdictEn: 'That squeal is the wear indicator doing its job — replacement is due soon, not instantly.',
      },
      {
        key: 'grinding',
        labelAr: 'صوت احتكاك معدني',
        labelEn: 'A metal grinding sound',
        verdictAr: 'الاحتكاك المعدني يعني أن القماشة انتهت وأن الديسك يتضرر الآن. أوقف القيادة.',
        verdictEn: 'Metal grinding means the pad is gone and the disc is being damaged now. Stop driving on it.',
      },
    ],
    services: [
      { slug: 'front-brake-pads', option: null, rank: 1 },
      { slug: 'brake-discs', option: 'grinding', rank: 1 },
      { slug: 'brake-fluid', option: 'squeal', rank: 3 },
    ],
  },
  {
    slug: 'ac-not-cold',
    labelAr: 'المكيّف لا يبرّد',
    labelEn: 'The AC is not cold',
    questionAr: 'هل يبرّد أحيانًا؟',
    questionEn: 'Does it cool sometimes?',
    iconKey: 'snowflake',
    urgency: 2,
    options: [
      {
        key: 'never',
        labelAr: 'لا يبرّد إطلاقًا',
        labelEn: 'Never cools at all',
        verdictAr: 'الفقدان الكامل للتبريد يعني عادة تسريبًا كاملًا للغاز أو عطلًا في الكمبروسر.',
        verdictEn: 'A total loss of cooling usually means the gas has all leaked out, or the compressor has failed.',
      },
      {
        key: 'weak-idle',
        labelAr: 'يضعف عند الوقوف ويتحسن عند السير',
        labelEn: 'Weak when stopped, better when moving',
        verdictAr: 'هذا نمط تبريد ضعيف: مروحة أو ردييتر أو ضغط غاز منخفض.',
        verdictEn: 'That is a cooling-side pattern: the fan, the radiator, or a low charge.',
      },
      {
        key: 'smell',
        labelAr: 'يبرّد لكن الهواء ضعيف أو رائحته سيئة',
        labelEn: 'Cools, but airflow is weak or smells bad',
        verdictAr: 'التبريد سليم — المشكلة في مجرى الهواء والفلتر، وهي أرخص بكثير.',
        verdictEn: 'The cooling is fine — this is the airflow path and the filter, which is far cheaper.',
      },
    ],
    services: [
      { slug: 'ac-leak-test', option: 'never', rank: 1 },
      { slug: 'ac-regas', option: 'never', rank: 2 },
      { slug: 'radiator-replacement', option: 'weak-idle', rank: 2 },
      { slug: 'cabin-filter', option: 'smell', rank: 1 },
      { slug: 'ac-sanitize', option: 'smell', rank: 2 },
    ],
  },
  {
    slug: 'wont-start',
    labelAr: 'السيارة لا تشتغل',
    labelEn: 'The car will not start',
    questionAr: 'ماذا يحدث عند إدارة المفتاح؟',
    questionEn: 'What happens when you turn the key?',
    iconKey: 'battery',
    urgency: 3,
    options: [
      {
        key: 'silent',
        labelAr: 'لا شيء، ولا تضيء اللمبات',
        labelEn: 'Nothing at all, no dash lights',
        verdictAr: 'انقطاع كامل للتيار — بطارية فارغة تمامًا أو طرف مفكوك.',
        verdictEn: 'A total loss of power — a fully flat battery or a disconnected terminal.',
      },
      {
        key: 'clicking',
        labelAr: 'صوت طقطقة سريعة',
        labelEn: 'Rapid clicking',
        verdictAr: 'الطقطقة تعني وجود تيار لكنه غير كافٍ لتدوير السلف. البطارية هي المرشح الأول.',
        verdictEn: 'Clicking means there is current but not enough to turn the starter. The battery is first suspect.',
      },
      {
        key: 'cranks',
        labelAr: 'تدور لكن لا تشتغل',
        labelEn: 'It cranks but does not fire',
        verdictAr: 'الكهرباء سليمة — المشكلة في الشرارة أو الوقود، ويحتاج تشخيصًا لا استبدالًا.',
        verdictEn: 'Electrics are fine — this is spark or fuel, and it needs diagnosis rather than a part.',
      },
    ],
    services: [
      { slug: 'battery-replacement', option: 'silent', rank: 1 },
      { slug: 'battery-replacement', option: 'clicking', rank: 1 },
      { slug: 'alternator-starter', option: null, rank: 2 },
      { slug: 'spark-plugs', option: 'cranks', rank: 2 },
      { slug: 'obd-scan', option: 'cranks', rank: 1 },
    ],
  },
  {
    slug: 'check-engine-light',
    labelAr: 'لمبة المحرك مضيئة',
    labelEn: 'The check engine light is on',
    questionAr: 'كيف تتصرف اللمبة؟',
    questionEn: 'How is the light behaving?',
    iconKey: 'scan',
    urgency: 2,
    options: [
      {
        key: 'steady',
        labelAr: 'مضيئة بثبات والسيارة طبيعية',
        labelEn: 'Steady, and the car drives normally',
        verdictAr: 'لمبة ثابتة مع أداء طبيعي: القيادة ممكنة، لكن اقرأ الكود قبل موعد الفحص الدوري.',
        verdictEn: 'A steady light with normal performance: driveable, but read the code before your annual test.',
      },
      {
        key: 'flashing',
        labelAr: 'تومض',
        labelEn: 'Flashing',
        verdictAr: 'الوميض يعني احتراقًا غير مكتمل قد يتلف المحول الحفاز. لا تكمل القيادة.',
        verdictEn: 'A flashing light means a misfire that can destroy the catalytic converter. Do not keep driving.',
      },
      {
        key: 'with-symptoms',
        labelAr: 'مضيئة مع تقطيع أو ضعف',
        labelEn: 'On, with hesitation or loss of power',
        verdictAr: 'وجود عرض ملموس مع اللمبة يختصر التشخيص كثيرًا.',
        verdictEn: 'A physical symptom alongside the light narrows the diagnosis considerably.',
      },
    ],
    services: [
      { slug: 'obd-scan', option: null, rank: 1 },
      { slug: 'check-engine-diagnosis', option: 'flashing', rank: 1 },
      { slug: 'spark-plugs', option: 'with-symptoms', rank: 2 },
      { slug: 'check-engine-diagnosis', option: 'with-symptoms', rank: 1 },
    ],
  },
  {
    slug: 'steering-vibration',
    labelAr: 'اهتزاز في المقود',
    labelEn: 'Vibration in the steering wheel',
    questionAr: 'متى يظهر الاهتزاز؟',
    questionEn: 'When does the vibration appear?',
    iconKey: 'steering',
    urgency: 2,
    options: [
      {
        key: 'high-speed',
        labelAr: 'عند السرعات العالية فقط',
        labelEn: 'Only at higher speeds',
        verdictAr: 'الاهتزاز المرتبط بالسرعة هو توازن إطارات في الأغلب.',
        verdictEn: 'Speed-linked vibration is tyre balance in most cases.',
      },
      {
        key: 'braking',
        labelAr: 'عند الفرملة',
        labelEn: 'When braking',
        verdictAr: 'الاهتزاز أثناء الفرملة يعني ديسكات غير مستوية.',
        verdictEn: 'Vibration under braking means the discs are no longer flat.',
      },
    ],
    services: [
      { slug: 'wheel-balancing', option: 'high-speed', rank: 1 },
      { slug: 'wheel-alignment', option: 'high-speed', rank: 2 },
      { slug: 'brake-discs', option: 'braking', rank: 1 },
      { slug: 'front-brake-pads', option: 'braking', rank: 2 },
    ],
  },
  {
    slug: 'burning-smell',
    labelAr: 'رائحة احتراق',
    labelEn: 'A burning smell',
    questionAr: 'ما أقرب وصف للرائحة؟',
    questionEn: 'Which is closest to the smell?',
    iconKey: 'flame',
    urgency: 3,
    options: [
      {
        key: 'rubber',
        labelAr: 'مطاط محترق',
        labelEn: 'Burning rubber',
        verdictAr: 'رائحة المطاط غالبًا سير ينزلق أو يلامس جزءًا ساخنًا.',
        verdictEn: 'A rubber smell is usually a slipping belt, or one touching something hot.',
      },
      {
        key: 'oil',
        labelAr: 'زيت محترق',
        labelEn: 'Burning oil',
        verdictAr: 'زيت يتسرب على العادم — يبدأ برائحة وينتهي بدخان.',
        verdictEn: 'Oil dripping onto the exhaust — it starts as a smell and ends as smoke.',
      },
      {
        key: 'sweet',
        labelAr: 'رائحة حلوة',
        labelEn: 'A sweet smell',
        verdictAr: 'الرائحة الحلوة هي ماء الردييتر. راقب مؤشر الحرارة عن قرب.',
        verdictEn: 'A sweet smell is coolant. Watch the temperature gauge closely.',
      },
    ],
    services: [
      { slug: 'serpentine-belt', option: 'rubber', rank: 1 },
      { slug: 'oil-leak-repair', option: 'oil', rank: 1 },
      { slug: 'radiator-replacement', option: 'sweet', rank: 1 },
      { slug: 'water-pump', option: 'sweet', rank: 2 },
      { slug: 'obd-scan', option: null, rank: 3 },
    ],
  },
  {
    slug: 'fluid-under-car',
    labelAr: 'بقعة سائل تحت السيارة',
    labelEn: 'A puddle under the car',
    questionAr: 'ما لون السائل؟',
    questionEn: 'What colour is the fluid?',
    iconKey: 'droplet',
    urgency: 2,
    options: [
      {
        key: 'clear',
        labelAr: 'ماء شفاف',
        labelEn: 'Clear water',
        verdictAr: 'الماء الشفاف تحت السيارة في الصيف هو تصريف المكيّف الطبيعي. لا مشكلة.',
        verdictEn: 'Clear water under a car in summer is normal AC condensate. Nothing is wrong.',
      },
      {
        key: 'brown',
        labelAr: 'بني أو أسود',
        labelEn: 'Brown or black',
        verdictAr: 'زيت محرك. حدد المصدر قبل أن ينخفض المستوى.',
        verdictEn: 'Engine oil. Find the source before the level drops.',
      },
      {
        key: 'green',
        labelAr: 'أخضر أو وردي',
        labelEn: 'Green or pink',
        verdictAr: 'ماء تبريد. لا تشغّل المحرك طويلًا بمستوى منخفض.',
        verdictEn: 'Coolant. Do not run the engine long with the level down.',
      },
    ],
    services: [
      { slug: 'oil-leak-repair', option: 'brown', rank: 1 },
      { slug: 'radiator-replacement', option: 'green', rank: 1 },
      { slug: 'water-pump', option: 'green', rank: 2 },
      { slug: 'ac-leak-test', option: 'clear', rank: 3 },
    ],
  },
  {
    slug: 'knocking-over-bumps',
    labelAr: 'طقطقة عند المطبات',
    labelEn: 'Knocking over bumps',
    questionAr: 'أين تسمع الصوت؟',
    questionEn: 'Where do you hear it?',
    iconKey: 'suspension',
    urgency: 2,
    options: [
      {
        key: 'front',
        labelAr: 'من الأمام',
        labelEn: 'From the front',
        verdictAr: 'الطقطقة الأمامية عادة من المساعدين أو وصلات التعليق.',
        verdictEn: 'Front knocking is usually the struts or the suspension links.',
      },
      {
        key: 'rear',
        labelAr: 'من الخلف',
        labelEn: 'From the rear',
        verdictAr: 'الصوت الخلفي قد يكون بسيطًا — أحيانًا محتويات الصندوق قبل أي شيء آخر.',
        verdictEn: 'Rear noise can be trivial — check what is loose in the boot before anything else.',
      },
    ],
    services: [
      { slug: 'shock-absorbers', option: null, rank: 1 },
      { slug: 'wheel-bearing', option: 'front', rank: 2 },
      { slug: 'wheel-alignment', option: 'front', rank: 3 },
    ],
  },
  {
    slug: 'high-fuel-use',
    labelAr: 'استهلاك وقود مرتفع',
    labelEn: 'Fuel consumption has gone up',
    questionAr: 'هل تغيّر شيء آخر مع الاستهلاك؟',
    questionEn: 'Did anything else change with it?',
    iconKey: 'fuel',
    urgency: 1,
    options: [
      {
        key: 'nothing',
        labelAr: 'لا شيء، السيارة تعمل بشكل طبيعي',
        labelEn: 'Nothing, the car drives normally',
        verdictAr: 'الزيادة التدريجية دون أعراض أخرى غالبًا فلاتر وبواجي متأخرة عن موعدها.',
        verdictEn: 'A gradual rise with no other symptom is usually overdue filters and plugs.',
      },
      {
        key: 'power-loss',
        labelAr: 'مع ضعف في العزم',
        labelEn: 'Along with a loss of power',
        verdictAr: 'الاستهلاك مع ضعف العزم يستحق قراءة كمبيوتر قبل استبدال أي قطعة.',
        verdictEn: 'Consumption plus power loss deserves a computer read before any part is replaced.',
      },
    ],
    services: [
      { slug: 'air-filter', option: 'nothing', rank: 1 },
      { slug: 'spark-plugs', option: 'nothing', rank: 2 },
      { slug: 'oil-change', option: 'nothing', rank: 3 },
      { slug: 'obd-scan', option: 'power-loss', rank: 1 },
      { slug: 'check-engine-diagnosis', option: 'power-loss', rank: 2 },
    ],
  },
];
