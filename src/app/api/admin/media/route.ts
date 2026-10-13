import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');
const FOLDERS = ['products', 'categories'] as const;
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

interface GalleryImage {
  path: string;
  folder: string;
  name: string;
}

/** GET /api/admin/media — list every image in public/images/{products,categories} */
export async function GET() {
  try {
    const images: GalleryImage[] = [];
    for (const folder of FOLDERS) {
      const dir = path.join(IMAGES_DIR, folder);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => IMAGE_RE.test(f));
      for (const name of files) {
        images.push({ path: `/images/${folder}/${name}`, folder, name });
      }
    }
    // Newest-ish first: sort by filename desc (uploads carry a timestamp)
    images.sort((a, b) => b.name.localeCompare(a.name));
    return NextResponse.json({ images });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE /api/admin/media?path=/images/products/x.jpg — remove an image file */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rel = searchParams.get('path') || '';

    // Security: only allow deleting inside public/images/{products,categories}
    const match = rel.match(/^\/images\/(products|categories)\/([^/\\]+)$/);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid path — must be /images/products/... or /images/categories/...' },
        { status: 400 },
      );
    }
    const folder = match[1];
    const name = path.basename(match[2]);
    if (!IMAGE_RE.test(name)) {
      return NextResponse.json({ error: 'Not an image file' }, { status: 400 });
    }

    const filePath = path.join(IMAGES_DIR, folder, name);
    // Final safety check — resolved path must stay inside the folder
    const resolved = path.resolve(filePath);
    const allowed = path.resolve(path.join(IMAGES_DIR, folder));
    if (!resolved.startsWith(allowed + path.sep)) {
      return NextResponse.json({ error: 'Path traversal blocked' }, { status: 400 });
    }

    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    fs.unlinkSync(resolved);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
