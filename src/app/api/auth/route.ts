import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Simple email-based auth: check if email is a subscriber, set cookie
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const result = await db.select().from(subscribers)
      .where(eq(subscribers.email, normalized))
      .limit(1);

    if (result.length === 0 || result[0].status !== 'active' || result[0].plan === 'free') {
      return NextResponse.json({ error: 'No active subscription found for this email. Subscribe first.' }, { status: 404 });
    }

    const sub = result[0];
    const response = NextResponse.json({
      email: sub.email,
      plan: sub.plan,
      status: sub.status,
    });

    // Set cookie (30 days, httpOnly for security)
    response.cookies.set('vaas_email', sub.email, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: check current auth status
export async function GET(req: NextRequest) {
  const email = req.cookies.get('vaas_email')?.value;
  if (!email) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const result = await db.select().from(subscribers)
      .where(eq(subscribers.email, email))
      .limit(1);

    if (result.length === 0 || result[0].status !== 'active') {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      email: result[0].email,
      plan: result[0].plan,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
