// ═══════════════════════════════════════════════════════════════
//  DB-backed auth operations (bcrypt password checks)
// ═══════════════════════════════════════════════════════════════
//  Only import this from Node.js API routes — never from middleware.
// ═══════════════════════════════════════════════════════════════

import bcrypt from 'bcryptjs';
import { getDb } from './db';
import type { AdminTokenPayload } from './auth';

export async function verifyPassword(username: string, password: string): Promise<AdminTokenPayload | null> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM admin_users WHERE username = ?',
    args: [username],
  });
  const user = result.rows[0] as unknown as
    | { id: number; username: string; password_hash: string }
    | undefined;
  if (!user) return null;
  if (!bcrypt.compareSync(password, user.password_hash)) return null;
  return { userId: user.id, username: user.username };
}

export async function changePassword(username: string, newPassword: string): Promise<boolean> {
  const db = getDb();
  const hash = bcrypt.hashSync(newPassword, 10);
  await db.execute({
    sql: 'UPDATE admin_users SET password_hash = ? WHERE username = ?',
    args: [hash, username],
  });
  return true;
}
