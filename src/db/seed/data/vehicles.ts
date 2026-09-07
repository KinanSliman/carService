/**
 * Reference data for the demo garage's "add a car" form. The list is the
 * Qatari road population rather than a global best-sellers list — Land
 * Cruisers and Patrols outnumber hatchbacks here by a wide margin, and the
 * form's dropdown should look like the street outside.
 */

export type SeedMake = {
  slug: string;
  nameAr: string;
  nameEn: string;
  models: { slug: string; nameAr: string; nameEn: string; yearFrom: number; yearTo?: number }[];
};

export const makes: SeedMake[] = [
  {
    slug: 'toyota',
    nameAr: 'تويوتا',
    nameEn: 'Toyota',
    models: [
      { slug: 'land-cruiser', nameAr: 'لاند كروزر', nameEn: 'Land Cruiser', yearFrom: 2008 },
      { slug: 'prado', nameAr: 'برادو', nameEn: 'Prado', yearFrom: 2010 },
      { slug: 'camry', nameAr: 'كامري', nameEn: 'Camry', yearFrom: 2007 },
      { slug: 'corolla', nameAr: 'كورولا', nameEn: 'Corolla', yearFrom: 2007 },
      { slug: 'hilux', nameAr: 'هايلكس', nameEn: 'Hilux', yearFrom: 2006 },
      { slug: 'fortuner', nameAr: 'فورتشنر', nameEn: 'Fortuner', yearFrom: 2009 },
      { slug: 'yaris', nameAr: 'يارس', nameEn: 'Yaris', yearFrom: 2006 },
    ],
  },
  {
    slug: 'nissan',
    nameAr: 'نيسان',
    nameEn: 'Nissan',
    models: [
      { slug: 'patrol', nameAr: 'باترول', nameEn: 'Patrol', yearFrom: 2010 },
      { slug: 'altima', nameAr: 'التيما', nameEn: 'Altima', yearFrom: 2007 },
      { slug: 'sunny', nameAr: 'صني', nameEn: 'Sunny', yearFrom: 2006 },
      { slug: 'x-trail', nameAr: 'اكس تريل', nameEn: 'X-Trail', yearFrom: 2008 },
      { slug: 'pathfinder', nameAr: 'باثفندر', nameEn: 'Pathfinder', yearFrom: 2008 },
    ],
  },
  {
    slug: 'lexus',
    nameAr: 'لكزس',
    nameEn: 'Lexus',
    models: [
      { slug: 'lx', nameAr: 'إل إكس', nameEn: 'LX', yearFrom: 2008 },
      { slug: 'gx', nameAr: 'جي إكس', nameEn: 'GX', yearFrom: 2010 },
      { slug: 'es', nameAr: 'إي إس', nameEn: 'ES', yearFrom: 2007 },
      { slug: 'rx', nameAr: 'آر إكس', nameEn: 'RX', yearFrom: 2008 },
    ],
  },
  {
    slug: 'mitsubishi',
    nameAr: 'ميتسوبيشي',
    nameEn: 'Mitsubishi',
    models: [
      { slug: 'pajero', nameAr: 'باجيرو', nameEn: 'Pajero', yearFrom: 2007 },
      { slug: 'lancer', nameAr: 'لانسر', nameEn: 'Lancer', yearFrom: 2007, yearTo: 2021 },
      { slug: 'l200', nameAr: 'إل 200', nameEn: 'L200', yearFrom: 2008 },
      { slug: 'attrage', nameAr: 'أتراج', nameEn: 'Attrage', yearFrom: 2014 },
    ],
  },
  {
    slug: 'hyundai',
    nameAr: 'هيونداي',
    nameEn: 'Hyundai',
    models: [
      { slug: 'sonata', nameAr: 'سوناتا', nameEn: 'Sonata', yearFrom: 2007 },
      { slug: 'elantra', nameAr: 'النترا', nameEn: 'Elantra', yearFrom: 2007 },
      { slug: 'tucson', nameAr: 'توسان', nameEn: 'Tucson', yearFrom: 2008 },
      { slug: 'santa-fe', nameAr: 'سنتافي', nameEn: 'Santa Fe', yearFrom: 2007 },
      { slug: 'accent', nameAr: 'اكسنت', nameEn: 'Accent', yearFrom: 2007 },
    ],
  },
  {
    slug: 'kia',
    nameAr: 'كيا',
    nameEn: 'Kia',
    models: [
      { slug: 'optima', nameAr: 'أوبتيما', nameEn: 'Optima', yearFrom: 2010 },
      { slug: 'sportage', nameAr: 'سبورتاج', nameEn: 'Sportage', yearFrom: 2008 },
      { slug: 'cerato', nameAr: 'سيراتو', nameEn: 'Cerato', yearFrom: 2009 },
      { slug: 'sorento', nameAr: 'سورينتو', nameEn: 'Sorento', yearFrom: 2010 },
    ],
  },
  {
    slug: 'chevrolet',
    nameAr: 'شيفروليه',
    nameEn: 'Chevrolet',
    models: [
      { slug: 'tahoe', nameAr: 'تاهو', nameEn: 'Tahoe', yearFrom: 2007 },
      { slug: 'silverado', nameAr: 'سلفرادو', nameEn: 'Silverado', yearFrom: 2008 },
      { slug: 'malibu', nameAr: 'ماليبو', nameEn: 'Malibu', yearFrom: 2010 },
      { slug: 'captiva', nameAr: 'كابتيفا', nameEn: 'Captiva', yearFrom: 2008 },
    ],
  },
  {
    slug: 'ford',
    nameAr: 'فورد',
    nameEn: 'Ford',
    models: [
      { slug: 'explorer', nameAr: 'إكسبلورر', nameEn: 'Explorer', yearFrom: 2008 },
      { slug: 'f-150', nameAr: 'إف 150', nameEn: 'F-150', yearFrom: 2009 },
      { slug: 'edge', nameAr: 'إيدج', nameEn: 'Edge', yearFrom: 2010 },
      { slug: 'taurus', nameAr: 'توروس', nameEn: 'Taurus', yearFrom: 2010, yearTo: 2019 },
    ],
  },
  {
    slug: 'gmc',
    nameAr: 'جي إم سي',
    nameEn: 'GMC',
    models: [
      { slug: 'yukon', nameAr: 'يوكن', nameEn: 'Yukon', yearFrom: 2008 },
      { slug: 'sierra', nameAr: 'سييرا', nameEn: 'Sierra', yearFrom: 2009 },
      { slug: 'acadia', nameAr: 'أكاديا', nameEn: 'Acadia', yearFrom: 2010 },
    ],
  },
  {
    slug: 'honda',
    nameAr: 'هوندا',
    nameEn: 'Honda',
    models: [
      { slug: 'accord', nameAr: 'أكورد', nameEn: 'Accord', yearFrom: 2008 },
      { slug: 'civic', nameAr: 'سيفيك', nameEn: 'Civic', yearFrom: 2007 },
      { slug: 'cr-v', nameAr: 'سي آر في', nameEn: 'CR-V', yearFrom: 2008 },
      { slug: 'pilot', nameAr: 'بايلوت', nameEn: 'Pilot', yearFrom: 2010 },
    ],
  },
  {
    slug: 'mercedes-benz',
    nameAr: 'مرسيدس بنز',
    nameEn: 'Mercedes-Benz',
    models: [
      { slug: 'c-class', nameAr: 'الفئة C', nameEn: 'C-Class', yearFrom: 2008 },
      { slug: 'e-class', nameAr: 'الفئة E', nameEn: 'E-Class', yearFrom: 2008 },
      { slug: 'g-class', nameAr: 'الفئة G', nameEn: 'G-Class', yearFrom: 2008 },
      { slug: 'gle', nameAr: 'جي إل إي', nameEn: 'GLE', yearFrom: 2015 },
    ],
  },
  {
    slug: 'bmw',
    nameAr: 'بي إم دبليو',
    nameEn: 'BMW',
    models: [
      { slug: '3-series', nameAr: 'الفئة الثالثة', nameEn: '3 Series', yearFrom: 2008 },
      { slug: '5-series', nameAr: 'الفئة الخامسة', nameEn: '5 Series', yearFrom: 2008 },
      { slug: 'x5', nameAr: 'إكس 5', nameEn: 'X5', yearFrom: 2008 },
      { slug: 'x3', nameAr: 'إكس 3', nameEn: 'X3', yearFrom: 2010 },
    ],
  },
  {
    slug: 'land-rover',
    nameAr: 'لاند روفر',
    nameEn: 'Land Rover',
    models: [
      { slug: 'range-rover', nameAr: 'رينج روفر', nameEn: 'Range Rover', yearFrom: 2008 },
      { slug: 'discovery', nameAr: 'ديسكفري', nameEn: 'Discovery', yearFrom: 2008 },
      { slug: 'defender', nameAr: 'ديفندر', nameEn: 'Defender', yearFrom: 2020 },
    ],
  },
  {
    slug: 'mazda',
    nameAr: 'مازدا',
    nameEn: 'Mazda',
    models: [
      { slug: 'mazda-6', nameAr: 'مازدا 6', nameEn: 'Mazda 6', yearFrom: 2008 },
      { slug: 'cx-5', nameAr: 'سي إكس 5', nameEn: 'CX-5', yearFrom: 2012 },
      { slug: 'cx-9', nameAr: 'سي إكس 9', nameEn: 'CX-9', yearFrom: 2010 },
    ],
  },
];
