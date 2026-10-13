# 🏠 مفروشات السريع — Mafroshat Al Saree

موقع كتالوج احترافي لسجاد وموكيت وأرضيات في الرياض.
Professional carpet & flooring catalog website for Riyadh.

---

## 🚀 التشغيل / Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
# → http://localhost:3000

# 3. Production build
npm run build
npm start
```

## ⚙️ تحديث بيانات الموقع / Updating Site Data

**كل بيانات الموقع في ملف واحد:** `src/data/site.ts`

### تغيير أرقام التواصل / Change Contact Numbers
```typescript
export const contact = {
  whatsapp: '966500000000',        // ← غيّر هذا برقم الواتساب الحقيقي
  phone: '+966500000000',          // ← غيّر هذا برقم الهاتف الحقيقي
  phoneDisplay: '966 50 000 0000', // ← رقم العرض
  email: 'info@mafroshat-alsaree.com',
  // ...
};
```

### إضافة منتج / Add a Product
Add an entry to the `products` array in `src/data/site.ts`:

```typescript
{
  slug: 'my-product',              // يظهر في الرابط: /products/my-product
  sku: 'CR-2001',                  // رمز المنتج (اختياري)
  name: { ar: 'اسم المنتج', en: 'Product Name' },
  category: 'carpets-rugs',        // معرّف القسم
  description: { ar: '...', en: '...' },
  material: { ar: '...', en: '...' },
  color: { ar: '...', en: '...' },
  price: { amount: 45, currency: 'SAR' },  // ← احذفه لو السعر عند الطلب
  unit: { ar: 'للقطعة', en: 'per piece' },
  images: ['/images/products/my-product.svg'],
  featured: true,                  // ← يظهر في قسم المميز
  createdAt: '2026-10-01',
  specs: [...],
  useCases: ['residential', 'commercial'],
}
```

### إضافة قسم / Add a Category
Add to the `categories` array in `src/data/site.ts`.

### تغيير النصوص / Change UI Text
All interface text lives in `src/lib/i18n.ts` — Arabic (`ar`) and English (`en`) dictionaries.

---

## 📁 هيكل المشروع / Project Structure

```
src/
├── data/site.ts          ← ★ كل بيانات الموقع (تواصل، منتجات، أقسام، خدمات، أسئلة)
├── lib/i18n.ts           ← ★ ترجمات الواجهة (عربي/إنجليزي)
├── context/AppContext.tsx ← اللغة + المظهر (light/dark) + RTL/LTR
├── components/
│   ├── Header.tsx         ← هيدر: بحث، أقسام، لغة، مظهر، واتساب/هاتف
│   ├── Footer.tsx         ← فوتر
│   ├── FloatingContact.tsx← أزرار تواصل عائمة + شريط الموبايل
│   ├── ProductCard.tsx    ← كارت المنتج
│   └── Icons.tsx          ← أيقونات SVG
├── app/
│   ├── layout.tsx         ← لَوت + فونت + bootstrap للمظهر
│   ├── page.tsx           ← الرئيسية (Hero، أقسام، مميز، خدمات، معرض، من نحن، FAQ)
│   ├── catalog/page.tsx   ← الكتالوج (بحث + تصفية + ترتيب + تحميل المزيد)
│   ├── products/[slug]/   ← صفحة تفاصيل المنتج
│   ├── sitemap.ts         ← sitemap.xml تلقائي
│   ├── robots.ts          ← robots.txt تلقائي
│   └── not-found.tsx      ← صفحة 404
```

---

## ✅ المميزات / Features

- **عربي/إنجليزي** — تبديل كامل للغة مع RTL/LTR (العربية افتراضية)
- **وضع ليلي/نهاري** — حفظ التفضيل + احترام تفضيل النظام (بدون flicker)
- **كتالوج** — بحث، تصفية (لون/مادة/استخدام)، ترتيب، تحميل تدريجي
- **تفاصيل المنتج** — معرض صور، مواصفات، منتجات ذات صلة، WhatsApp + هاتف
- **تواصل** — روابط WhatsApp برسالة مسبقة تحمل اسم المنتج + SKU + الرابط
- **SEO** — sitemap.xml، robots.txt، meta tags، canonical، OG tags
- **Responsive** — موبايل / تابلت / ديسكتوب

---

## ⚠ ملاحظات / Notes

1. **أرقام التواصل placeholders** — غيّر `contact.whatsapp` و `contact.phone` في `src/data/site.ts` قبل النشر.
2. **الصور** — حاليًا placeholder patterns. ضع صور المنتجات الحقيقية في `public/images/products/` وحدّث مساراتها في `site.ts`.
3. **رابط الموقع** — حدّث `site.url` في `src/data/site.ts` بعد حجز الدومين.

---

Tech: Next.js 14 · TypeScript · Tailwind CSS · Cairo + Inter fonts
