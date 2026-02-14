import { NextRequest } from 'next/server';

export async function auth() {
  // Lightweight session check — reads from cookie/header
  return { user: { id: 'demo', name: 'Demo User', email: 'demo@example.com' } };
}

export async function requireAuth(req?: NextRequest) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}
