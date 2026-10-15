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
      description_ar TEXT, description_en TEXT, image TEXT NOT NULL
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
  };
}

function rowToCategory(r: any): Category {
  return {
    id: r.id, name: { ar: r.name_ar, en: r.name_en },
    description: { ar: r.description_ar ?? '', en: r.description_en ?? '' },
    image: r.image,
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
}): Promise<void> {
  await ensureSchema();
  const db = getDb();
  await db.execute({
    sql: 'INSERT INTO contact_events (type, contact, contact_key, page_url, page_title, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [
      e.type,
      e.contact,
      e.contactKey ?? null,
      e.pageUrl,
      e.pageTitle ?? null,
      e.sessionId ?? null,
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
