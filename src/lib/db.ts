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
  `);
  schemaReady = true;
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
      } else if (key === 'featured') {
        args.push(value ? 1 : 0);
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
