import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  DEFAULT_ADMIN_PASSWORD,
  getAdminPassword,
  isAuthenticated,
  isValidPassword,
  sessionToken,
} from '@/lib/adminAuth';

export async function GET() {
  return NextResponse.json({
    authenticated: isAuthenticated(),
    usingDefaultPassword: getAdminPassword() === DEFAULT_ADMIN_PASSWORD,
  });
}

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }));

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: sessionToken(getAdminPassword()),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({ name: ADMIN_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
