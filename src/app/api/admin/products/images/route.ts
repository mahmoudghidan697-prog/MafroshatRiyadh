import { NextRequest, NextResponse } from "next/server";
import { updateProductImages } from "@/lib/db";

export const dynamic = "force-dynamic";

/** PUT /api/admin/products/images?slug=xxx — update ONLY the images column. */
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });
    const body = await req.json();
    const images: string[] = Array.isArray(body.images) ? body.images : [];
    const ok = await updateProductImages(slug, images);
    if (!ok) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, images });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
