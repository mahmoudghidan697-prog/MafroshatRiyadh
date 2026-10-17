// ═══════════════════════════════════════════════════════════════
//  مفروشات السريع — Central site configuration
// ═══════════════════════════════════════════════════════════════
//  This is the SINGLE source of truth for business info, contact
//  details, categories, products, and site content.
//
//  TO UPDATE THE BUSINESS: edit the values below. No component or
//  page needs to change — everything reads from this file.
//
//  ⚠ PLACEHOLDER VALUES: contact.whatsapp and contact.phone are
//    placeholders. Replace them with the real business numbers
//    before going live.
// ═══════════════════════════════════════════════════════════════

export type Locale = 'ar' | 'en';

// ─── Business & Contact ───

export const business = {
  name: { ar: 'مفروشات السريع', en: 'Mafroshat Al Saree' },
  tagline: {
    ar: 'سجاد وموكيت وأرضيات فاخرة في الرياض',
    en: 'Premium Carpets, Moquette & Flooring in Riyadh',
  },
  description: {
    ar: 'نوفّر أجود أنواع السجاد والموكيت والأرضيات للمنازل والمساجد والمكاتب في الرياض، مع خدمة التوريد والتركيب والتوصيل.',
    en: 'We supply premium carpets, moquette, and flooring for homes, mosques, and offices across Riyadh, with supply, installation, and delivery services.',
  },
  // Logo image path (served from /public). Leave empty ('') to use the
  // default "م" letter mark. Replace with e.g. '/images/logo.png'.
  logo: '',
} as const;

export const contact = {
  // ⚠ PLACEHOLDER — replace with the real business WhatsApp number
  whatsapp: '966500000000',
  // ⚠ PLACEHOLDER — replace with the real business telephone number
  phone: '+966500000000',
  phoneDisplay: '966 50 000 0000',
  email: 'info@mafroshat-alsaree.com',
  address: {
    ar: 'الرياض — حي المنفوحة، المملكة العربية السعودية',
    en: 'Al-Manfuhah District, Riyadh, Saudi Arabia',
  },
  mapUrl: 'https://maps.google.com/?q=Al+Manfuhah+Riyadh',
  hours: {
    ar: 'السبت — الخميس: ٩ صباحاً — ١٠ مساءً · الجمعة: ٤ مساءً — ١٠ مساءً',
    en: 'Sat — Thu: 9:00 AM — 10:00 PM · Fri: 4:00 PM — 10:00 PM',
  },
} as const;

export const site = {
  url: 'https://mafroshat-alsaree.com',
  defaultLocale: 'ar' as Locale,
  locales: ['ar', 'en'] as Locale[],
} as const;

// ─── Contact link builders (used everywhere — never hardcode numbers) ───

export function whatsappLink(text?: string, locale: Locale = 'ar'): string {
  const base = `https://wa.me/${contact.whatsapp}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function phoneLink(): string {
  return `tel:${contact.phone}`;
}

/** Prefilled WhatsApp inquiry message for a specific product. */
export function productWhatsappLink(
  product: { name: Localized; sku?: string; slug: string },
  locale: Locale,
): string {
  const name = locale === 'ar' ? product.name.ar : product.name.en;
  const url = `${site.url}/${locale}/products/${product.slug}`;
  const label = locale === 'ar' ? 'اسم المنتج' : 'Product';
  const skuLabel = locale === 'ar' ? 'رمز المنتج' : 'SKU';
  let msg = `مرحباً ${business.name.ar}، أرغب في الاستفسار عن المنتج:\n${label}: ${name}`;
  if (product.sku) msg += `\n${skuLabel}: ${product.sku}`;
  msg += `\nالرابط: ${url}`;
  return whatsappLink(msg, locale);
}

// ─── Types ───

export interface Localized {
  ar: string;
  en: string;
}

export interface ProductSpec {
  label: Localized;
  value: Localized;
}

export interface Product {
  slug: string;
  sku: string;
  name: Localized;
  category: string; // category id
  description: Localized;
  material: Localized;
  color: Localized;
  dimensions?: Localized;
  /** Price is optional — never invent one. `unit` describes the basis (e.g. per m²). */
  price?: { amount: number; currency: 'SAR' };
  unit?: Localized;
  images: string[];
  featured: boolean;
  createdAt: string; // ISO date — drives "newest" sorting
  specs: ProductSpec[];
  variations?: Localized[];
  useCases: ('residential' | 'commercial' | 'mosque' | 'kids')[];
  // Per-product SEO (optional; auto-generated from name/description if empty)
  seoTitle?: string;
  seoDescription?: string;
  // Publication state — admin controls this; DB-backed
  published?: boolean;
  // Merchant that owns this product's contact clicks (billing attribution)
  merchantId?: number;
}

export interface Category {
  id: string;
  name: Localized;
  description: Localized;
  image: string;
}

// ─── Categories ───

export const categories: Category[] = [
  {
    id: 'carpets-rugs',
    name: { ar: 'سجاد وزرابي', en: 'Carpets & Rugs' },
    description: {
      ar: 'سجاد فاخر وزرابي بتصاميم متنوعة تناسب غرف الجلوس والنوم.',
      en: 'Premium carpets and rugs in varied designs for living rooms and bedrooms.',
    },
    image: '/images/categories/carpets-rugs.jpg',
  },
  {
    id: 'moquette',
    name: { ar: 'موكيت', en: 'Moquette' },
    description: {
      ar: 'موكيت جدار بجدار بخامات متينة وألوان عصرية.',
      en: 'Wall-to-wall moquette in durable weaves and modern colors.',
    },
    image: '/images/categories/moquette.jpg',
  },
  {
    id: 'carpet-tiles',
    name: { ar: 'بلاط سجاد', en: 'Carpet Tiles' },
    description: {
      ar: 'بلاط سجاد ٥٠×٥٠ سم سهل التركيب والاستبدال.',
      en: '50×50 cm carpet tiles, easy to install and replace.',
    },
    image: '/images/categories/carpet-tiles.jpg',
  },
  {
    id: 'mosque-carpets',
    name: { ar: 'سجاد مساجد', en: 'Mosque Carpets' },
    description: {
      ar: 'سجاد مساجد عالي الكثافة ومقاوم للاستخدام المكثف.',
      en: 'High-density mosque carpets built for intensive daily use.',
    },
    image: '/images/categories/mosque-carpets.jpg',
  },
  {
    id: 'office-commercial',
    name: { ar: 'سجاد مكاتب وتجاري', en: 'Office & Commercial' },
    description: {
      ar: 'أرضيات سجاد للمكاتب والمراكز التجارية بمعاملات تحمل عالية.',
      en: 'Commercial-grade carpeting for offices and retail centers.',
    },
    image: '/images/categories/office-commercial.jpg',
  },
  {
    id: 'runners-stairs',
    name: { ar: 'ممرات وسجاد درج', en: 'Runners & Stair Carpets' },
    description: {
      ar: 'ممرات وسجاد درج بقياسات حسب الطلب.',
      en: 'Hallway runners and stair carpets in custom widths.',
    },
    image: '/images/categories/runners-stairs.jpg',
  },
  {
    id: 'artificial-grass',
    name: { ar: 'عشب صناعي', en: 'Artificial Grass' },
    description: {
      ar: 'عشب صناعي للحدائق والملاعب والمساحات الخارجية.',
      en: 'Artificial grass for gardens, playgrounds, and outdoor spaces.',
    },
    image: '/images/categories/artificial-grass.jpg',
  },
  {
    id: 'vinyl-flooring',
    name: { ar: 'أرضيات فينيل', en: 'Vinyl Flooring' },
    description: {
      ar: 'أرضيات فينيل بجودة عالية للمنازل والمنشآت الطبية والتجارية.',
      en: 'High-quality vinyl flooring for homes, healthcare, and commercial spaces.',
    },
    image: '/images/categories/vinyl-flooring.jpg',
  },
  {
    id: 'parquet-spc',
    name: { ar: 'باركيه وأرضيات SPC', en: 'Parquet & SPC Flooring' },
    description: {
      ar: 'باركيه طبيعي وأرضيات SPC عالية الجودة للمنازل والمكاتب.',
      en: 'Natural parquet and SPC flooring for homes and offices.',
    },
    image: '/images/categories/parquet-spc.jpg',
  },
  {
    id: 'rubber-flooring',
    name: { ar: 'أرضيات مطاطية ورياضية', en: 'Rubber & Sports Flooring' },
    description: {
      ar: 'أرضيات مطاطية متينة للجيم وملاعب الأطفال والإسطبلات.',
      en: 'Durable rubber flooring for gyms, playgrounds, and horse stables.',
    },
    image: '/images/categories/rubber-flooring.jpg',
  },
];

// ─── Products ───
// NOTE: no prices below are invented business claims — every product with a
// price is a catalog item the business sells. Products without a `price`
// field simply show "السعر عند الطلب / Price on request".

export const products: Product[] = [
  {
    slug: 'classic-persian-rug',
    sku: 'CR-1001',
    name: { ar: 'سجاد فارسي كلاسيك', en: 'Classic Persian Rug' },
    category: 'carpets-rugs',
    description: {
      ar: 'سجاد فارسي كلاسيك بزخارف تقليدية غنية وألوان دافئة، منسوج بخيوط عالية الكثافة تمنحه متانة ومظهراً فاخراً يناسب غرف الجلوس الكبيرة.',
      en: 'Classic Persian rug with rich traditional motifs and warm colors, woven in high-density yarn for durability and a luxurious look in large living rooms.',
    },
    material: { ar: 'بولي بروبلين', en: 'Polypropylene' },
    color: { ar: 'أحمر داكن وبيج', en: 'Deep red & beige' },
    dimensions: { ar: '٢٤٠ × ٣٤٠ سم', en: '240 × 340 cm' },
    unit: { ar: 'قطعة', en: 'Piece' },
    images: ['/images/products/persian-1.jpg', '/images/products/persian-2.jpg'],
    featured: true,
    createdAt: '2026-01-15',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي بروبلين', en: 'Polypropylene' } },
      { label: { ar: 'المقاس', en: 'Size' }, value: { ar: '٢٤٠ × ٣٤٠ سم', en: '240 × 340 cm' } },
      { label: { ar: 'اللون', en: 'Color' }, value: { ar: 'أحمر داكن وبيج', en: 'Deep red & beige' } },
      { label: { ar: 'المتانة', en: 'Durability' }, value: { ar: 'استخدام سكني كثيف', en: 'Heavy residential use' } },
    ],
    variations: [
      { ar: 'أحمر داكن', en: 'Deep red' },
      { ar: 'بيج رملي', en: 'Sandy beige' },
      { ar: 'أزرق ملكي', en: 'Royal blue' },
    ],
    useCases: ['residential'],
  },
  {
    slug: 'modern-geometric-rug',
    sku: 'CR-1002',
    name: { ar: 'سجاد هندسي عصري', en: 'Modern Geometric Rug' },
    category: 'carpets-rugs',
    description: {
      ar: 'سجاد بتصميم هندسي عصري وألوان هادئة، مناسب للديكورات الحديثة وغرف الجلوس.',
      en: 'Contemporary geometric rug in calm tones, ideal for modern interiors and living spaces.',
    },
    material: { ar: 'بولي بروبلين وجوت', en: 'Polypropylene & jute blend' },
    color: { ar: 'رمادي وبيج', en: 'Grey & beige' },
    dimensions: { ar: '١٦٠ × ٢٣٠ سم', en: '160 × 230 cm' },
    unit: { ar: 'قطعة', en: 'Piece' },
    images: ['/images/products/geometric-1.jpg', '/images/products/geometric-2.jpg'],
    featured: true,
    createdAt: '2026-02-20',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي بروبلين وجوت', en: 'Polypropylene & jute' } },
      { label: { ar: 'المقاس', en: 'Size' }, value: { ar: '١٦٠ × ٢٣٠ سم', en: '160 × 230 cm' } },
      { label: { ar: 'اللون', en: 'Color' }, value: { ar: 'رمادي وبيج', en: 'Grey & beige' } },
    ],
    useCases: ['residential'],
  },
  {
    slug: 'premium-moquette-roll',
    sku: 'MQ-2001',
    name: { ar: 'موكيت فاخر برول', en: 'Premium Moquette Roll' },
    category: 'moquette',
    description: {
      ar: 'موكيت جدار بجدار بخامة عالية الكثافة مقاومة للاهتراء، يُباع بالمتر المربع ويُنفّذ بقياسات حسب المساحة.',
      en: 'High-density wall-to-wall moquette with excellent wear resistance, sold by the square meter and cut to your exact floor area.',
    },
    material: { ar: 'بولي إستر', en: 'Polyester' },
    color: { ar: 'بيج رملي', en: 'Sandy beige' },
    price: { amount: 45, currency: 'SAR' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/moquette-1.jpg'],
    featured: true,
    createdAt: '2026-03-05',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي إستر', en: 'Polyester' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
      { label: { ar: 'المتانة', en: 'Durability' }, value: { ar: 'استخدام سكني وتجاري', en: 'Residential & commercial' } },
    ],
    useCases: ['residential', 'commercial'],
  },
  {
    slug: 'tile-50x50-charcoal',
    sku: 'CT-3001',
    name: { ar: 'بلاط سجاد ٥٠×٥٠ — فحمي', en: 'Carpet Tile 50×50 — Charcoal' },
    category: 'carpet-tiles',
    description: {
      ar: 'بلاط سجاد مقاس ٥٠×٥٠ سم بلون فحمي أنيق، سهل التركيب والتنظيف واستبدال البلاطة التالفة وحدها.',
      en: '50×50 cm carpet tile in elegant charcoal — easy to install, clean, and replace individual tiles.',
    },
    material: { ar: 'نايلون سلك', en: 'Nylon 6.6' },
    color: { ar: 'فحمي', en: 'Charcoal' },
    dimensions: { ar: '٥٠ × ٥٠ سم', en: '50 × 50 cm' },
    price: { amount: 28, currency: 'SAR' },
    unit: { ar: 'للبلاطة', en: 'per tile' },
    images: ['/images/products/tile-1.jpg', '/images/products/tile-2.jpg'],
    featured: true,
    createdAt: '2026-03-18',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'نايلون سلك', en: 'Nylon 6.6' } },
      { label: { ar: 'المقاس', en: 'Size' }, value: { ar: '٥٠ × ٥٠ سم', en: '50 × 50 cm' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'البلاطة / المتر المربع', en: 'Tile / m²' } },
      { label: { ar: 'الاستخدام', en: 'Use' }, value: { ar: 'مكاتب وتجاري', en: 'Office & commercial' } },
    ],
    variations: [
      { ar: 'فحمي', en: 'Charcoal' },
      { ar: 'رملي', en: 'Sand' },
      { ar: 'كحلي', en: 'Navy' },
    ],
    useCases: ['commercial'],
  },
  {
    slug: 'mosque-carpet-green',
    sku: 'MS-4001',
    name: { ar: 'سجاد مساجد — أخضر', en: 'Mosque Carpet — Green' },
    category: 'mosque-carpets',
    description: {
      ar: 'سجاد مساجد عالي الكثافة بلون أخضر هادئ، مقاوم للاستخدام اليومي المكثف وسهل التنظيف.',
      en: 'High-density mosque carpet in a calm green, built for intensive daily use and easy cleaning.',
    },
    material: { ar: 'بولي بروبلين عالي الكثافة', en: 'High-density polypropylene' },
    color: { ar: 'أخضر زيتي', en: 'Olive green' },
    dimensions: { ar: 'رولات ٣ متر — قياسات حسب الطلب', en: '3 m rolls — custom sizes' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/mosque-1.jpg'],
    featured: true,
    createdAt: '2026-04-02',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي بروبلين عالي الكثافة', en: 'High-density polypropylene' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
      { label: { ar: 'المتانة', en: 'Durability' }, value: { ar: 'استخدام مكثف يومي', en: 'Intensive daily use' } },
    ],
    useCases: ['mosque'],
  },
  {
    slug: 'office-loop-carpet',
    sku: 'OF-5001',
    name: { ar: 'سجاد مكاتب — لوب', en: 'Office Loop Carpet' },
    category: 'office-commercial',
    description: {
      ar: 'سجاد لوب بمعامل تحمل عالٍ مناسب للمكاتب والممرات التجارية، يُتركّب بشكل احترافي بدون حواف بارزة.',
      en: 'High-traffic loop carpet for offices and commercial corridors, professionally installed without raised edges.',
    },
    material: { ar: 'نايلون سلك', en: 'Nylon 6.6' },
    color: { ar: 'رمادي فاتح', en: 'Light grey' },
    price: { amount: 38, currency: 'SAR' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/office-1.jpg'],
    featured: false,
    createdAt: '2026-04-20',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'نايلون سلك', en: 'Nylon 6.6' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
      { label: { ar: 'الاستخدام', en: 'Use' }, value: { ar: 'مكاتب ومراكز تجارية', en: 'Offices & retail' } },
    ],
    useCases: ['commercial'],
  },
  {
    slug: 'hallway-runner-natural',
    sku: 'RN-6001',
    name: { ar: 'ممر سجاد طبيعي', en: 'Natural Hallway Runner' },
    category: 'runners-stairs',
    description: {
      ar: 'ممر سجاد بألوان ترابية هادئة يتحمل المرور اليومي في الممرات والمداخل.',
      en: 'Earth-tone hallway runner that stands up to daily traffic in corridors and entrances.',
    },
    material: { ar: 'بولي بروبلين', en: 'Polypropylene' },
    color: { ar: 'بيج طبيعي', en: 'Natural beige' },
    dimensions: { ar: 'عرض ٨٠ سم — طول حسب الطلب', en: '80 cm wide — custom length' },
    unit: { ar: 'للمتر الطولي', en: 'per linear meter' },
    images: ['/images/products/runner-1.jpg'],
    featured: false,
    createdAt: '2026-05-08',
    specs: [
      { label: { ar: 'العرض', en: 'Width' }, value: { ar: '٨٠ سم', en: '80 cm' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر الطولي', en: 'Linear meter' } },
    ],
    useCases: ['residential'],
  },
  {
    slug: 'stair-carpet-classic',
    sku: 'RN-6002',
    name: { ar: 'سجاد درج كلاسيك', en: 'Classic Stair Carpet' },
    category: 'runners-stairs',
    description: {
      ar: 'سجاد درج كلاسيك يُتركّب على الدرج بثبات مع حواشي نظيفة ومقاومة للانزلاق.',
      en: 'Classic stair carpet with clean finished edges and slip-resistant installation.',
    },
    material: { ar: 'بولي بروبلين', en: 'Polypropylene' },
    color: { ar: 'بني دافئ', en: 'Warm brown' },
    unit: { ar: 'للمتر الطولي', en: 'per linear meter' },
    images: ['/images/products/stairs-1.jpg'],
    featured: false,
    createdAt: '2026-05-15',
    specs: [
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر الطولي', en: 'Linear meter' } },
    ],
    useCases: ['residential'],
  },
  {
    slug: 'vinyl-oak-plank',
    sku: 'VP-7001',
    name: { ar: 'فينيل بلوط — بقع', en: 'Vinyl Oak Plank' },
    category: 'vinyl-parquet',
    description: {
      ar: 'أرضيات فينيل بمظهر البلوط الطبيعي، مقاومة للماء والخدش وسهلة التنظيف.',
      en: 'Vinyl flooring with natural oak looks — water and scratch resistant, easy to clean.',
    },
    material: { ar: 'فينيل SPC', en: 'SPC vinyl' },
    color: { ar: 'بلوط فاتح', en: 'Light oak' },
    dimensions: { ar: 'ألواح حسب المقاس', en: 'Planks — per spec' },
    price: { amount: 65, currency: 'SAR' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/vinyl-1.jpg'],
    featured: true,
    createdAt: '2026-06-01',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'فينيل SPC', en: 'SPC vinyl' } },
      { label: { ar: 'المقاومة', en: 'Resistance' }, value: { ar: 'ماء وخدش', en: 'Water & scratch' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
    ],
    useCases: ['residential', 'commercial'],
  },
  {
    slug: 'parquet-natural-wood',
    sku: 'VP-7002',
    name: { ar: 'باركيه خشب طبيعي', en: 'Natural Wood Parquet' },
    category: 'vinyl-parquet',
    description: {
      ar: 'باركيه خشب طبيعي بلمسة دافئة وأنيقة تناسب الفلل والمجالس.',
      en: 'Natural wood parquet with a warm, elegant finish for villas and majlises.',
    },
    material: { ar: 'خشب طبيعي', en: 'Natural wood' },
    color: { ar: 'عسلي', en: 'Honey' },
    price: { amount: 120, currency: 'SAR' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/parquet-1.jpg'],
    featured: false,
    createdAt: '2026-06-10',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'خشب طبيعي', en: 'Natural wood' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
    ],
    useCases: ['residential'],
  },
  {
    slug: 'artificial-grass-deluxe',
    sku: 'AG-8001',
    name: { ar: 'نجيل صناعي ديلوكس', en: 'Artificial Grass Deluxe' },
    category: 'artificial-grass',
    description: {
      ar: 'نجيل صناعي عالي الكثافة بمظهر طبيعي للحدائق والملاعب والمساحات الخارجية.',
      en: 'High-density artificial grass with a natural look for gardens, playgrounds, and outdoor areas.',
    },
    material: { ar: 'بولي إيثيلين', en: 'Polyethylene' },
    color: { ar: 'أخضر طبيعي', en: 'Natural green' },
    price: { amount: 55, currency: 'SAR' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/grass-1.jpg'],
    featured: true,
    createdAt: '2026-06-25',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي إيثيلين', en: 'Polyethylene' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
      { label: { ar: 'الاستخدام', en: 'Use' }, value: { ar: 'حدائق وملاعب', en: 'Gardens & playgrounds' } },
    ],
    useCases: ['residential', 'commercial'],
  },
  {
    slug: 'gym-rubber-tile',
    sku: 'GK-9001',
    name: { ar: 'بلاطة مطاط للجيم', en: 'Gym Rubber Tile' },
    category: 'gym-kids-rubber',
    description: {
      ar: 'بلاطات مطاط عالية الكثافة تمتص الصدمات وتتحمل الأثقال، مناسبة لصالات الجيم.',
      en: 'High-density shock-absorbing rubber tiles that withstand heavy weights for gyms.',
    },
    material: { ar: 'مطاط معاد تدويره', en: 'Recycled rubber' },
    color: { ar: 'أسود', en: 'Black' },
    dimensions: { ar: '٥٠ × ٥٠ سم', en: '50 × 50 cm' },
    price: { amount: 35, currency: 'SAR' },
    unit: { ar: 'للبلاطة', en: 'per tile' },
    images: ['/images/products/gym-1.jpg'],
    featured: false,
    createdAt: '2026-07-05',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'مطاط معاد تدويره', en: 'Recycled rubber' } },
      { label: { ar: 'المقاس', en: 'Size' }, value: { ar: '٥٠ × ٥٠ سم', en: '50 × 50 cm' } },
      { label: { ar: 'الاستخدام', en: 'Use' }, value: { ar: 'صالات جيم', en: 'Gyms' } },
    ],
    useCases: ['commercial'],
  },
  {
    slug: 'kids-playground-rubber',
    sku: 'GK-9002',
    name: { ar: 'أرضية مطاط آمنة للأطفال', en: 'Safe Kids Rubber Flooring' },
    category: 'gym-kids-rubber',
    description: {
      ar: 'أرضيات مطاط ناعمة وآمنة لملاعب الأطفال، تمتص السقوط ومتوفرة بألوان مبهجة.',
      en: 'Soft, safe rubber flooring for kids playgrounds that cushions falls, available in cheerful colors.',
    },
    material: { ar: 'EPDM مطاط', en: 'EPDM rubber' },
    color: { ar: 'متعدد الألوان', en: 'Multicolor' },
    dimensions: { ar: 'بلاطات ٥٠×٥٠ سم', en: '50 × 50 cm tiles' },
    price: { amount: 42, currency: 'SAR' },
    unit: { ar: 'للبلاطة', en: 'per tile' },
    images: ['/images/products/kids-1.jpg'],
    featured: false,
    createdAt: '2026-07-12',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'EPDM', en: 'EPDM' } },
      { label: { ar: 'الاستخدام', en: 'Use' }, value: { ar: 'ملاعب أطفال', en: 'Kids playgrounds' } },
    ],
    useCases: ['kids'],
  },
  {
    slug: 'stable-rubber-mat',
    sku: 'ST-10001',
    name: { ar: 'حصيرة مطاط لإسطبلات الخيول', en: 'Horse-Stable Rubber Mat' },
    category: 'stable-rubber',
    description: {
      ar: 'أرضيات مطاط متينة ومقاومة للرطوبة تُفصّل حسب مقاسات الإسطبل.',
      en: 'Durable, moisture-resistant rubber flooring cut to your stable dimensions.',
    },
    material: { ar: 'مطاط صناعي متين', en: 'Heavy-duty rubber' },
    color: { ar: 'أسود', en: 'Black' },
    dimensions: { ar: 'رولات — قياسات حسب الطلب', en: 'Rolls — custom sizes' },
    unit: { ar: 'للمتر المربع', en: 'per m²' },
    images: ['/images/products/stable-1.jpg'],
    featured: false,
    createdAt: '2026-07-20',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'مطاط صناعي متين', en: 'Heavy-duty rubber' } },
      { label: { ar: 'وحدة البيع', en: 'Sold by' }, value: { ar: 'المتر المربع', en: 'Square meter' } },
      { label: { ar: 'الاستخدام', en: 'Use' }, value: { ar: 'إسطبلات خيول', en: 'Horse stables' } },
    ],
    useCases: ['commercial'],
  },
  {
    slug: 'shaggy-rug-cream',
    sku: 'CR-1003',
    name: { ar: 'سجاد شاجي كريمي', en: 'Shaggy Cream Rug' },
    category: 'carpets-rugs',
    description: {
      ar: 'سجاد شاجي ناعم بلون كريمي يمنح الغرفة دفئاً وملمساً مريحاً.',
      en: 'Soft shaggy rug in cream that adds warmth and a cozy texture to any room.',
    },
    material: { ar: 'بولي إستر', en: 'Polyester' },
    color: { ar: 'كريمي', en: 'Cream' },
    dimensions: { ar: '١٤٠ × ٢٠٠ سم', en: '140 × 200 cm' },
    unit: { ar: 'قطعة', en: 'Piece' },
    images: ['/images/products/shaggy-1.jpg'],
    featured: false,
    createdAt: '2026-08-01',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي إستر', en: 'Polyester' } },
      { label: { ar: 'الملمس', en: 'Texture' }, value: { ar: 'شاجي ناعم', en: 'Soft shaggy' } },
    ],
    useCases: ['residential'],
  },
  {
    slug: 'vintage-distressed-rug',
    sku: 'CR-1004',
    name: { ar: 'سجاد فينتاج مستهلك', en: 'Vintage Distressed Rug' },
    category: 'carpets-rugs',
    description: {
      ar: 'سجاد بطابع فينتدج وألوان باهتة أنيقة يناسب الديكور الكلاسيكي والحديث.',
      en: 'Vintage-distressed rug with elegant faded tones that suits classic and modern décor.',
    },
    material: { ar: 'بولي بروبلين', en: 'Polypropylene' },
    color: { ar: 'باهت متعدد', en: 'Distressed multicolor' },
    dimensions: { ar: '١٦٠ × ٢٣٠ سم', en: '160 × 230 cm' },
    unit: { ar: 'قطعة', en: 'Piece' },
    images: ['/images/products/vintage-1.jpg'],
    featured: false,
    createdAt: '2026-08-15',
    specs: [
      { label: { ar: 'المادة', en: 'Material' }, value: { ar: 'بولي بروبلين', en: 'Polypropylene' } },
      { label: { ar: 'الطابع', en: 'Style' }, value: { ar: 'فينتج', en: 'Vintage' } },
    ],
    useCases: ['residential'],
  },
];

// ─── Services ───

export interface Service {
  icon: string;
  title: Localized;
  description: Localized;
}

export const services: Service[] = [
  {
    icon: 'truck',
    title: { ar: 'توريد وتوصيل', en: 'Supply & Delivery' },
    description: {
      ar: 'توريد جميع أنواع السجاد والأرضيات مع خدمة توصيل داخل الرياض.',
      en: 'All carpet and flooring types supplied with delivery across Riyadh.',
    },
  },
  {
    icon: 'ruler',
    title: { ar: 'قياس مجاني', en: 'Free Measurement' },
    description: {
      ar: 'زيارة الموقع وقياس المساحات قبل التركيب لضمان تنفيذ دقيق.',
      en: 'On-site measurement before installation to guarantee an exact fit.',
    },
  },
  {
    icon: 'wrench',
    title: { ar: 'تركيب احترافي', en: 'Professional Installation' },
    description: {
      ar: 'فريق تركيب متخصص للسجاد والموكيت والأرضيات بمظهر نظيف ومتين.',
      en: 'Specialist installation crews for carpets, moquette, and flooring with a clean, durable finish.',
    },
  },
  {
    icon: 'shield',
    title: { ar: 'استشارة مجانية', en: 'Free Consultation' },
    description: {
      ar: 'نساعدك في اختيار الخامة واللون المناسب حسب الاستخدام والميزانية.',
      en: 'We help you choose the right material and color for your use and budget.',
    },
  },
];

// ─── FAQs ───

export interface Faq {
  question: Localized;
  answer: Localized;
}

export const faqs: Faq[] = [
  {
    question: { ar: 'هل التركيب مشمول مع الشراء؟', en: 'Is installation included with purchase?' },
    answer: {
      ar: 'التركيب خدمة إضافية تُحسب حسب المساحة ونوع الأرضية، ويتم الاتفاق عليها بعد القياس. تواصل معنا للحصول على عرض سعر.',
      en: 'Installation is a separate service priced by area and flooring type, agreed after measurement. Contact us for a quote.',
    },
  },
  {
    question: { ar: 'ما هي مناطق التوصيل؟', en: 'What are the delivery areas?' },
    answer: {
      ar: 'نوصّل داخل مدينة الرياض وجميع أحيائها. للمشاريع الكبيرة خارج الرياض، تواصل معنا لترتيب التوصيل.',
      en: 'We deliver across Riyadh and all its districts. For large projects outside Riyadh, contact us to arrange delivery.',
    },
  },
  {
    question: { ar: 'هل يمكنني طلب قياسات خاصة؟', en: 'Can I request custom sizes?' },
    answer: {
      ar: 'نعم، نوفّر قياسات خاصة للممرات وسجاد الدرج والأرضيات التجارية حسب مساحتك.',
      en: 'Yes — we provide custom sizes for runners, stair carpets, and commercial flooring based on your space.',
    },
  },
  {
    question: { ar: 'كيف أعرف السعر؟', en: 'How do I find out the price?' },
    answer: {
      ar: 'الأسعار المعروضة هي أسعار المواد الأساسية، والسعر النهائي يعتمد على المساحة ونوع التركيب. راسلنا على الواتساب أو اتصل بنا للعرض النهائي.',
      en: 'Displayed prices are for base materials; the final price depends on area and installation type. Message us on WhatsApp or call for a final quote.',
    },
  },
];

// ─── Helpers ───

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function productsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.category === categoryId);
}

export function featuredProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.slug !== product.slug,
  );
  const others = products.filter(
    (p) => p.category !== product.category && p.slug !== product.slug,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

/** All distinct filter values derived from a given product list. */
export function filterFacets(list: Product[] = products) {
  const colors = new Map<string, Localized>();
  const materials = new Map<string, Localized>();
  for (const p of list) {
    const colorKey = p.color.en;
    if (!colors.has(colorKey)) colors.set(colorKey, p.color);
    const matKey = p.material.en;
    if (!materials.has(matKey)) materials.set(matKey, p.material);
  }
  return {
    colors: [...colors.values()],
    materials: [...materials.values()],
  };
}
