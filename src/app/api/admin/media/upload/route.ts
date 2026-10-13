import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'products');
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

/**
 * POST /api/admin/media/upload — upload an image (base64) into
 * public/images/products/. Returns its public path.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, filename } = body;
    if (!data || !filename) {
      return NextResponse.json({ error: 'data and filename required' }, { status: 400 });
    }

    const base64 = String(data).replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

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

    // Build a safe, unique filename
    const ext = (String(filename).split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const baseName = String(filename)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '-')
      .toLowerCase()
      .slice(0, 50);
    const safeName = `${baseName || 'upload'}-${Date.now()}.${ext}`;

    if (!fs.existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, safeName), buffer);

    return NextResponse.json({ ok: true, path: `/images/products/${safeName}`, size: buffer.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
