import { createHash, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'printr_admin_session';
export const DEFAULT_ADMIN_PASSWORD = 'printr-admin';

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

export function sessionToken(password: string) {
  return createHash('sha256').update(`printr::${password}`).digest('hex');
}

export function isValidPassword(password: string) {
  const expected = Buffer.from(sessionToken(getAdminPassword()));
  const provided = Buffer.from(sessionToken(String(password ?? '')));
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export function isAuthenticated() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return token === sessionToken(getAdminPassword());
}
