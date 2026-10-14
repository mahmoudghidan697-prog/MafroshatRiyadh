import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'products');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

/** POST /api/admin/upload — upload a product image (base64 or raw body). */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let buffer: Buffer;
    let filename: string;

    if (contentType.includes('application/json')) {
      // Base64 upload from the admin UI
      const body = await req.json();
      const { data, filename: fname } = body;

      if (!data || !fname) {
        return NextResponse.json({ error: 'data and filename required' }, { status: 400 });
      }

      // Strip data URL prefix if present
      const base64 = data.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64, 'base64');

      // Validate it's actually an image by checking magic bytes
      if (buffer.length < 100) {
        return NextResponse.json({ error: 'File too small' }, { status: 400 });
      }
      const magic = buffer.subarray(0, 4).toString('hex');
      const validMagic =
        magic.startsWith('ffd8ff') || // JPEG
        magic.startsWith('89504e47') || // PNG
        magic.startsWith('52494646'); // WEBP/RIFF
      if (!validMagic) {
        return NextResponse.json({ error: 'Not a valid image file' }, { status: 400 });
      }

      if (buffer.length > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 400 });
      }

      filename = fname;
    } else {
      // Raw binary upload (multipart or direct)
      const arrayBuffer = await req.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      if (buffer.length > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 400 });
      }
      const url = new URL(req.url);
      filename = url.searchParams.get('filename') || `upload-${Date.now()}.jpg`;
    }

    // Sanitize filename — no path traversal
    const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!safeName || safeName.startsWith('.')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // ─── Vercel Blob (production, if configured) ───
    // On Vercel the filesystem is read-only, so uploaded images must go
    // to Blob storage. The frontend stores whatever path we return here,
    // so returning the Blob URL makes the image display correctly.
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`products/${safeName}`, buffer, {
          access: 'public',
          token: blobToken,
          contentType: 'image/jpeg',
        });
        return NextResponse.json({ ok: true, path: blob.url, size: buffer.length });
      } catch (blobErr: any) {
        return NextResponse.json(
          { error: `Blob upload failed: ${blobErr?.message || 'unknown'}` },
          { status: 500 },
        );
      }
    }

    // ─── Local filesystem (dev / self-hosted) ───
    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const filePath = path.join(UPLOAD_DIR, safeName);
    await writeFile(filePath, buffer);

    const publicPath = `/images/products/${safeName}`;
    return NextResponse.json({ ok: true, path: publicPath, size: buffer.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}

/** GET /api/admin/upload — list all available images (defaults + uploaded + blob). */
export async function GET() {
  try {
    const productsDir = path.join(process.cwd(), 'public', 'images', 'products');
    const categoriesDir = path.join(process.cwd(), 'public', 'images', 'categories');

    const products = fs.existsSync(productsDir)
      ? fs.readdirSync(productsDir).filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f)).sort()
      : [];
    const categories = fs.existsSync(categoriesDir)
      ? fs.readdirSync(categoriesDir).filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f)).sort()
      : [];

    const productPaths = products.map((f) => `/images/products/${f}`);
    const categoryPaths = categories.map((f) => `/images/categories/${f}`);

    // Include images stored in Vercel Blob (production uploads)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      try {
        const { list } = await import('@vercel/blob');
        const { blobs } = await list({ prefix: 'products/', token: blobToken });
        for (const b of blobs) {
          productPaths.push(b.url);
        }
      } catch {
        // Blob listing failed — return local paths only
      }
    }

    return NextResponse.json({ products: productPaths, categories: categoryPaths });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
