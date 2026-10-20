// ═══════════════════════════════════════════════════════════════
//  Database layer — Turso (libSQL) via @libsql/client
// ═══════════════════════════════════════════════════════════════
//  ALL functions are ASYNC because @libsql/client's execute()
//  returns a Promise. Callers must await every function.
//
//  Config from env vars:
//    TURSO_DATABASE_URL  = libsql://your-db.turso.io
//    TURSO_AUTH_TOKEN    = eyJ... (from the Turso dashboard)
//
//  Falls back to a local file DB when env vars are absent (dev).
// ═══════════════════════════════════════════════════════════════

import { createClient, type Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import { contact as staticContact } from '@/data/site';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;
let schemaReady = false;

export function getDb(): Client {
  if (client) return client;
  if (TURSO_URL && TURSO_TOKEN) {
    client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  } else {
    client = createClient({ url: `file:${path.join(DATA_DIR, 'site.db')}` });
  }
  return client;
}

async function ensureSchema() {
  if (schemaReady) return;
  const db = getDb();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, sku TEXT,
      name_ar TEXT NOT NULL, name_en TEXT NOT NULL, category_id TEXT NOT NULL,
      description_ar TEXT, description_en TEXT, material_ar TEXT, material_en TEXT,
      color_ar TEXT, color_en TEXT, dimensions_ar TEXT, dimensions_en TEXT,
      price INTEGER, unit_ar TEXT, unit_en TEXT,
      images TEXT NOT NULL DEFAULT '[]', featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, specs TEXT NOT NULL DEFAULT '[]',
      variations TEXT NOT NULL DEFAULT '[]', use_cases TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 1, seo_title TEXT, seo_description TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name_ar TEXT NOT NULL, name_en TEXT NOT NULL,
      description_ar TEXT, description_en TEXT, image TEXT NOT NULL,
      primary_product_id TEXT
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, role TEXT NOT NULL,
      quote TEXT NOT NULL, rating INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS content_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT, section TEXT NOT NULL,
      item_id TEXT NOT NULL, data TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
      UNIQUE(section, item_id)
    );
    CREATE TABLE IF NOT EXISTS contact_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, contact TEXT NOT NULL,
      contact_key TEXT,
      page_url TEXT NOT NULL, page_title TEXT,
      session_id TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_contact_events_created ON contact_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_contact_events_type ON contact_events(type);
    CREATE INDEX IF NOT EXISTS idx_contact_events_contact ON contact_events(contact);
    CREATE INDEX IF NOT EXISTS idx_contact_events_page ON contact_events(page_url);
    CREATE INDEX IF NOT EXISTS idx_contact_events_key ON contact_events(contact_key);
    CREATE TABLE IF NOT EXISTS contacts (
      key TEXT PRIMARY KEY, name_ar TEXT NOT NULL, name_en TEXT NOT NULL,
      type TEXT NOT NULL, number TEXT NOT NULL,
      location_ar TEXT NOT NULL, location_en TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
    CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(active);
  `);
  schemaReady = true;
  // Seed the default contact icons if the table is empty
  await seedContacts();
  // Safe migration: add contact_key to contact_events if missing (older DBs)
  await migrateContactEventsKey();
  await migrateMissingContacts();
  // Safe migration: merchant/agreement/billing tables + columns
  await migrateMerchantSchema();
  // Safe migration: website traffic analytics table
  await migrateAnalyticsSchema();
}

// Safe migrations that run every time (not gated by schemaReady) so new
// tables/columns reach databases created before this feature shipped.
async function migrateContactEventsKey() {
  try {
    const db = getDb();
    // Ensure the contacts table exists (older DBs created before the
    // contact-icon system lack it — schemaReady may already be true).
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS contacts (
        key TEXT PRIMARY KEY, name_ar TEXT NOT NULL, name_en TEXT NOT NULL,
        type TEXT NOT NULL, number TEXT NOT NULL,
        location_ar TEXT NOT NULL, location_en TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      )`,
      args: [],
    });
    const info = await db.execute({ sql: 'PRAGMA table_info(contact_events)', args: [] });
    const has = info.rows.some((r: any) => r.name === 'contact_key');
    if (!has) {
      await db.execute({ sql: 'ALTER TABLE contact_events ADD COLUMN contact_key TEXT', args: [] });
    }
    // Device type column (for per-icon analytics) — safe migration
    const info2 = await db.execute({ sql: 'PRAGMA table_info(contact_events)', args: [] });
    if (!info2.rows.some((r: any) => r.name === 'device_type')) {
      await db.execute({ sql: 'ALTER TABLE contact_events ADD COLUMN device_type TEXT', args: [] });
    }
  } catch {
    // Ignore — best effort
  }
}

// ─── Ensure every DEFAULT_CONTACTS key exists (runs every time) ───
async function migrateMissingContacts() {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    for (const c of DEFAULT_CONTACTS) {
      const ex = await db.execute({ sql: 'SELECT 1 FROM contacts WHERE key = ?', args: [c.key] });
      if (ex.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO contacts (key, name_ar, name_en, type, number, location_ar, location_en, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          args: [c.key, c.name_ar, c.name_en, c.type, c.fallback(), c.location_ar, c.location_en, now, now],
        });
      }
    }
  } catch {
    // Ignore — best effort
  }
}

// ─── Merchant / agreements / billing schema (runs every time) ───
async function migrateMerchantSchema() {
  try {
    const db = getDb();
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS merchants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT, whatsapp TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS agreements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        merchant_id INTEGER NOT NULL,
        name TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        agreed_clicks INTEGER NOT NULL,
        rate_per_click INTEGER NOT NULL,
        additional_rate INTEGER,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_agreements_merchant ON agreements(merchant_id);
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        merchant_id INTEGER NOT NULL,
        agreement_id INTEGER NOT NULL,
        issue_date TEXT NOT NULL,
        period_from TEXT, period_to TEXT,
        agreed_clicks INTEGER NOT NULL DEFAULT 0,
        agreed_rate INTEGER NOT NULL DEFAULT 0,
        additional_clicks INTEGER NOT NULL DEFAULT 0,
        additional_rate INTEGER NOT NULL DEFAULT 0,
        total_clicks INTEGER NOT NULL DEFAULT 0,
        subtotal INTEGER NOT NULL DEFAULT 0,
        tax_rate INTEGER NOT NULL DEFAULT 0,
        tax_amount INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        amount_paid INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        notes TEXT,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_merchant ON invoices(merchant_id);
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        method TEXT,
        reference TEXT,
        notes TEXT,
        paid_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        merchant_id INTEGER,
        agreement_id INTEGER,
        title TEXT NOT NULL,
        message TEXT,
        read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    `);
    // Add primary_product_id to categories (safe — only if missing)
    const catInfo = await db.execute({ sql: 'PRAGMA table_info(categories)', args: [] });
    const catCols = catInfo.rows.map((c: any) => String(c.name));
    if (!catCols.includes('primary_product_id')) {
      await db.execute({ sql: 'ALTER TABLE categories ADD COLUMN primary_product_id TEXT', args: [] });
    }
    // Add merchant_id to products (safe — only if missing)
    const info = await db.execute({ sql: 'PRAGMA table_info(products)', args: [] });
    const has = info.rows.some((r: any) => r.name === 'merchant_id');
    if (!has) {
      await db.execute({ sql: 'ALTER TABLE products ADD COLUMN merchant_id INTEGER', args: [] });
    }
    // Add attribution columns to contact_events (safe — only if missing)
    const evInfo = await db.execute({ sql: 'PRAGMA table_info(contact_events)', args: [] });
    if (!evInfo.rows.some((r: any) => r.name === 'product_slug')) {
      await db.execute({ sql: 'ALTER TABLE contact_events ADD COLUMN product_slug TEXT', args: [] });
    }
    if (!evInfo.rows.some((r: any) => r.name === 'merchant_id')) {
      await db.execute({ sql: 'ALTER TABLE contact_events ADD COLUMN merchant_id INTEGER', args: [] });
    }
    if (!evInfo.rows.some((r: any) => r.name === 'agreement_id')) {
      await db.execute({ sql: 'ALTER TABLE contact_events ADD COLUMN agreement_id INTEGER', args: [] });
    }
    await db.executeMultiple(`
      CREATE INDEX IF NOT EXISTS idx_contact_events_product ON contact_events(product_slug);
      CREATE INDEX IF NOT EXISTS idx_contact_events_merchant ON contact_events(merchant_id);
      CREATE INDEX IF NOT EXISTS idx_contact_events_agreement ON contact_events(agreement_id);
    `);
  } catch {
    // Ignore — best effort
  }
}

// ─── Website traffic analytics schema (runs every time) ───
async function migrateAnalyticsSchema() {
  try {
    const db = getDb();
    await db.executeMultiple(`
      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        page_url TEXT NOT NULL,
        page_title TEXT,
        device_type TEXT NOT NULL DEFAULT 'unknown',
        referrer TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        is_new_session INTEGER NOT NULL DEFAULT 0,
        duration_seconds INTEGER,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON page_views(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
      CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
      CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(page_url);
      CREATE INDEX IF NOT EXISTS idx_page_views_device ON page_views(device_type);
    `);
  } catch {
    // Ignore — best effort
  }
}

// ─── Default contact icon definitions (seeded on first run) ───
// key = stable frontend identifier. The frontend components look up their
// number by this key; falling back to the site.ts value if missing/inactive.
const DEFAULT_CONTACTS = [
  { key: 'header_whatsapp', name_ar: 'واتساب الهيدر', name_en: 'Header WhatsApp', type: 'whatsapp', location_ar: 'شريط الموقع الأعلى', location_en: 'Website Header', fallback: () => staticContact.whatsapp },
  { key: 'header_phone', name_ar: 'هاتف الهيدر', name_en: 'Header Phone', type: 'phone', location_ar: 'شريط الموقع الأعلى', location_en: 'Website Header', fallback: () => staticContact.phone },
  { key: 'footer_whatsapp', name_ar: 'واتساب الفوتر', name_en: 'Footer WhatsApp', type: 'whatsapp', location_ar: 'تذييل الموقع', location_en: 'Website Footer', fallback: () => staticContact.whatsapp },
  { key: 'footer_phone', name_ar: 'هاتف الفوتر', name_en: 'Footer Phone', type: 'phone', location_ar: 'تذييل الموقع', location_en: 'Website Footer', fallback: () => staticContact.phone },
  { key: 'floating_whatsapp', name_ar: 'واتساب الزر العائم', name_en: 'Floating WhatsApp', type: 'whatsapp', location_ar: 'الزر العائم أسفل الشاشة', location_en: 'Floating contact button', fallback: () => staticContact.whatsapp },
  { key: 'floating_phone', name_ar: 'هاتف الزر العائم', name_en: 'Floating Phone', type: 'phone', location_ar: 'الزر العائم أسفل الشاشة', location_en: 'Floating contact button', fallback: () => staticContact.phone },
  { key: 'product_whatsapp', name_ar: 'واتساب بطاقة المنتج', name_en: 'Product Card WhatsApp', type: 'whatsapp', location_ar: 'بطاقات المنتجات', location_en: 'Product cards', fallback: () => staticContact.whatsapp },
  { key: 'product_phone', name_ar: 'هاتف بطاقة المنتج', name_en: 'Product Card Phone', type: 'phone', location_ar: 'بطاقات المنتجات', location_en: 'Product cards', fallback: () => staticContact.phone },
  { key: 'product_detail_whatsapp', name_ar: 'واتساب صفحة المنتج', name_en: 'Product Page WhatsApp', type: 'whatsapp', location_ar: 'صفحة تفاصيل المنتج', location_en: 'Product detail page', fallback: () => staticContact.whatsapp },
  { key: 'product_detail_phone', name_ar: 'هاتف صفحة المنتج', name_en: 'Product Page Phone', type: 'phone', location_ar: 'صفحة تفاصيل المنتج', location_en: 'Product detail page', fallback: () => staticContact.phone },
  { key: 'contact_page_whatsapp', name_ar: 'واتساب صفحة التواصل', name_en: 'Contact Page WhatsApp', type: 'whatsapp', location_ar: 'صفحة تواصل معنا', location_en: 'Contact page', fallback: () => staticContact.whatsapp },
  { key: 'contact_page_phone', name_ar: 'هاتف صفحة التواصل', name_en: 'Contact Page Phone', type: 'phone', location_ar: 'صفحة تواصل معنا', location_en: 'Contact page', fallback: () => staticContact.phone },
  { key: 'home_whatsapp', name_ar: 'واتساب الصفحة الرئيسية', name_en: 'Homepage WhatsApp', type: 'whatsapp', location_ar: 'الصفحة الرئيسية', location_en: 'Homepage', fallback: () => staticContact.whatsapp },
  { key: 'home_phone', name_ar: 'هاتف الصفحة الرئيسية', name_en: 'Homepage Phone', type: 'phone', location_ar: 'الصفحة الرئيسية', location_en: 'Homepage', fallback: () => staticContact.phone },
  { key: 'about_whatsapp', name_ar: 'واتساب صفحة من نحن', name_en: 'About Page WhatsApp', type: 'whatsapp', location_ar: 'صفحة من نحن', location_en: 'About page', fallback: () => staticContact.whatsapp },
  { key: 'about_phone', name_ar: 'هاتف صفحة من نحن', name_en: 'About Page Phone', type: 'phone', location_ar: 'صفحة من نحن', location_en: 'About page', fallback: () => staticContact.phone },
  { key: 'solutions_whatsapp', name_ar: 'واتساب صفحة الحلول', name_en: 'Solutions Page WhatsApp', type: 'whatsapp', location_ar: 'صفحة الحلول', location_en: 'Solutions page', fallback: () => staticContact.whatsapp },
  { key: 'solutions_phone', name_ar: 'هاتف صفحة الحلول', name_en: 'Solutions Page Phone', type: 'phone', location_ar: 'صفحة الحلول', location_en: 'Solutions page', fallback: () => staticContact.phone },
];

async function seedContacts() {
  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM contacts', args: [] });
  if (Number(existing.rows[0]?.n ?? 0) > 0) return;
  const now = new Date().toISOString();
  for (const c of DEFAULT_CONTACTS) {
    await db.execute({
      sql: `INSERT INTO contacts (key, name_ar, name_en, type, number, location_ar, location_en, active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      args: [c.key, c.name_ar, c.name_en, c.type, c.fallback(), c.location_ar, c.location_en, now, now],
    });
  }
}

// ─── Row → App types ───

import type { Product, Category } from '@/data/site';

function rowToProduct(r: any): Product {
  return {
    slug: r.slug, sku: r.sku ?? undefined,
    name: { ar: r.name_ar, en: r.name_en }, category: r.category_id,
    description: { ar: r.description_ar ?? '', en: r.description_en ?? '' },
    material: { ar: r.material_ar ?? '', en: r.material_en ?? '' },
    color: { ar: r.color_ar ?? '', en: r.color_en ?? '' },
    dimensions: r.dimensions_ar ? { ar: r.dimensions_ar, en: r.dimensions_en } : undefined,
    price: r.price != null ? { amount: r.price, currency: 'SAR' } : undefined,
    unit: r.unit_ar ? { ar: r.unit_ar, en: r.unit_en } : undefined,
    images: JSON.parse(r.images), featured: !!r.featured, createdAt: r.created_at,
    specs: JSON.parse(r.specs), variations: JSON.parse(r.variations ?? '[]'),
    useCases: JSON.parse(r.use_cases ?? '[]'),
    published: !!r.published,
    seoTitle: r.seo_title ?? undefined, seoDescription: r.seo_description ?? undefined,
    merchantId: r.merchant_id != null ? Number(r.merchant_id) : undefined,
  };
}

function rowToCategory(r: any): Category {
  return {
    id: r.id, name: { ar: r.name_ar, en: r.name_en },
    description: { ar: r.description_ar ?? '', en: r.description_en ?? '' },
    image: r.image,
    primaryProductId: r.primary_product_id ?? undefined,
  };
}

function rowToTestimonial(r: any): any {
  return {
    id: r.id, name: r.name, role: r.role, quote: r.quote,
    rating: r.rating, status: r.status, createdAt: r.created_at,
  };
}

// ─── Products ───

export async function getProducts(): Promise<Product[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute('SELECT * FROM products WHERE published = 1 ORDER BY created_at DESC');
  return result.rows.map(rowToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM products WHERE slug = ?', args: [slug] });
  return result.rows[0] ? rowToProduct(result.rows[0]) : undefined;
}

export async function getAllProducts(): Promise<Product[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
  return result.rows.map(rowToProduct);
}

// ─── Categories ───

export async function getCategories(): Promise<Category[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute('SELECT * FROM categories');
  return result.rows.map(rowToCategory);
}

// ─── Settings ───

export async function getSettings(): Promise<Record<string, string>> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute('SELECT key, value FROM settings');
  return Object.fromEntries(result.rows.map((r) => [r.key as string, r.value as string]));
}

export async function saveSettings(settings: Record<string, string>) {
  await ensureSchema();
  const db = getDb();
  for (const [k, v] of Object.entries(settings)) {
    await db.execute({
      sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      args: [k, v],
    });
  }
}

// ─── Testimonials ───

export async function createTestimonial(input: {
  name: string; role: string; quote: string; rating: number;
}): Promise<any> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `INSERT INTO testimonials (name, role, quote, rating, status, created_at)
          VALUES (?, ?, ?, ?, 'pending', ?)`,
    args: [input.name, input.role, input.quote, input.rating, now],
  });
  const id = Number(result.lastInsertRowid);
  const row = await db.execute({ sql: 'SELECT * FROM testimonials WHERE id = ?', args: [id] });
  return rowToTestimonial(row.rows[0]);
}

export async function getApprovedTestimonials(): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM testimonials WHERE status = 'approved' ORDER BY created_at DESC",
  );
  return result.rows.map(rowToTestimonial);
}

export async function getAllTestimonials(): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute('SELECT * FROM testimonials ORDER BY created_at DESC');
  return result.rows.map(rowToTestimonial);
}

export async function setTestimonialStatus(id: number, status: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: 'UPDATE testimonials SET status = ? WHERE id = ?', args: [status, id] });
}

export async function deleteTestimonial(id: number) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM testimonials WHERE id = ?', args: [id] });
}

// ─── Content sections ───

export async function getContentSection(section: string): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM content_sections WHERE section = ? ORDER BY sort_order, id',
    args: [section],
  });
  return result.rows.map((r) => ({
    item_id: r.item_id, data: JSON.parse(r.data as string),
    sort_order: r.sort_order, published: !!r.published,
  }));
}

export async function upsertContentItem(section: string, item_id: string, data: any, sort_order = 0) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO content_sections (section, item_id, data, sort_order, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(section, item_id) DO UPDATE SET data = excluded.data, sort_order = excluded.sort_order`,
    args: [section, item_id, JSON.stringify(data), sort_order, new Date().toISOString()],
  });
}

export async function deleteContentItem(section: string, item_id: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM content_sections WHERE section = ? AND item_id = ?',
    args: [section, item_id],
  });
}

export async function setContentPublished(section: string, item_id: string, published: boolean) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE content_sections SET published = ? WHERE section = ? AND item_id = ?',
    args: [published ? 1 : 0, section, item_id],
  });
}

// ─── Admin users ───

export async function getAdminUser(username: string): Promise<any> {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM admin_users WHERE username = ?',
    args: [username],
  });
  return result.rows[0] ?? null;
}

export async function createAdminUser(username: string, passwordHash: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)',
    args: [username, passwordHash, new Date().toISOString()],
  });
}

export async function updateAdminPassword(username: string, passwordHash: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: 'UPDATE admin_users SET password_hash = ? WHERE username = ?',
    args: [passwordHash, username],
  });
}

// ─── Products CRUD ───

export async function createProduct(p: Product) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO products
            (slug, sku, name_ar, name_en, category_id, description_ar, description_en,
             material_ar, material_en, color_ar, color_en, dimensions_ar, dimensions_en,
             price, unit_ar, unit_en, images, featured, created_at, specs, variations, use_cases, published,
             seo_title, seo_description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      p.slug, p.sku ?? null, p.name.ar, p.name.en, p.category,
      p.description.ar, p.description.en, p.material.ar, p.material.en,
      p.color.ar, p.color.en, p.dimensions?.ar ?? null, p.dimensions?.en ?? null,
      p.price?.amount ?? null, p.unit?.ar ?? null, p.unit?.en ?? null,
      JSON.stringify(p.images), p.featured ? 1 : 0, p.createdAt,
      JSON.stringify(p.specs), JSON.stringify(p.variations ?? []),
      JSON.stringify(p.useCases), 1,
      p.seoTitle ?? null, p.seoDescription ?? null,
    ],
  });
}

export async function updateProduct(slug: string, updates: Partial<Product>) {
  await ensureSchema();
  const db = getDb();
  const fields: string[] = [];
  const args: any[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;

    // Bilingual fields map to two columns (name_ar / name_en, etc.)
    if (key === 'name') {
      const v = value as { ar: string; en: string };
      fields.push('name_ar = ?', 'name_en = ?');
      args.push(v.ar, v.en);
    } else if (key === 'description') {
      const v = value as { ar: string; en: string };
      fields.push('description_ar = ?', 'description_en = ?');
      args.push(v.ar, v.en);
    } else if (key === 'material') {
      const v = value as { ar: string; en: string };
      fields.push('material_ar = ?', 'material_en = ?');
      args.push(v.ar, v.en);
    } else if (key === 'color') {
      const v = value as { ar: string; en: string };
      fields.push('color_ar = ?', 'color_en = ?');
      args.push(v.ar, v.en);
    } else if (key === 'dimensions') {
      const v = value as { ar: string; en: string };
      fields.push('dimensions_ar = ?', 'dimensions_en = ?');
      args.push(v.ar, v.en);
    } else if (key === 'unit') {
      const v = value as { ar: string; en: string };
      fields.push('unit_ar = ?', 'unit_en = ?');
      args.push(v.ar, v.en);
    } else {
      // Single-column fields: camelCase → snake_case
      const dbCol = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${dbCol} = ?`);
      if (key === 'specs' || key === 'variations' || key === 'useCases' || key === 'images') {
        args.push(JSON.stringify(value));
      } else if (key === 'featured' || key === 'published') {
        args.push(value ? 1 : 0);
      } else if (key === 'price') {
        // Never let a {amount} object or garbage string reach the price column
        const raw = value as any;
        const n = typeof raw === 'object' && raw?.amount != null ? Number(raw.amount) : Number(raw);
        args.push(value == null || !Number.isFinite(n) ? null : Math.round(n));
      } else {
        args.push(value);
      }
    }
  }

  if (fields.length === 0) return;
  args.push(slug);
  await db.execute({ sql: `UPDATE products SET ${fields.join(', ')} WHERE slug = ?`, args });
}

export async function deleteProduct(slug: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM products WHERE slug = ?', args: [slug] });
}

// Update ONLY the images column — used by the admin image manager so it
// can never accidentally wipe other product fields.
export async function updateProductImages(slug: string, images: string[]) {
  await ensureSchema();
  const db = getDb();
  const existing = await db.execute({ sql: 'SELECT id FROM products WHERE slug = ?', args: [slug] });
  if (existing.rows.length === 0) return false;
  await db.execute({
    sql: 'UPDATE products SET images = ? WHERE slug = ?',
    args: [JSON.stringify(images), slug],
  });
  return true;
}

// ─── Categories CRUD ───

export async function createCategory(c: Category) {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO categories (id, name_ar, name_en, description_ar, description_en, image)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [c.id, c.name.ar, c.name.en, c.description.ar, c.description.en, c.image],
  });
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  await ensureSchema();
  const db = getDb();
  const fields: string[] = [];
  const args: any[] = [];
  if (updates.name) {
    fields.push('name_ar = ?', 'name_en = ?');
    args.push(updates.name.ar, updates.name.en);
  }
  if (updates.description) {
    fields.push('description_ar = ?', 'description_en = ?');
    args.push(updates.description.ar, updates.description.en);
  }
  if (updates.image) {
    fields.push('image = ?');
    args.push(updates.image);
  }
  if (updates.primaryProductId !== undefined) {
    fields.push('primary_product_id = ?');
    args.push(updates.primaryProductId);
  }
  if (fields.length === 0) return;
  args.push(id);
  await db.execute({ sql: `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, args });
}

export async function deleteCategory(id: string) {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM categories WHERE id = ?', args: [id] });
}

// ─── Contact click tracking ───

export interface ContactEvent {
  id: number;
  type: 'whatsapp' | 'phone';
  contact: string;
  contactKey: string | null;
  pageUrl: string;
  pageTitle: string | null;
  sessionId: string | null;
  createdAt: string;
}

export async function recordContactEvent(e: {
  type: 'whatsapp' | 'phone';
  contact: string;
  contactKey?: string;
  pageUrl: string;
  pageTitle?: string;
  sessionId?: string;
  deviceType?: string;
  productSlug?: string;
}): Promise<void> {
  await ensureSchema();
  const db = getDb();

  // ─── Attribute the click to a product → merchant → active agreement ───
  let merchantId: number | null = null;
  let agreementId: number | null = null;
  let productSlug: string | null = e.productSlug ?? null;

  // If the caller didn't pass a product slug, try to infer it from the
  // page URL (product pages are /products/<slug>).
  if (!productSlug && e.pageUrl) {
    const m = e.pageUrl.match(/\/products\/([a-z0-9-]+)/i);
    if (m) productSlug = m[1];
  }

  if (productSlug) {
    const prod = await db.execute({ sql: 'SELECT merchant_id FROM products WHERE slug = ?', args: [productSlug] });
    const mid = prod.rows[0]?.merchant_id;
    if (mid != null) {
      merchantId = Number(mid);
      // Find the active agreement for this merchant (most recent start).
      // Every click is attributed to the CURRENT active agreement so that
      // historical agreements and their invoices never change.
      const ag = await db.execute({
        sql: `SELECT id FROM agreements
          WHERE merchant_id = ? AND status = 'active'
          ORDER BY start_date DESC, id DESC LIMIT 1`,
        args: [merchantId],
      });
      if (ag.rows[0]?.id != null) agreementId = Number(ag.rows[0].id);
    }
  }

  await db.execute({
    sql: `INSERT INTO contact_events
      (type, contact, contact_key, page_url, page_title, session_id, device_type, product_slug, merchant_id, agreement_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      e.type,
      e.contact,
      e.contactKey ?? null,
      e.pageUrl,
      e.pageTitle ?? null,
      e.sessionId ?? null,
      e.deviceType ?? null,
      productSlug,
      merchantId,
      agreementId,
      new Date().toISOString(),
    ],
  });

  // ─── Threshold notification: fire ONCE when an agreement is first reached ───
  // NEVER stops tracking or disables buttons — the click above is already saved.
  if (agreementId != null) {
    await checkAgreementThreshold(agreementId);
  }
}

/**
 * Check whether an agreement has just reached its agreed click limit and,
 * if so, record ONE dashboard notification. Idempotent: it never creates a
 * second notification for the same agreement (the click count only grows).
 */
async function checkAgreementThreshold(agreementId: number): Promise<void> {
  const db = getDb();
  // Total billable clicks attributed to this agreement
  const counted = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM contact_events WHERE agreement_id = ?',
    args: [agreementId],
  });
  const total = Number(counted.rows[0]?.n ?? 0);

  const ag = await db.execute({
    sql: 'SELECT id, merchant_id, agreed_clicks, status FROM agreements WHERE id = ?',
    args: [agreementId],
  });
  const row = ag.rows[0] as any;
  if (!row) return;
  const agreed = Number(row.agreed_clicks);
  if (total < agreed) return; // not reached yet

  // Already notified? → do nothing (no duplicate notification)
  const existing = await db.execute({
    sql: 'SELECT id FROM notifications WHERE agreement_id = ? AND type = ? LIMIT 1',
    args: [agreementId, 'threshold'],
  });
  if (existing.rows.length > 0) return;

  const merchant = await db.execute({ sql: 'SELECT name FROM merchants WHERE id = ?', args: [row.merchant_id] });
  const merchantName = String(merchant.rows[0]?.name ?? '—');

  await db.execute({
    sql: 'INSERT INTO notifications (type, merchant_id, agreement_id, title, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [
      'threshold',
      row.merchant_id,
      agreementId,
      `اتفاقية ${merchantName} وصلت للحد المتفق عليه`,
      `الضغطات المتفق عليها: ${agreed} · الضغطات الفعلية: ${total} · الإضافية: ${Math.max(0, total - agreed)}. التتبع مستمر — راجع الاتفاقية في لوحة التحكم.`,
      new Date().toISOString(),
    ],
  });
}

/** Date range helper — returns [fromISO, toISO) bounds for a preset. */
export function rangeBounds(range: string, from?: string, to?: string): { from: string; to: string } {
  const now = new Date();
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };

  switch (range) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = daysAgo(1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case '7d':
      return { from: startOfDay(daysAgo(6)), to: endOfDay(now) };
    case '30d':
      return { from: startOfDay(daysAgo(29)), to: endOfDay(now) };
    case 'month': {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(m), to: endOfDay(now) };
    }
    case 'custom':
      return { from: from ? startOfDay(new Date(from)) : startOfDay(daysAgo(29)), to: to ? endOfDay(new Date(to)) : endOfDay(now) };
    default:
      return { from: startOfDay(daysAgo(29)), to: endOfDay(now) };
  }
}

/** Bounds of the period immediately BEFORE the current one (same length). */
function previousPeriodBounds(range: string, from?: string, to?: string): { from: string; to: string } {
  const b = rangeBounds(range, from, to);
  const startMs = new Date(b.from).getTime();
  const endMs = new Date(b.to).getTime();
  const len = endMs - startMs + 1; // inclusive length in ms
  return { from: new Date(startMs - len).toISOString(), to: new Date(startMs - 1).toISOString() };
}

/** Overview counters for the analytics dashboard (server-side aggregation). */
export async function getContactStats(range = '30d', from?: string, to?: string) {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);

  // Previous equivalent period for period-over-period comparison
  const prev = previousPeriodBounds(range, from, to);

  const [totals, uniqueContacts, mostClicked, mostEngagedPage, prevTotals, prevUnique] = await Promise.all([
    db.execute({
      sql: `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN type='whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type='phone' THEN 1 ELSE 0 END) AS phone
      FROM contact_events WHERE created_at BETWEEN ? AND ?`,
      args: [b.from, b.to],
    }),
    db.execute({
      sql: 'SELECT COUNT(DISTINCT contact) AS n FROM contact_events WHERE created_at BETWEEN ? AND ?',
      args: [b.from, b.to],
    }),
    db.execute({
      sql: 'SELECT contact, type, COUNT(*) AS clicks FROM contact_events WHERE created_at BETWEEN ? AND ? GROUP BY contact, type ORDER BY clicks DESC LIMIT 1',
      args: [b.from, b.to],
    }),
    db.execute({
      sql: 'SELECT page_url, COUNT(*) AS clicks FROM contact_events WHERE created_at BETWEEN ? AND ? GROUP BY page_url ORDER BY clicks DESC LIMIT 1',
      args: [b.from, b.to],
    }),
    db.execute({
      sql: `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN type='whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type='phone' THEN 1 ELSE 0 END) AS phone
      FROM contact_events WHERE created_at BETWEEN ? AND ?`,
      args: [prev.from, prev.to],
    }),
    db.execute({
      sql: 'SELECT COUNT(DISTINCT contact) AS n FROM contact_events WHERE created_at BETWEEN ? AND ?',
      args: [prev.from, prev.to],
    }),
  ]);

  const t = totals.rows[0] as any;
  const pt = prevTotals.rows[0] as any;

  const pct = (curr: number, prevN: number): number | null => {
    if (!prevN) return null; // no baseline → can't compute a meaningful %
    return Math.round(((curr - prevN) / prevN) * 100);
  };

  return {
    total: Number(t?.total ?? 0),
    whatsapp: Number(t?.whatsapp ?? 0),
    phone: Number(t?.phone ?? 0),
    uniqueContacts: Number(uniqueContacts.rows[0]?.n ?? 0),
    mostClicked: mostClicked.rows[0] ? { contact: String(mostClicked.rows[0].contact), type: String(mostClicked.rows[0].type), clicks: Number(mostClicked.rows[0].clicks) } : null,
    mostEngagedPage: mostEngagedPage.rows[0] ? { url: String(mostEngagedPage.rows[0].page_url), clicks: Number(mostEngagedPage.rows[0].clicks) } : null,
    from: b.from,
    to: b.to,
    // Previous equivalent period — null when there's no baseline to compare against
    prev: {
      total: Number(pt?.total ?? 0),
      whatsapp: Number(pt?.whatsapp ?? 0),
      phone: Number(pt?.phone ?? 0),
      uniqueContacts: Number(prevUnique.rows[0]?.n ?? 0),
      totalPct: pct(Number(t?.total ?? 0), Number(pt?.total ?? 0)),
      whatsappPct: pct(Number(t?.whatsapp ?? 0), Number(pt?.whatsapp ?? 0)),
      phonePct: pct(Number(t?.phone ?? 0), Number(pt?.phone ?? 0)),
      uniqueContactsPct: pct(Number(uniqueContacts.rows[0]?.n ?? 0), Number(prevUnique.rows[0]?.n ?? 0)),
    },
  };
}

/** Per-contact-number analytics with time-window breakdowns. */
export async function getContactByNumber(range = '30d', from?: string, to?: string) {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(daysAgo(1));
  const yesterdayEnd = startOfDay(now); // up to start of today
  const d7Start = startOfDay(daysAgo(6));
  const d30Start = startOfDay(daysAgo(29));

  const rows = await db.execute({
    sql: `SELECT
      contact, type,
      COUNT(*) AS total,
      SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS today,
      SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS yesterday,
      SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last7,
      SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last30,
      MIN(created_at) AS first_clicked,
      MAX(created_at) AS last_clicked
    FROM contact_events
    WHERE created_at BETWEEN ? AND ?
    GROUP BY contact, type
    ORDER BY total DESC`,
    args: [todayStart, yesterdayStart, yesterdayEnd, d7Start, d30Start, b.from, b.to],
  });

  // All-time totals (ignoring the selected range) — one row per contact+type
  const allTimeRows = await db.execute({
    sql: `SELECT contact, type, COUNT(*) AS all_time, MIN(created_at) AS first_clicked
      FROM contact_events GROUP BY contact, type`,
    args: [],
  });
  const allTimeMap: Record<string, number> = {};
  const firstClickMap: Record<string, string> = {};
  for (const r of allTimeRows.rows) {
    const k = String(r.contact) + '|' + String(r.type);
    allTimeMap[k] = Number(r.all_time);
    firstClickMap[k] = r.first_clicked ? String(r.first_clicked) : '';
  }

  // Pages per contact
  const pageRows = await db.execute({
    sql: 'SELECT contact, page_url, COUNT(*) AS n FROM contact_events WHERE created_at BETWEEN ? AND ? GROUP BY contact, page_url',
    args: [b.from, b.to],
  });
  const pagesByContact: Record<string, { url: string; clicks: number }[]> = {};
  for (const r of pageRows.rows) {
    const c = String(r.contact);
    (pagesByContact[c] ||= []).push({ url: String(r.page_url), clicks: Number(r.n) });
  }

  return rows.rows.map((r: any) => {
    const k = String(r.contact) + '|' + String(r.type);
    return {
      contact: String(r.contact),
      type: String(r.type),
      total: Number(r.total),
      today: Number(r.today),
      yesterday: Number(r.yesterday),
      last7: Number(r.last7),
      last30: Number(r.last30),
      allTime: allTimeMap[k] ?? Number(r.total),
      firstClicked: r.first_clicked ? String(r.first_clicked) : (firstClickMap[k] || null),
      lastClicked: r.last_clicked ? String(r.last_clicked) : null,
      pages: (pagesByContact[String(r.contact)] ?? []).sort((a, c) => c.clicks - a.clicks),
    };
  });
}

/** Per-page analytics. */
export async function getContactByPage(range = '30d', from?: string, to?: string) {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);

  const [rows, topPerPage] = await Promise.all([
    db.execute({
      sql: `SELECT page_url, MAX(page_title) AS page_title,
        SUM(CASE WHEN type='whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type='phone' THEN 1 ELSE 0 END) AS phone,
        COUNT(*) AS total, MAX(created_at) AS last_interaction
      FROM contact_events WHERE created_at BETWEEN ? AND ?
      GROUP BY page_url ORDER BY total DESC`,
      args: [b.from, b.to],
    }),
    db.execute({
      sql: `SELECT page_url, contact, COUNT(*) AS n FROM contact_events WHERE created_at BETWEEN ? AND ?
      GROUP BY page_url, contact ORDER BY n DESC`,
      args: [b.from, b.to],
    }),
  ]);
  const topByPage: Record<string, { contact: string; clicks: number }> = {};
  for (const r of topPerPage.rows) {
    const u = String(r.page_url);
    if (!topByPage[u]) topByPage[u] = { contact: String(r.contact), clicks: Number(r.n) };
  }

  return rows.rows.map((r: any) => ({
    url: String(r.page_url),
    title: r.page_title ? String(r.page_title) : null,
    whatsapp: Number(r.whatsapp),
    phone: Number(r.phone),
    total: Number(r.total),
    lastInteraction: r.last_interaction ? String(r.last_interaction) : null,
    topContact: topByPage[String(r.page_url)] ?? null,
  }));
}

/** Per-contact-icon analytics (single key). Returns contact info + stats + history. */
export async function getContactAnalyticsByKey(
  key: string,
  range = '30d',
  from?: string,
  to?: string,
  limit = 50,
  offset = 0,
) {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);

  const cfgRes = await db.execute({ sql: 'SELECT * FROM contacts WHERE key = ?', args: [key] });
  const cfg = cfgRes.rows[0] ? rowToContact(cfgRes.rows[0]) : null;

  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
  const daysAgo = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(daysAgo(1));
  const yesterdayEnd = startOfDay(now);
  const d7Start = startOfDay(daysAgo(6));
  const d30Start = startOfDay(daysAgo(29));

  const [agg, allTimeRow, uniqueRow] = await Promise.all([
    db.execute({
      sql: `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN type='whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type='phone' THEN 1 ELSE 0 END) AS phone,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS today,
        SUM(CASE WHEN created_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS yesterday,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last7,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS last30,
        MIN(created_at) AS first_clicked,
        MAX(created_at) AS last_clicked
      FROM contact_events WHERE contact_key = ? AND created_at BETWEEN ? AND ?`,
      args: [todayStart, yesterdayStart, yesterdayEnd, d7Start, d30Start, key, b.from, b.to],
    }),
    db.execute({
      sql: 'SELECT COUNT(*) AS n, MIN(created_at) AS first FROM contact_events WHERE contact_key = ?',
      args: [key],
    }),
    db.execute({
      sql: 'SELECT COUNT(DISTINCT session_id) AS n FROM contact_events WHERE contact_key = ? AND created_at BETWEEN ? AND ?',
      args: [key, b.from, b.to],
    }),
  ]);

  const a = agg.rows[0] as any;
  const at = allTimeRow.rows[0] as any;

  const pageRows = await db.execute({
    sql: 'SELECT page_url, MAX(page_title) AS page_title, COUNT(*) AS n FROM contact_events WHERE contact_key = ? AND created_at BETWEEN ? AND ? GROUP BY page_url ORDER BY n DESC',
    args: [key, b.from, b.to],
  });
  const pages = pageRows.rows.map((r: any) => ({
    url: String(r.page_url),
    title: r.page_title ? String(r.page_title) : null,
    clicks: Number(r.n),
  }));

  const seriesRows = await db.execute({
    sql: `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS n
      FROM contact_events WHERE contact_key = ? AND created_at BETWEEN ? AND ?
      GROUP BY day ORDER BY day ASC`,
    args: [key, b.from, b.to],
  });
  const series = seriesRows.rows.map((r: any) => ({ date: String(r.day), clicks: Number(r.n) }));

  const [histRows, countRow] = await Promise.all([
    db.execute({
      sql: `SELECT id, type, contact, page_url, page_title, session_id, device_type, product_slug, created_at
        FROM contact_events WHERE contact_key = ? AND created_at BETWEEN ? AND ?
        ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
      args: [key, b.from, b.to, limit, offset],
    }),
    db.execute({
      sql: 'SELECT COUNT(*) AS n FROM contact_events WHERE contact_key = ? AND created_at BETWEEN ? AND ?',
      args: [key, b.from, b.to],
    }),
  ]);
  const history = histRows.rows.map((r: any) => ({
    id: Number(r.id),
    type: String(r.type),
    contact: String(r.contact),
    pageUrl: String(r.page_url),
    pageTitle: r.page_title ? String(r.page_title) : null,
    sessionId: r.session_id ? String(r.session_id) : null,
    deviceType: r.device_type ? String(r.device_type) : null,
    productSlug: r.product_slug ? String(r.product_slug) : null,
    createdAt: String(r.created_at),
  }));

  return {
    contact: cfg,
    key,
    range: b,
    stats: {
      total: Number(a?.total ?? 0),
      whatsapp: Number(a?.whatsapp ?? 0),
      phone: Number(a?.phone ?? 0),
      today: Number(a?.today ?? 0),
      yesterday: Number(a?.yesterday ?? 0),
      last7: Number(a?.last7 ?? 0),
      last30: Number(a?.last30 ?? 0),
      allTime: Number(at?.n ?? 0),
      uniqueVisitors: Number(uniqueRow.rows[0]?.n ?? 0),
      firstClicked: a?.first_clicked ? String(a.first_clicked) : (at?.first ? String(at.first) : null),
      lastClicked: a?.last_clicked ? String(a.last_clicked) : null,
    },
    pages,
    series,
    history,
    historyTotal: Number(countRow.rows[0]?.n ?? 0),
  };
}

/** Time-series (daily) for charts: [{ date, whatsapp, phone }]. */
export async function getContactTimeSeries(range = '30d', from?: string, to?: string) {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT substr(created_at, 1, 10) AS day,
      SUM(CASE WHEN type='whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
      SUM(CASE WHEN type='phone' THEN 1 ELSE 0 END) AS phone,
      COUNT(*) AS total
    FROM contact_events WHERE created_at BETWEEN ? AND ?
    GROUP BY day ORDER BY day ASC`,
    args: [b.from, b.to],
  });
  return rows.rows.map((r: any) => ({
    date: String(r.day),
    whatsapp: Number(r.whatsapp),
    phone: Number(r.phone),
    total: Number(r.total),
  }));
}

/** Paginated raw events for the recent-activity table. */
export async function getRecentContactEvents(limit = 50, offset = 0) {
  await ensureSchema();
  const db = getDb();
  const [rows, countRow] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM contact_events ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?', args: [limit, offset] }),
    db.execute({ sql: 'SELECT COUNT(*) AS n FROM contact_events', args: [] }),
  ]);
  return { events: rows.rows.map((r: any) => ({ ...r })), total: Number(countRow.rows[0]?.n ?? 0) };
}

// ─── Contact icon configurations ───

export interface ContactConfig {
  key: string;
  name: { ar: string; en: string };
  type: 'whatsapp' | 'phone';
  number: string;
  location: { ar: string; en: string };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function rowToContact(r: any): ContactConfig {
  return {
    key: String(r.key),
    name: { ar: r.name_ar, en: r.name_en },
    type: r.type,
    number: String(r.number),
    location: { ar: r.location_ar, en: r.location_en },
    active: !!r.active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** All contact icon configs (admin view — includes inactive). */
export async function getAllContacts(): Promise<ContactConfig[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM contacts ORDER BY type, key', args: [] });
  return rows.rows.map(rowToContact);
}

/** Active contact configs as a key→number map (public view). */
export async function getActiveContactNumbers(): Promise<Record<string, { number: string; type: string }>> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT key, type, number FROM contacts WHERE active = 1', args: [] });
  const map: Record<string, { number: string; type: string }> = {};
  for (const r of rows.rows) {
    map[String(r.key)] = { number: String(r.number), type: String(r.type) };
  }
  return map;
}

/** Normalize a phone number: digits only (strip +, spaces, dashes, parens). */
function normalizeNumber(raw: string): string {
  return String(raw).replace(/[^\d]/g, '');
}

/** Update a single contact's number and/or active state (admin). */
export async function updateContact(
  key: string,
  updates: { number?: string; active?: boolean; nameAr?: string; nameEn?: string },
): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const fields: string[] = [];
  const args: any[] = [];
  if (updates.number !== undefined) {
    const num = normalizeNumber(updates.number);
    if (!num || num.length < 6) throw new Error('Invalid phone number');
    fields.push('number = ?');
    args.push(num);
  }
  if (updates.active !== undefined) {
    fields.push('active = ?');
    args.push(updates.active ? 1 : 0);
  }
  if (updates.nameAr !== undefined) { fields.push('name_ar = ?'); args.push(updates.nameAr); }
  if (updates.nameEn !== undefined) { fields.push('name_en = ?'); args.push(updates.nameEn); }
  if (fields.length === 0) return false;
  fields.push('updated_at = ?');
  args.push(new Date().toISOString());
  args.push(key);
  await db.execute({ sql: `UPDATE contacts SET ${fields.join(', ')} WHERE key = ?`, args });
  return true;
}

// ═══════════════════════════════════════════════════════════════
//  MERCHANTS · AGREEMENTS · BILLING
// ═══════════════════════════════════════════════════════════════

export interface Merchant {
  id: number;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function rowToMerchant(r: any): Merchant {
  return {
    id: Number(r.id),
    name: String(r.name),
    phone: r.phone ? String(r.phone) : null,
    whatsapp: r.whatsapp ? String(r.whatsapp) : null,
    notes: r.notes ? String(r.notes) : null,
    status: String(r.status),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** All merchants (admin view). */
export async function getAllMerchants(): Promise<Merchant[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM merchants ORDER BY created_at DESC', args: [] });
  return rows.rows.map(rowToMerchant);
}

/** Single merchant by id. */
export async function getMerchant(id: number): Promise<Merchant | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM merchants WHERE id = ?', args: [id] });
  return rows.rows[0] ? rowToMerchant(rows.rows[0]) : null;
}

/** Create a merchant. */
export async function createMerchant(m: { name: string; phone?: string; whatsapp?: string; notes?: string; status?: string }): Promise<number> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const res = await db.execute({
    sql: 'INSERT INTO merchants (name, phone, whatsapp, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [m.name, m.phone ?? null, m.whatsapp ?? null, m.notes ?? null, m.status ?? 'active', now, now],
  });
  return Number(res.lastInsertRowid);
}

/** Update a merchant. */
export async function updateMerchant(id: number, updates: Partial<{ name: string; phone: string; whatsapp: string; notes: string; status: string }>): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const fields: string[] = [];
  const args: any[] = [];
  for (const [k, col] of [['name', 'name'], ['phone', 'phone'], ['whatsapp', 'whatsapp'], ['notes', 'notes'], ['status', 'status']] as const) {
    if (updates[k] !== undefined) { fields.push(`${col} = ?`); args.push(updates[k]); }
  }
  if (fields.length === 0) return false;
  fields.push('updated_at = ?');
  args.push(new Date().toISOString());
  args.push(id);
  await db.execute({ sql: `UPDATE merchants SET ${fields.join(', ')} WHERE id = ?`, args });
  return true;
}

/** Archive (soft-delete) or delete a merchant. Products are unassigned, never deleted. */
export async function archiveMerchant(id: number): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  await db.execute({ sql: "UPDATE merchants SET status = 'archived', updated_at = ? WHERE id = ?", args: [now, id] });
  // Unassign its products so nothing is orphaned to an archived merchant
  await db.execute({ sql: 'UPDATE products SET merchant_id = NULL WHERE merchant_id = ?', args: [id] });
  return true;
}

/** Products assigned to a merchant. */
export async function getMerchantProducts(merchantId: number): Promise<{ slug: string; nameAr: string; nameEn: string }[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({
    sql: 'SELECT slug, name_ar, name_en FROM products WHERE merchant_id = ? ORDER BY slug',
    args: [merchantId],
  });
  return rows.rows.map((r: any) => ({ slug: String(r.slug), nameAr: String(r.name_ar), nameEn: String(r.name_en) }));
}

/** Assign a product to a merchant (or unassign with null). */
export async function assignProductMerchant(slug: string, merchantId: number | null): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const res = await db.execute({ sql: 'UPDATE products SET merchant_id = ? WHERE slug = ?', args: [merchantId, slug] });
  return res.rowsAffected > 0;
}

export interface Agreement {
  id: number;
  merchantId: number;
  name: string | null;
  startDate: string;
  endDate: string | null;
  agreedClicks: number;
  ratePerClick: number;
  additionalRate: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToAgreement(r: any): Agreement {
  return {
    id: Number(r.id),
    merchantId: Number(r.merchant_id),
    name: r.name ? String(r.name) : null,
    startDate: String(r.start_date),
    endDate: r.end_date ? String(r.end_date) : null,
    agreedClicks: Number(r.agreed_clicks),
    ratePerClick: Number(r.rate_per_click),
    additionalRate: r.additional_rate != null ? Number(r.additional_rate) : null,
    status: String(r.status),
    notes: r.notes ? String(r.notes) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** All agreements for a merchant (newest first). */
export async function getAgreements(merchantId: number): Promise<Agreement[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM agreements WHERE merchant_id = ? ORDER BY start_date DESC, id DESC', args: [merchantId] });
  return rows.rows.map(rowToAgreement);
}

/** Single agreement by id. */
export async function getAgreement(id: number): Promise<Agreement | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM agreements WHERE id = ?', args: [id] });
  return rows.rows[0] ? rowToAgreement(rows.rows[0]) : null;
}

/** Create an agreement. */
export async function createAgreement(a: {
  merchantId: number;
  name?: string;
  startDate: string;
  endDate?: string | null;
  agreedClicks: number;
  ratePerClick: number;
  additionalRate?: number | null;
  notes?: string;
}): Promise<number> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const res = await db.execute({
    sql: `INSERT INTO agreements
      (merchant_id, name, start_date, end_date, agreed_clicks, rate_per_click, additional_rate, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    args: [a.merchantId, a.name ?? null, a.startDate, a.endDate ?? null, a.agreedClicks, a.ratePerClick, a.additionalRate ?? null, a.notes ?? null, now, now],
  });
  return Number(res.lastInsertRowid);
}

/**
 * Extend an agreement by adding more agreed clicks (and optionally a new
 * rate for the extension). Records the change in the notes history.
 * NEVER touches historical invoices — only this agreement's terms.
 */
export async function extendAgreement(id: number, extraClicks: number, newRate?: number | null): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const ag = await getAgreement(id);
  if (!ag) return false;
  const history = `${ag.notes ?? ''}\n[${now}] تمديد: +${extraClicks} ضغطة${newRate != null ? ` · سعر جديد ${newRate} ر.س` : ''}`.trim();
  const nextRate = newRate != null ? newRate : ag.ratePerClick;
  await db.execute({
    sql: 'UPDATE agreements SET agreed_clicks = agreed_clicks + ?, rate_per_click = ?, notes = ?, updated_at = ? WHERE id = ?',
    args: [extraClicks, nextRate, history, now, id],
  });
  return true;
}

/** Close an agreement (keeps all history + clicks intact). */
export async function closeAgreement(id: number): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const ag = await getAgreement(id);
  if (!ag) return false;
  const history = `${ag.notes ?? ''}\n[${now}] تم إغلاق الاتفاقية`.trim();
  await db.execute({ sql: "UPDATE agreements SET status = 'closed', notes = ?, updated_at = ? WHERE id = ?", args: [history, now, id] });
  return true;
}

/**
 * Per-agreement billing breakdown (server-side truth):
 * agreed clicks, additional clicks (pending review / approved for billing),
 * and the calculated amounts. Pending additional clicks are NEVER priced
 * unless an additional_rate was agreed.
 */
export async function getAgreementBilling(agreementId: number): Promise<{
  agreedClicks: number;
  totalClicks: number;
  additionalClicks: number;
  agreedAmount: number;
  additionalAmount: number | null; // null = no rate agreed → needs review
  totalAmount: number | null;
  pendingReview: boolean;
}> {
  await ensureSchema();
  const db = getDb();
  const ag = await getAgreement(agreementId);
  if (!ag) throw new Error('Agreement not found');

  const counted = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM contact_events WHERE agreement_id = ?',
    args: [agreementId],
  });
  const total = Number(counted.rows[0]?.n ?? 0);
  const agreed = Math.min(total, ag.agreedClicks);
  const additional = Math.max(0, total - ag.agreedClicks);

  const agreedAmount = agreed * ag.ratePerClick;

  if (additional === 0) {
    return { agreedClicks: agreed, totalClicks: total, additionalClicks: 0, agreedAmount, additionalAmount: 0, totalAmount: agreedAmount, pendingReview: false };
  }

  if (ag.additionalRate != null) {
    const additionalAmount = additional * ag.additionalRate;
    return {
      agreedClicks: agreed, totalClicks: total, additionalClicks: additional,
      agreedAmount, additionalAmount, totalAmount: agreedAmount + additionalAmount, pendingReview: false,
    };
  }

  // No additional rate agreed → extra clicks recorded but flagged for review,
  // with NO invented price.
  return {
    agreedClicks: agreed, totalClicks: total, additionalClicks: additional,
    agreedAmount, additionalAmount: null, totalAmount: null, pendingReview: true,
  };
}

/** Click counts + financials per merchant (merchant comparison table). */
export async function getMerchantBillingSummary(): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const merchants = await getAllMerchants();
  const out: any[] = [];
  for (const m of merchants) {
    const products = await getMerchantProducts(m.id);
    const slugs = products.map((p) => p.slug);
    // Click totals for this merchant (all-time, attributed server-side)
    const clickRows = await db.execute({
      sql: `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN type='whatsapp' THEN 1 ELSE 0 END) AS whatsapp,
        SUM(CASE WHEN type='phone' THEN 1 ELSE 0 END) AS phone
      FROM contact_events WHERE merchant_id = ?`,
      args: [m.id],
    });
    const c = clickRows.rows[0] as any;
    // Financial rollup from invoices + payments
    const invRows = await db.execute({
      sql: `SELECT COALESCE(SUM(total),0) AS invoiced, COALESCE(SUM(amount_paid),0) AS paid FROM invoices WHERE merchant_id = ?`,
      args: [m.id],
    });
    const inv = invRows.rows[0] as any;
    // Active agreement limit
    const agRows = await db.execute({
      sql: `SELECT agreed_clicks FROM agreements WHERE merchant_id = ? AND status = 'active' ORDER BY start_date DESC, id DESC LIMIT 1`,
      args: [m.id],
    });
    const limit = agRows.rows[0] ? Number(agRows.rows[0].agreed_clicks) : null;
    const total = Number(c?.total ?? 0);
    out.push({
      merchantId: m.id,
      name: m.name,
      productCount: slugs.length,
      whatsappClicks: Number(c?.whatsapp ?? 0),
      phoneClicks: Number(c?.phone ?? 0),
      totalClicks: total,
      agreedLimit: limit,
      remainingClicks: limit != null ? Math.max(0, limit - total) : null,
      additionalClicks: limit != null ? Math.max(0, total - limit) : 0,
      invoiced: Number(inv?.invoiced ?? 0),
      paid: Number(inv?.paid ?? 0),
      balance: Number(inv?.invoiced ?? 0) - Number(inv?.paid ?? 0),
      limitReached: limit != null && total >= limit,
    });
  }
  return out;
}

// ─── Invoices & payments ───

export interface Invoice {
  id: number;
  invoiceNumber: string;
  merchantId: number;
  agreementId: number;
  issueDate: string;
  periodFrom: string | null;
  periodTo: string | null;
  agreedClicks: number;
  agreedRate: number;
  additionalClicks: number;
  additionalRate: number;
  totalClicks: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowToInvoice(r: any): Invoice {
  return {
    id: Number(r.id),
    invoiceNumber: String(r.invoice_number),
    merchantId: Number(r.merchant_id),
    agreementId: Number(r.agreement_id),
    issueDate: String(r.issue_date),
    periodFrom: r.period_from ? String(r.period_from) : null,
    periodTo: r.period_to ? String(r.period_to) : null,
    agreedClicks: Number(r.agreed_clicks),
    agreedRate: Number(r.agreed_rate),
    additionalClicks: Number(r.additional_clicks),
    additionalRate: Number(r.additional_rate),
    totalClicks: Number(r.total_clicks),
    subtotal: Number(r.subtotal),
    taxRate: Number(r.tax_rate),
    taxAmount: Number(r.tax_amount),
    total: Number(r.total),
    amountPaid: Number(r.amount_paid),
    status: String(r.status),
    notes: r.notes ? String(r.notes) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/** Generate a unique invoice number: INV-YYYYMMDD-<seq>. */
async function nextInvoiceNumber(db: any): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rows = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM invoices WHERE invoice_number LIKE ?`,
    args: [`INV-${today}-%`],
  });
  const seq = (Number(rows.rows[0]?.n ?? 0) + 1).toString().padStart(3, '0');
  return `INV-${today}-${seq}`;
}

/**
 * Create an invoice from an agreement's CURRENT billing state.
 * The invoice freezes the values at issue time — later agreement changes
 * never modify an issued invoice (historical integrity).
 */
export async function createInvoice(input: {
  merchantId: number;
  agreementId: number;
  issueDate?: string;
  periodFrom?: string | null;
  periodTo?: string | null;
  agreedClicks: number;
  agreedRate: number;
  additionalClicks: number;
  additionalRate: number;
  taxRate?: number;
  notes?: string;
}): Promise<number> {
  await ensureSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const invoiceNumber = await nextInvoiceNumber(db);
  const totalClicks = input.agreedClicks + input.additionalClicks;
  const subtotal = input.agreedClicks * input.agreedRate + input.additionalClicks * input.additionalRate;
  const taxRate = input.taxRate ?? 0;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + taxAmount;
  const res = await db.execute({
    sql: `INSERT INTO invoices
      (invoice_number, merchant_id, agreement_id, issue_date, period_from, period_to,
       agreed_clicks, agreed_rate, additional_clicks, additional_rate, total_clicks,
       subtotal, tax_rate, tax_amount, total, amount_paid, status, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'issued', ?, ?, ?)`,
    args: [
      invoiceNumber, input.merchantId, input.agreementId,
      input.issueDate ?? now.slice(0, 10),
      input.periodFrom ?? null, input.periodTo ?? null,
      input.agreedClicks, input.agreedRate, input.additionalClicks, input.additionalRate, totalClicks,
      subtotal, taxRate, taxAmount, total, input.notes ?? null, now, now,
    ],
  });
  return Number(res.lastInsertRowid);
}

/** All invoices (optionally filtered by merchant). */
export async function getInvoices(merchantId?: number): Promise<Invoice[]> {
  await ensureSchema();
  const db = getDb();
  const rows = merchantId != null
    ? await db.execute({ sql: 'SELECT * FROM invoices WHERE merchant_id = ? ORDER BY created_at DESC', args: [merchantId] })
    : await db.execute({ sql: 'SELECT * FROM invoices ORDER BY created_at DESC', args: [] });
  return rows.rows.map(rowToInvoice);
}

/** Single invoice by id. */
export async function getInvoice(id: number): Promise<Invoice | null> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
  return rows.rows[0] ? rowToInvoice(rows.rows[0]) : null;
}

/**
 * Record a payment against an invoice. Updates amount_paid + status
 * (issued → partially_paid → paid) atomically. Never deletes the invoice.
 */
export async function recordPayment(p: { invoiceId: number; amount: number; method?: string; reference?: string; notes?: string; paidAt?: string }): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  const inv = await getInvoice(p.invoiceId);
  if (!inv) return false;
  if (!Number.isFinite(p.amount) || p.amount <= 0) return false;

  const now = new Date().toISOString();
  await db.execute({
    sql: 'INSERT INTO payments (invoice_id, amount, method, reference, notes, paid_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [p.invoiceId, p.amount, p.method ?? null, p.reference ?? null, p.notes ?? null, p.paidAt ?? now, now],
  });

  const newPaid = inv.amountPaid + p.amount;
  const status = newPaid >= inv.total ? 'paid' : 'partially_paid';
  await db.execute({
    sql: "UPDATE invoices SET amount_paid = ?, status = ?, updated_at = ? WHERE id = ?",
    args: [newPaid, status, now, p.invoiceId],
  });
  return true;
}

/** Payments for an invoice (newest first). */
export async function getPayments(invoiceId: number): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC', args: [invoiceId] });
  return rows.rows.map((r: any) => ({ ...r }));
}

// ─── Notifications ───

/** Unread notification count (for the dashboard badge). */
export async function getUnreadNotificationCount(): Promise<number> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT COUNT(*) AS n FROM notifications WHERE read = 0', args: [] });
  return Number(rows.rows[0]?.n ?? 0);
}

/** All notifications (newest first, capped). */
export async function getNotifications(limit = 50): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const rows = await db.execute({ sql: 'SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?', args: [limit] });
  return rows.rows.map((r: any) => ({
    id: Number(r.id),
    type: String(r.type),
    merchantId: r.merchant_id != null ? Number(r.merchant_id) : null,
    agreementId: r.agreement_id != null ? Number(r.agreement_id) : null,
    title: String(r.title),
    message: r.message ? String(r.message) : null,
    read: Number(r.read),
    createdAt: String(r.created_at),
  }));
}

/** Mark a notification read. */
export async function markNotificationRead(id: number): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: 'UPDATE notifications SET read = 1 WHERE id = ?', args: [id] });
  return true;
}

/** Mark all notifications read. */
export async function markAllNotificationsRead(): Promise<boolean> {
  await ensureSchema();
  const db = getDb();
  await db.execute({ sql: 'UPDATE notifications SET read = 1 WHERE read = 0', args: [] });
  return true;
}


// ═══════════════════════════════════════════════════════════════
//  WEBSITE TRAFFIC ANALYTICS
// ═══════════════════════════════════════════════════════════════

/** Record a page view. */
export async function recordPageView(v: {
  visitorId: string;
  sessionId: string;
  pageUrl: string;
  pageTitle?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  isNewSession: boolean;
  durationSeconds?: number;
}): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO page_views
      (visitor_id, session_id, page_url, page_title, device_type, referrer, utm_source, utm_medium, utm_campaign, is_new_session, duration_seconds, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      v.visitorId, v.sessionId, v.pageUrl, v.pageTitle ?? null, v.deviceType,
      v.referrer ?? null, v.utmSource ?? null, v.utmMedium ?? null, v.utmCampaign ?? null,
      v.isNewSession ? 1 : 0, v.durationSeconds ?? null, new Date().toISOString(),
    ],
  });
}

export interface AnalyticsSummary {
  uniqueVisitors: number;
  totalSessions: number;
  totalPageViews: number;
  mobileVisitors: number;
  desktopVisitors: number;
  tabletVisitors: number;
  unknownVisitors: number;
  avgPagesPerSession: number;
  avgSessionDuration: number;
}

export interface TopPage {
  page_url: string;
  page_title: string | null;
  page_views: number;
  unique_visitors: number;
  sessions: number;
}

export interface DeviceStat {
  device_type: string;
  visitors: number;
  sessions: number;
  page_views: number;
  pct: number;
}

export interface SourceStat {
  source: string;
  visitors: number;
  sessions: number;
  page_views: number;
}

export interface TrafficSeriesPoint {
  date: string;
  visitors: number;
  sessions: number;
  page_views: number;
}

/** Aggregated traffic summary for the dashboard. */
export async function getTrafficSummary(range = '30d', from?: string, to?: string): Promise<AnalyticsSummary> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);

  const [totals, devices, sess] = await Promise.all([
    db.execute({
      sql: `SELECT
        COUNT(DISTINCT visitor_id) AS unique_visitors,
        COUNT(DISTINCT session_id) AS total_sessions,
        COUNT(*) AS total_page_views
      FROM page_views WHERE created_at BETWEEN ? AND ?`,
      args: [b.from, b.to],
    }),
    db.execute({
      sql: `SELECT device_type, COUNT(DISTINCT visitor_id) AS visitors
      FROM page_views WHERE created_at BETWEEN ? AND ? GROUP BY device_type`,
      args: [b.from, b.to],
    }),
    db.execute({
      sql: `SELECT AVG(cnt) AS avg_pages, AVG(COALESCE(dur, 0)) AS avg_duration
      FROM (
        SELECT session_id, COUNT(*) AS cnt, AVG(COALESCE(duration_seconds, 0)) AS dur
        FROM page_views WHERE created_at BETWEEN ? AND ?
        GROUP BY session_id
      )`,
      args: [b.from, b.to],
    }),
  ]);

  const t = totals.rows[0] as any;
  const s = sess.rows[0] as any;
  const devMap: Record<string, number> = {};
  for (const r of devices.rows) devMap[String(r.device_type)] = Number(r.visitors);

  return {
    uniqueVisitors: Number(t?.unique_visitors ?? 0),
    totalSessions: Number(t?.total_sessions ?? 0),
    totalPageViews: Number(t?.total_page_views ?? 0),
    mobileVisitors: devMap['mobile'] ?? 0,
    desktopVisitors: devMap['desktop'] ?? 0,
    tabletVisitors: devMap['tablet'] ?? 0,
    unknownVisitors: devMap['unknown'] ?? 0,
    avgPagesPerSession: Math.round((Number(s?.avg_pages ?? 0) + Number.EPSILON) * 10) / 10,
    avgSessionDuration: Math.round(Number(s?.avg_duration ?? 0)),
  };
}

/** Top pages report. */
export async function getTopPages(range = '30d', from?: string, to?: string, limit = 20): Promise<TopPage[]> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT page_url, MAX(page_title) AS page_title,
      COUNT(*) AS page_views,
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      COUNT(DISTINCT session_id) AS sessions
    FROM page_views WHERE created_at BETWEEN ? AND ?
    GROUP BY page_url ORDER BY page_views DESC LIMIT ?`,
    args: [b.from, b.to, limit],
  });
  return rows.rows.map((r: any) => ({
    page_url: String(r.page_url),
    page_title: r.page_title ? String(r.page_title) : null,
    page_views: Number(r.page_views),
    unique_visitors: Number(r.unique_visitors),
    sessions: Number(r.sessions),
  }));
}

/** Device breakdown with percentages. */
export async function getDeviceStats(range = '30d', from?: string, to?: string): Promise<DeviceStat[]> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT device_type,
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(DISTINCT session_id) AS sessions,
      COUNT(*) AS page_views
    FROM page_views WHERE created_at BETWEEN ? AND ? GROUP BY device_type`,
    args: [b.from, b.to],
  });
  const totalVisitors = rows.rows.reduce((s: number, r: any) => s + Number(r.visitors), 0) || 1;
  return rows.rows.map((r: any) => ({
    device_type: String(r.device_type),
    visitors: Number(r.visitors),
    sessions: Number(r.sessions),
    page_views: Number(r.page_views),
    pct: Math.round((Number(r.visitors) / totalVisitors) * 100),
  })).sort((a, c) => c.visitors - a.visitors);
}

/** Traffic sources (referrer + UTM). */
export async function getTrafficSources(range = '30d', from?: string, to?: string): Promise<SourceStat[]> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT
      COALESCE(
        CASE
          WHEN utm_source IS NOT NULL AND utm_source != '' THEN utm_source
          WHEN referrer IS NULL OR referrer = '' THEN 'direct'
          WHEN referrer LIKE '%google%' OR referrer LIKE '%bing%' OR referrer LIKE '%yahoo%' OR referrer LIKE '%duckduckgo%' THEN 'organic_search'
          WHEN referrer LIKE '%facebook%' OR referrer LIKE '%instagram%' OR referrer LIKE '%twitter%' OR referrer LIKE '%x.com%' OR referrer LIKE '%tiktok%' OR referrer LIKE '%snapchat%' OR referrer LIKE '%linkedin%' OR referrer LIKE '%whatsapp%' OR referrer LIKE '%wa.me%' THEN 'social'
          ELSE 'referral'
        END,
        'unknown'
      ) AS source,
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(DISTINCT session_id) AS sessions,
      COUNT(*) AS page_views
    FROM page_views WHERE created_at BETWEEN ? AND ? GROUP BY source ORDER BY visitors DESC`,
    args: [b.from, b.to],
  });
  return rows.rows.map((r: any) => ({
    source: String(r.source),
    visitors: Number(r.visitors),
    sessions: Number(r.sessions),
    page_views: Number(r.page_views),
  }));
}

/** Daily traffic series for charts. */
export async function getTrafficSeries(range = '30d', from?: string, to?: string): Promise<TrafficSeriesPoint[]> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT substr(created_at, 1, 10) AS day,
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(DISTINCT session_id) AS sessions,
      COUNT(*) AS page_views
    FROM page_views WHERE created_at BETWEEN ? AND ? GROUP BY day ORDER BY day ASC`,
    args: [b.from, b.to],
  });
  return rows.rows.map((r: any) => ({
    date: String(r.day),
    visitors: Number(r.visitors),
    sessions: Number(r.sessions),
    page_views: Number(r.page_views),
  }));
}

/** Landing pages (first page of each session). */
export async function getLandingPages(range = '30d', from?: string, to?: string, limit = 15): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT page_url, MAX(page_title) AS page_title,
      COUNT(*) AS sessions,
      COUNT(DISTINCT visitor_id) AS visitors
    FROM page_views
    WHERE id IN (
      SELECT MIN(id) FROM page_views WHERE created_at BETWEEN ? AND ? GROUP BY session_id
    )
    GROUP BY page_url ORDER BY sessions DESC LIMIT ?`,
    args: [b.from, b.to, limit],
  });
  return rows.rows.map((r: any) => ({
    page_url: String(r.page_url),
    page_title: r.page_title ? String(r.page_title) : null,
    sessions: Number(r.sessions),
    visitors: Number(r.visitors),
  }));
}

/** Page-level traffic breakdown. */
export async function getPageTraffic(range = '30d', from?: string, to?: string): Promise<any[]> {
  await ensureSchema();
  const db = getDb();
  const b = rangeBounds(range, from, to);
  const rows = await db.execute({
    sql: `SELECT page_url, MAX(page_title) AS page_title,
      COUNT(*) AS page_views,
      COUNT(DISTINCT visitor_id) AS unique_visitors,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN device_type = 'mobile' THEN 1 ELSE 0 END) AS mobile_views
    FROM page_views WHERE created_at BETWEEN ? AND ? GROUP BY page_url ORDER BY page_views DESC LIMIT 50`,
    args: [b.from, b.to],
  });
  return rows.rows.map((r: any) => ({
    page_url: String(r.page_url),
    page_title: r.page_title ? String(r.page_title) : null,
    page_views: Number(r.page_views),
    unique_visitors: Number(r.unique_visitors),
    sessions: Number(r.sessions),
    mobile_views: Number(r.mobile_views),
  }));
}
