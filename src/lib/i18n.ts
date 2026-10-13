// ═══════════════════════════════════════════════════════════════
//  Translation dictionaries — Arabic (default) & English
// ═══════════════════════════════════════════════════════════════
//  Every UI string in the app comes from here. Product and category
//  content lives in src/data/site.ts (Localized fields).

import type { Locale } from '@/data/site';

export interface Dict {
  // Navigation
  navHome: string;
  navCategories: string;
  navCatalog: string;
  navServices: string;
  navAbout: string;
  navFaq: string;
  navContact: string;
  navProducts: string;

  // Header / actions
  search: string;
  searchPlaceholder: string;
  searchProducts: string;
  language: string;
  switchToArabic: string;
  switchToEnglish: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  menu: string;
  close: string;
  whatsapp: string;
  call: string;
  whatsappTooltip: string;
  callTooltip: string;

  // Hero
  heroTitle: string;
  heroSubtitle: string;
  heroCtaBrowse: string;
  heroCtaWhatsapp: string;
  heroCtaCall: string;

  // Categories
  categoriesTitle: string;
  categoriesSubtitle: string;
  viewProducts: string;
  allCategories: string;

  // Featured / catalog
  featuredTitle: string;
  featuredSubtitle: string;
  catalogTitle: string;
  catalogSubtitle: string;
  productsFound: string;
  noProducts: string;
  noProductsHint: string;
  resetFilters: string;
  loadMore: string;
  showingAll: string;

  // Filters
  filters: string;
  filterCategory: string;
  filterColor: string;
  filterMaterial: string;
  filterUse: string;
  filterPrice: string;
  filterAll: string;
  anyPrice: string;
  applyFilters: string;
  showFilters: string;
  hideFilters: string;

  // Use cases
  useResidential: string;
  useCommercial: string;
  useMosque: string;
  useKids: string;

  // Sorting
  sortBy: string;
  sortNewest: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  sortName: string;

  // Product card / detail
  priceOnRequest: string;
  featured: string;
  new: string;
  quickView: string;
  inquireWhatsapp: string;
  callNow: string;
  viewDetails: string;
  specifications: string;
  description: string;
  relatedProducts: string;
  backToCatalog: string;
  productImages: string;
  galleryImage: string;
  variations: string;
  material: string;
  colorLabel: string;
  dimensions: string;
  sku: string;
  category: string;
  unit: string;
  notFoundTitle: string;
  notFoundText: string;
  backHome: string;

  // Services
  servicesTitle: string;
  servicesSubtitle: string;

  // About
  aboutTitle: string;
  aboutText: string;
  aboutPoint1: string;
  aboutPoint2: string;
  aboutPoint3: string;

  // Gallery
  galleryTitle: string;
  gallerySubtitle: string;

  // FAQ
  faqTitle: string;
  faqSubtitle: string;

  // Contact / footer
  contactTitle: string;
  contactSubtitle: string;
  phoneLabel: string;
  whatsappLabel: string;
  emailLabel: string;
  addressLabel: string;
  hoursLabel: string;
  followUs: string;
  quickLinks: string;
  productCategories: string;
  allRights: string;
  businessName: string;
  madeWithCare: string;

  // Contact page — form & extras
  formName: string;
  formPhone: string;
  formEmail: string;
  formMessage: string;
  formNamePlaceholder: string;
  formPhonePlaceholder: string;
  formEmailPlaceholder: string;
  formMessagePlaceholder: string;
  sendMessage: string;
  sending: string;
  messageSent: string;
  messageError: string;
  freeMeasure: string;
  freeMeasureTooltip: string;
  requiredField: string;
  invalidPhone: string;
  invalidEmail: string;
  messageTooShort: string;
  orReachUsDirectly: string;
  whatsappUs: string;
  callUs: string;
  emailUs: string;
  findUs: string;
  visitShowroom: string;
  serviceAreas: string;
  responseTime: string;
  businessHoursFull: string;
  aboutUsTitle: string;
  aboutUsIntro: string;
  aboutUsP1: string;
  aboutUsP2: string;
  aboutUsP3: string;
  whyUs: string;
  whyQuality: string;
  whyQualityDesc: string;
  whyService: string;
  whyServiceDesc: string;
  whyVariety: string;
  whyVarietyDesc: string;
  whyExperience: string;
  whyExperienceDesc: string;
  testimonialsTitle: string;
  testimonialsSubtitle: string;
  productsAvailable: string;
  backToHome: string;
  goToCatalog: string;

  // Breadcrumb
  home: string;

  // Misc
  skipToContent: string;
  pageOf: string;
  sar: string;
  whatsappMessageDefault: string;
  whatsappMessageProduct: string;
}

const ar: Dict = {
  navHome: 'الرئيسية',
  navCategories: 'الأقسام',
  navCatalog: 'الكتالوج',
  navServices: 'خدماتنا',
  navAbout: 'من نحن',
  navFaq: 'أسئلة شائعة',
  navContact: 'تواصل معنا',
  navProducts: 'المنتجات',

  search: 'بحث',
  searchPlaceholder: 'ابحث عن منتج أو رمز SKU...',
  searchProducts: 'ابحث في المنتجات',
  language: 'اللغة',
  switchToArabic: 'التبديل إلى العربية',
  switchToEnglish: 'Switch to English',
  theme: 'المظهر',
  lightMode: 'الوضع النهاري',
  darkMode: 'الوضع الليلي',
  menu: 'القائمة',
  close: 'إغلاق',
  whatsapp: 'واتساب',
  call: 'اتصال',
  whatsappTooltip: 'تواصل معنا على واتساب',
  callTooltip: 'اتصل بنا الآن',

  heroTitle: 'سجاد وموكيت وأرضيات فاخرة تليق بمساحتك',
  heroSubtitle:
    'مفروشات السريع توفّر لك أجود أنواع السجاد والموكيت والأرضيات في الرياض، مع خدمة القياس والتركيب والتوصيل.',
  heroCtaBrowse: 'تصفّح المنتجات',
  heroCtaWhatsapp: 'استفسر على واتساب',
  heroCtaCall: 'اتصل بنا',

  categoriesTitle: 'أقسامنا',
  categoriesSubtitle: 'كل ما تحتاجه من سجاد وأرضيات تحت سقف واحد',
  viewProducts: 'عرض المنتجات',
  allCategories: 'كل الأقسام',

  featuredTitle: 'منتجات مميزة',
  featuredSubtitle: 'مختارات من أفضل ما نوفّره لعملائنا',
  catalogTitle: 'كتالوج المنتجات',
  catalogSubtitle: 'استعرض جميع المنتجات مع إمكانية البحث والتصفية',
  productsFound: 'منتج',
  noProducts: 'لا توجد منتجات مطابقة',
  noProductsHint: 'جرّب تغيير معايير البحث أو التصفية.',
  resetFilters: 'إعادة تعيين التصفية',
  loadMore: 'عرض المزيد',
  showingAll: 'تم عرض جميع المنتجات',

  filters: 'التصفية',
  filterCategory: 'القسم',
  filterColor: 'اللون',
  filterMaterial: 'المادة',
  filterUse: 'الاستخدام',
  filterPrice: 'السعر',
  filterAll: 'الكل',
  anyPrice: 'أي سعر',
  applyFilters: 'تطبيق',
  showFilters: 'عرض التصفية',
  hideFilters: 'إخفاء التصفية',

  useResidential: 'سكني',
  useCommercial: 'تجاري',
  useMosque: 'مساجد',
  useKids: 'أطفال',

  sortBy: 'ترتيب حسب',
  sortNewest: 'الأحدث',
  sortPriceLow: 'السعر: من الأقل',
  sortPriceHigh: 'السعر: من الأعلى',
  sortName: 'الاسم',

  priceOnRequest: 'السعر عند الطلب',
  featured: 'مميز',
  new: 'جديد',
  quickView: 'نظرة سريعة',
  inquireWhatsapp: 'استفسر على واتساب',
  callNow: 'اتصل الآن',
  viewDetails: 'عرض التفاصيل',
  specifications: 'المواصفات',
  description: 'الوصف',
  relatedProducts: 'منتجات ذات صلة',
  backToCatalog: 'العودة للكتالوج',
  productImages: 'صور المنتج',
  galleryImage: 'صورة المنتج',
  variations: 'الألوان المتوفرة',
  material: 'المادة',
  colorLabel: 'اللون',
  dimensions: 'المقاسات',
  sku: 'رمز المنتج',
  category: 'القسم',
  unit: 'وحدة البيع',
  notFoundTitle: 'الصفحة غير موجودة',
  notFoundText: 'عذراً، الصفحة التي تبحث عنها غير متوفرة.',
  backHome: 'العودة للرئيسية',

  servicesTitle: 'خدماتنا',
  servicesSubtitle: 'خدمة متكاملة من الاختيار حتى التركيب',

  aboutTitle: 'من نحن',
  aboutText:
    'مفروشات السريع من الوجهات المعروفة في الرياض لتوريد السجاد والموكيت والأرضيات بجميع أنواعها. نخدم المنازل والمساجد والمكاتب والمشاريع التجارية بخامات مختارة وأسعار تنافسية.',
  aboutPoint1: 'خامات مختارة بعناية تناسب الاستخدام السكني والتجاري',
  aboutPoint2: 'فريق تركيب محترف وخدمة قياس مجانية',
  aboutPoint3: 'توفّر دائمي وأسعار تنافسية مع خدمة عملاء متميزة',

  galleryTitle: 'معرض الصور',
  gallerySubtitle: 'نماذج من أعمالنا وتشكيلاتنا',

  faqTitle: 'أسئلة شائعة',
  faqSubtitle: 'إجابات على أكثر الأسئلة تكراراً',

  contactTitle: 'تواصل معنا',
  contactSubtitle: 'نحن جاهزون لخدمتك — اختر الطريقة الأنسب لك',
  phoneLabel: 'الهاتف',
  whatsappLabel: 'واتساب',
  emailLabel: 'البريد الإلكتروني',
  addressLabel: 'العنوان',
  hoursLabel: 'ساعات العمل',
  followUs: 'روابط سريعة',
  quickLinks: 'روابط سريعة',
  productCategories: 'أقسام المنتجات',
  allRights: 'جميع الحقوق محفوظة',
  businessName: 'مفروشات السريع',
  madeWithCare: 'صُنع بعناية في الرياض',

  formName: 'الاسم',
  formPhone: 'رقم الجوال',
  formEmail: 'البريد الإلكتروني',
  formMessage: 'رسالتك',
  formNamePlaceholder: 'اكتب اسمك الكريم',
  formPhonePlaceholder: '05XXXXXXXX',
  formEmailPlaceholder: 'you@example.com',
  formMessagePlaceholder: 'اكتب تفاصيل استفسارك أو الخدمة اللي تحتاجها...',
  sendMessage: 'إرسال الرسالة',
  sending: 'جاري الإرسال...',
  messageSent: 'اتفتح لك واتساب — ابعت الرسالة من هناك',
  messageError: 'حصل خطأ أثناء الإرسال، جرّب تاني أو تواصل واتساب',
  freeMeasure: 'اطلب قياس مجاني',
  freeMeasureTooltip: 'اطلب قياس مجاني لمنزلك أو مكتبك على واتساب',
  requiredField: 'هذا الحقل مطلوب',
  invalidPhone: 'رقم الجوال غير صحيح',
  invalidEmail: 'البريد الإلكتروني غير صحيح',
  messageTooShort: 'الرسالة قصيرة جدًا',
  orReachUsDirectly: 'أو تواصل معانا مباشرة',
  whatsappUs: 'راسلنا واتساب',
  callUs: 'اتصل بينا',
  emailUs: 'راسلنا بريد',
  findUs: 'موقعنا',
  visitShowroom: 'زور معرضنا',
  serviceAreas: 'نخدم كل أحياء الرياض',
  responseTime: 'نردّ عليك خلال ساعات العمل',
  businessHoursFull: 'السبت - الخميس: 9 ص - 10 م | الجمعة: 4 م - 10 م',
  aboutUsTitle: 'من نحن',
  aboutUsIntro: 'مفروشات السريع — خبرة طويلة في السجاد والموكيت والأرضيات في الرياض',
  aboutUsP1:
    'مفروشات السريع من المحلات المعروفة في الرياض في مجال السجاد والموكيت والأرضيات بكل أنواعها. بنخدم العملاء السكنيين والتجاريين بمنتجات أصلية بجودة عالية وأسعار منافسة.',
  aboutUsP2:
    'بنوفّر مجموعة كبيرة من السجاد الفارسي والحديث، الموكيت، بلاط الموكيت، سجاد المساجد، باركيه وفينيل، عشب جداري، وأرضيات مطاطية للجيمات والأطفال وإسطبلات الخيول. وبنوفّر خدمة القياس والتركيب والتوصيل.',
  aboutUsP3:
    'التزامنا إن العميل يطلع راضي: منتجات مختارة بعناية، تركيب احترافي، وخدمة عملاء سريعة على الواتساب والهاتف. هدفنا نكون خيارك الأول للسجاد والأرضيات في الرياض.',
  whyUs: 'ليه تختارنا',
  whyQuality: 'جودة مضمونة',
  whyQualityDesc: 'منتجات أصلية من أفضل المصانع بمعايير جودة عالية.',
  whyService: 'خدمة كاملة',
  whyServiceDesc: 'قياس، تركيب احترافي، وتوصيل لكل مناطق الرياض.',
  whyVariety: 'تنوع كبير',
  whyVarietyDesc: 'أكثر من قسم وعشرات الموديلات تناسب كل ذوق ومكان.',
  whyExperience: 'خبرة وسعر',
  whyExperienceDesc: 'سنوات من الخبرة في السوق مع أسعار منافسة وشفافة.',
  testimonialsTitle: 'آراء عملائنا',
  testimonialsSubtitle: 'ثقة عملائنا هي أكبر إنجاز لينا',
  productsAvailable: 'منتج متاح',
  backToHome: 'العودة للرئيسية',
  goToCatalog: 'تصفّح الكتالوج',

  home: 'الرئيسية',

  skipToContent: 'تخطَّ إلى المحتوى',
  pageOf: 'من',
  sar: 'ر.س',
  whatsappMessageDefault: 'مرحباً مفروشات السريع، أرغب في الاستفسار عن منتجاتكم.',
  whatsappMessageProduct: 'اسم المنتج',
};

const en: Dict = {
  navHome: 'Home',
  navCategories: 'Categories',
  navCatalog: 'Catalog',
  navServices: 'Services',
  navAbout: 'About',
  navFaq: 'FAQ',
  navContact: 'Contact',
  navProducts: 'Products',

  search: 'Search',
  searchPlaceholder: 'Search by name or SKU...',
  searchProducts: 'Search products',
  language: 'Language',
  switchToArabic: 'التبديل إلى العربية',
  switchToEnglish: 'Switch to English',
  theme: 'Theme',
  lightMode: 'Light mode',
  darkMode: 'Dark mode',
  menu: 'Menu',
  close: 'Close',
  whatsapp: 'WhatsApp',
  call: 'Call',
  whatsappTooltip: 'Chat with us on WhatsApp',
  callTooltip: 'Call us now',

  heroTitle: 'Carpets, Moquette & Flooring Worthy of Your Space',
  heroSubtitle:
    'Mafroshat Al Saree brings you the finest carpets, moquette, and flooring in Riyadh — with measurement, installation, and delivery.',
  heroCtaBrowse: 'Browse Products',
  heroCtaWhatsapp: 'Inquire on WhatsApp',
  heroCtaCall: 'Call Us',

  categoriesTitle: 'Our Categories',
  categoriesSubtitle: 'Every carpet and flooring need under one roof',
  viewProducts: 'View Products',
  allCategories: 'All Categories',

  featuredTitle: 'Featured Products',
  featuredSubtitle: 'Handpicked selections from our best range',
  catalogTitle: 'Product Catalog',
  catalogSubtitle: 'Browse the full range with search and filters',
  productsFound: 'products',
  noProducts: 'No matching products',
  noProductsHint: 'Try adjusting your search or filters.',
  resetFilters: 'Reset filters',
  loadMore: 'Load More',
  showingAll: 'All products shown',

  filters: 'Filters',
  filterCategory: 'Category',
  filterColor: 'Color',
  filterMaterial: 'Material',
  filterUse: 'Intended Use',
  filterPrice: 'Price',
  filterAll: 'All',
  anyPrice: 'Any price',
  applyFilters: 'Apply',
  showFilters: 'Show filters',
  hideFilters: 'Hide filters',

  useResidential: 'Residential',
  useCommercial: 'Commercial',
  useMosque: 'Mosque',
  useKids: 'Kids',

  sortBy: 'Sort by',
  sortNewest: 'Newest',
  sortPriceLow: 'Price: Low to High',
  sortPriceHigh: 'Price: High to Low',
  sortName: 'Name',

  priceOnRequest: 'Price on request',
  featured: 'Featured',
  new: 'New',
  quickView: 'Quick view',
  inquireWhatsapp: 'Inquire on WhatsApp',
  callNow: 'Call now',
  viewDetails: 'View details',
  specifications: 'Specifications',
  description: 'Description',
  relatedProducts: 'Related Products',
  backToCatalog: 'Back to catalog',
  productImages: 'Product images',
  galleryImage: 'Product image',
  variations: 'Available colors',
  material: 'Material',
  colorLabel: 'Color',
  dimensions: 'Dimensions',
  sku: 'SKU',
  category: 'Category',
  unit: 'Sold by',
  notFoundTitle: 'Page not found',
  notFoundText: 'Sorry, the page you are looking for does not exist.',
  backHome: 'Back to home',

  servicesTitle: 'Our Services',
  servicesSubtitle: 'A complete service from selection to installation',

  aboutTitle: 'About Us',
  aboutText:
    'Mafroshat Al Saree is a well-known Riyadh supplier of carpets, moquette, and flooring of every kind. We serve homes, mosques, offices, and commercial projects with carefully selected materials and competitive prices.',
  aboutPoint1: 'Carefully chosen materials for residential and commercial use',
  aboutPoint2: 'Professional installation crew and free measurement',
  aboutPoint3: 'Constant availability, competitive prices, and excellent service',

  galleryTitle: 'Gallery',
  gallerySubtitle: 'A selection of our work and collections',

  faqTitle: 'Frequently Asked Questions',
  faqSubtitle: 'Answers to the questions we hear most',

  contactTitle: 'Contact Us',
  contactSubtitle: 'We are ready to serve you — pick what works best',
  phoneLabel: 'Phone',
  whatsappLabel: 'WhatsApp',
  emailLabel: 'Email',
  addressLabel: 'Address',
  hoursLabel: 'Working hours',
  followUs: 'Quick links',
  quickLinks: 'Quick links',
  productCategories: 'Product categories',
  allRights: 'All rights reserved',
  businessName: 'Mafroshat Al Saree',
  madeWithCare: 'Crafted with care in Riyadh',

  formName: 'Name',
  formPhone: 'Phone number',
  formEmail: 'Email',
  formMessage: 'Your message',
  formNamePlaceholder: 'Enter your name',
  formPhonePlaceholder: '05XXXXXXXX',
  formEmailPlaceholder: 'you@example.com',
  formMessagePlaceholder: 'Tell us what you need...',
  sendMessage: 'Send message',
  sending: 'Sending...',
  messageSent: 'WhatsApp opened — send your message from there',
  messageError: 'Something went wrong. Please try again or reach us on WhatsApp.',
  freeMeasure: 'Request a free measure',
  freeMeasureTooltip: 'Request a free measurement for your home or office on WhatsApp',
  requiredField: 'This field is required',
  invalidPhone: 'Invalid phone number',
  invalidEmail: 'Invalid email address',
  messageTooShort: 'Message is too short',
  orReachUsDirectly: 'Or reach us directly',
  whatsappUs: 'Message us on WhatsApp',
  callUs: 'Call us',
  emailUs: 'Email us',
  findUs: 'Our location',
  visitShowroom: 'Visit our showroom',
  serviceAreas: 'Serving all areas of Riyadh',
  responseTime: 'We reply within business hours',
  businessHoursFull: 'Sat - Thu: 9 AM - 10 PM | Fri: 4 PM - 10 PM',
  aboutUsTitle: 'About Us',
  aboutUsIntro: 'Mafroshat Al Saree — long experience in carpets, moquette, and flooring in Riyadh',
  aboutUsP1:
    'Mafroshat Al Saree is a well-known name in Riyadh for carpets, moquette, and all kinds of flooring. We serve residential and commercial customers with high-quality products at competitive prices.',
  aboutUsP2:
    'We offer a wide range of Persian and modern rugs, moquette, carpet tiles, mosque carpets, parquet and vinyl, artificial grass, and rubber flooring for gyms, children, and horse stables. We also provide measurement, installation, and delivery.',
  aboutUsP3:
    'Our commitment is a satisfied customer: carefully selected products, professional installation, and fast support on WhatsApp and phone. We aim to be your first choice for carpets and flooring in Riyadh.',
  whyUs: 'Why choose us',
  whyQuality: 'Guaranteed quality',
  whyQualityDesc: 'Genuine products from top factories with high standards.',
  whyService: 'Full service',
  whyServiceDesc: 'Measurement, professional installation, and delivery across Riyadh.',
  whyVariety: 'Huge variety',
  whyVarietyDesc: 'Multiple categories and dozens of models for every taste and space.',
  whyExperience: 'Experience & price',
  whyExperienceDesc: 'Years in the market with competitive, transparent pricing.',
  testimonialsTitle: 'What our customers say',
  testimonialsSubtitle: 'Our customers trust is our greatest achievement',
  productsAvailable: 'products available',
  backToHome: 'Back to home',
  goToCatalog: 'Browse the catalog',

  home: 'Home',

  skipToContent: 'Skip to content',
  pageOf: 'of',
  sar: 'SAR',
  whatsappMessageDefault: "Hello Mafroshat Al Saree, I'd like to inquire about your products.",
  whatsappMessageProduct: 'Product',
};

export const dictionaries: Record<Locale, Dict> = { ar, en };

/** Pick the localized value for the current locale. */
export function loc(locale: Locale, value: { ar: string; en: string }): string {
  return locale === 'ar' ? value.ar : value.en;
}

export function t(locale: Locale): Dict {
  return dictionaries[locale];
}

/** Format a price using the current locale's currency convention. */
export function formatPrice(
  locale: Locale,
  amount: number,
  currency: 'SAR' = 'SAR',
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
