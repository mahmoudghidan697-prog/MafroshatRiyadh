import { NextRequest, NextResponse } from 'next/server';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  getPayments,
  recordPayment,
  getMerchantBillingSummary,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// NOTE: /api/admin/* is auth-guarded by src/middleware.ts

// GET /api/admin/invoices?merchantId=1 — invoices (+ payments + summary)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId') ? Number(searchParams.get('merchantId')) : undefined;

    const invoices = await getInvoices(merchantId);
    // Attach payments + merchant name to each invoice for the dashboard
    const withPayments = await Promise.all(
      invoices.map(async (inv) => ({ ...inv, payments: await getPayments(inv.id) })),
    );
    const summary = await getMerchantBillingSummary();
    return NextResponse.json(
      { invoices: withPayments, summary },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/admin/invoices — create an invoice
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.merchantId || !body?.agreementId) {
      return NextResponse.json({ error: 'merchantId and agreementId are required' }, { status: 400 });
    }
    const id = await createInvoice({
      merchantId: Number(body.merchantId),
      agreementId: Number(body.agreementId),
      issueDate: body.issueDate ? String(body.issueDate) : undefined,
      periodFrom: body.periodFrom ? String(body.periodFrom) : null,
      periodTo: body.periodTo ? String(body.periodTo) : null,
      agreedClicks: Number(body.agreedClicks) || 0,
      agreedRate: Number(body.agreedRate) || 0,
      additionalClicks: Number(body.additionalClicks) || 0,
      additionalRate: Number(body.additionalRate) || 0,
      taxRate: body.taxRate != null ? Number(body.taxRate) : 0,
      notes: body.notes ? String(body.notes) : undefined,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/admin/invoices — record a payment against an invoice
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.invoiceId || body.amount == null) {
      return NextResponse.json({ error: 'invoiceId and amount are required' }, { status: 400 });
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
    }
    const ok = await recordPayment({
      invoiceId: Number(body.invoiceId),
      amount,
      method: body.method ? String(body.method) : undefined,
      reference: body.reference ? String(body.reference) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      paidAt: body.paidAt ? String(body.paidAt) : undefined,
    });
    if (!ok) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
