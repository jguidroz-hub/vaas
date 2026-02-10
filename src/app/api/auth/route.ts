import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// In-memory verification codes (serverless-safe for short-lived codes)
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

// Cleanup expired codes periodically
function cleanupCodes() {
  const now = Date.now();
  verificationCodes.forEach((v, k) => {
    if (now > v.expiresAt) verificationCodes.delete(k);
  });
}

// Rate limit: max 3 code requests per email per 15 min
const codeRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkCodeRateLimit(email: string): boolean {
  const now = Date.now();
  const entry = codeRateLimit.get(email);
  if (!entry || now > entry.resetAt) {
    codeRateLimit.set(email, { count: 1, resetAt: now + 900_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

// POST: Two-step auth flow
// Step 1: { email } → sends verification code
// Step 2: { email, code } → verifies and sets cookie
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Check subscriber exists
    const result = await db.select().from(subscribers)
      .where(eq(subscribers.email, normalized))
      .limit(1);

    if (result.length === 0 || result[0].status !== 'active' || result[0].plan === 'free') {
      return NextResponse.json({ error: 'No active subscription found for this email.' }, { status: 404 });
    }

    const sub = result[0];

    // STEP 2: Verify code
    if (code) {
      cleanupCodes();
      const stored = verificationCodes.get(normalized);

      if (!stored || Date.now() > stored.expiresAt) {
        return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
      }

      if (stored.code !== code.trim()) {
        return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
      }

      // Valid! Set cookie and clean up
      verificationCodes.delete(normalized);

      const response = NextResponse.json({
        authenticated: true,
        email: sub.email,
        plan: sub.plan,
      });

      response.cookies.set('vaas_email', sub.email, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // STEP 1: Send verification code
    if (!checkCodeRateLimit(normalized)) {
      return NextResponse.json({ error: 'Too many code requests. Try again in 15 minutes.' }, { status: 429 });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(normalized, {
      code: verifyCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });

    // Send code via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Greenbelt <noreply@projectgreenbelt.com>',
          to: normalized,
          subject: `Your VaaS verification code: ${verifyCode}`,
          html: `
            <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px;">
              <h2 style="color:#111;">Your verification code</h2>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;background:#f3f4f6;padding:16px 24px;border-radius:8px;text-align:center;margin:16px 0;">
                ${verifyCode}
              </div>
              <p style="color:#6b7280;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">VaaS by Greenbelt · vaas-greenbelt.vercel.app</p>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({
      codeSent: true,
      message: 'Verification code sent to your email. Check your inbox.',
    });
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
