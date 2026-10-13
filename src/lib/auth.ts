// ═══════════════════════════════════════════════════════════════
//  Admin authentication — JWT (pure, no DB import)
// ═══════════════════════════════════════════════════════════════
//  This module is imported by the middleware which runs on the
//  Edge Runtime — it must NOT import better-sqlite3.
//
//  IMPORTANT: We implement HMAC-SHA256 JWT verification manually
//  with the Web Crypto API (available in BOTH Edge and Node)
//  instead of the `jsonwebtoken` package, because the Edge and
//  Node copies of that library can disagree on signature handling.
// ═══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';

// Fixed secret baked into the build so Edge middleware and Node
// API routes always sign/verify with the SAME key.
// ⚠ For production, replace this with an env-var-driven secret.
const JWT_SECRET = 'ms-admin-dev-secret-2026-fixed-key';

export interface AdminTokenPayload {
  userId: number;
  username: string;
}

export const COOKIE_NAME = 'admin_token';

// ─── Base64URL helpers ───

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

// ─── HMAC-SHA256 via Web Crypto (works in Edge + Node) ───

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  // ArrayBuffer → base64url
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── Sync JWT sign/verify using a precomputed HMAC ───
// We use a synchronous approach: Node's crypto for sign (API routes),
// and for verify we need sync too, so we use a manual HMAC impl.

// Simple synchronous HMAC-SHA256 using Node crypto when available
// (API routes run on Node), falling back to a manual implementation.
function syncHmacSha256(message: string, secret: string): string {
  // Use Node's crypto if available (API routes)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    // Edge runtime: can't do sync HMAC here.
    // Fall back to a manual HMAC-SHA256 implementation.
    throw new Error('sync crypto unavailable');
  }
}

// ─── Public API ───

/** Sign a JWT. Only call from Node.js (API routes). */
export function signToken(payload: AdminTokenPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 60 * 60 * 24 * 7 };

  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(body));
  const sig = syncHmacSha256(`${h}.${p}`, JWT_SECRET);
  return `${h}.${p}.${sig}`;
}

/** Verify a JWT. Works in both Edge (async) and Node (sync). */
export function verifyToken(token: string): AdminTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;

    // Compute expected signature
    let expected: string;
    try {
      expected = syncHmacSha256(`${h}.${p}`, JWT_SECRET);
    } catch {
      // Edge runtime: can't do sync HMAC here.
      // Fall back to a manual HMAC-SHA256 implementation.
      expected = manualHmacSha256(`${h}.${p}`, JWT_SECRET);
    }

    if (expected !== sig) return null;

    // Check expiry
    const payload = JSON.parse(base64UrlDecode(p));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

/** Async verify for Edge middleware (uses Web Crypto). */
export async function verifyTokenAsync(token: string): Promise<AdminTokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;

    const expected = await hmacSha256(`${h}.${p}`, JWT_SECRET);
    if (expected !== sig) return null;

    const payload = JSON.parse(base64UrlDecode(p));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

// ─── Manual HMAC-SHA256 for Edge runtime ───
// Minimal pure-JS SHA-256 + HMAC (no dependencies).
// This is a compact implementation — only used as Edge fallback.

function manualHmacSha256(message: string, secret: string): string {
  // Convert strings to byte arrays
  const msgBytes = new TextEncoder().encode(message);
  const keyBytes = new TextEncoder().encode(secret);

  // If key > 64 bytes, hash it first
  let key: Uint8Array<ArrayBuffer> = keyBytes as Uint8Array<ArrayBuffer>;
  if (key.length > 64) {
    key = sha256(keyBytes);
  }
  // Pad key to 64 bytes
  const paddedKey = new Uint8Array(new ArrayBuffer(64));
  paddedKey.set(key);

  // Inner and outer pads
  const inner = new Uint8Array(new ArrayBuffer(64));
  const outer = new Uint8Array(new ArrayBuffer(64));
  for (let i = 0; i < 64; i++) {
    inner[i] = paddedKey[i] ^ 0x36;
    outer[i] = paddedKey[i] ^ 0x5c;
  }

  // HMAC = H(outer || H(inner || message))
  const innerData = new Uint8Array(64 + msgBytes.length);
  innerData.set(inner);
  innerData.set(msgBytes, 64);
  const innerHash = sha256(innerData);

  const outerData = new Uint8Array(64 + innerHash.length);
  outerData.set(outer);
  outerData.set(innerHash, 64);
  const result = sha256(outerData);

  // Convert to base64url
  let binary = '';
  for (let i = 0; i < result.length; i++) binary += String.fromCharCode(result[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Minimal SHA-256
function sha256(data: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  // Pre-processing: pad message
  const msgLen = data.length;
  const bitLen = msgLen * 8;
  const paddedLen = (((msgLen + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(new ArrayBuffer(paddedLen));
  padded.set(data);
  padded[msgLen] = 0x80;
  // Write length as 64-bit big-endian (we only need lower 32 bits for reasonable sizes)
  const dv = new DataView(padded.buffer);
  dv.setUint32(paddedLen - 4, bitLen >>> 0, false);
  dv.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = dv.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(new ArrayBuffer(32));
  const rdv = new DataView(result.buffer);
  rdv.setUint32(0, h0, false); rdv.setUint32(4, h1, false);
  rdv.setUint32(8, h2, false); rdv.setUint32(12, h3, false);
  rdv.setUint32(16, h4, false); rdv.setUint32(20, h5, false);
  rdv.setUint32(24, h6, false); rdv.setUint32(28, h7, false);
  return result;
}

function rotr(n: number, b: number): number {
  return (n >>> b) | (n << (32 - b));
}

/** Extract and verify the JWT from a request's cookies. */
export function getAdminFromRequest(req: NextRequest): AdminTokenPayload | null {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
