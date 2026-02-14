import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'vaas-secret-2026');

async function hashPw(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw + 'vaa-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function auth(req?: NextRequest) {
  try {
    let token: string | undefined;
    if (req) { token = req.cookies.get('vaa_session')?.value; }
    else { const { cookies } = await import('next/headers'); const cs = await cookies(); token = cs.get('vaa_session')?.value; }
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { user: { id: payload.sub as string, name: (payload.name as string) || null, email: payload.email as string } };
  } catch { return null; }
}

export async function requireAuth(req?: NextRequest) {
  const session = await auth(req);
  if (!session?.user) throw new Error('Unauthorized');
  return session;
}

export async function createSession(userId: string, email: string, name?: string) {
  return new SignJWT({ sub: userId, email, name }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(JWT_SECRET);
}

export { hashPw as hashPassword };
export async function verifyPassword(pw: string, hash: string) { return (await hashPw(pw)) === hash; }
