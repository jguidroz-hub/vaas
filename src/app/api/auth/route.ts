import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

// Store OTP codes in the database to survive serverless cold starts
// Uses a simple approach: store in the subscribers table via a temp column,
// or use a separate query. For simplicity, use a DB-backed approach via raw SQL.

// Rate limit: max 3 code requests per email per 15 min (DB-backed)
async function checkAndIncrementCodeRate(email: string): Promise<boolean> {
  try {
    // Use DB to track rate limiting (survives cold starts)
    const result = await db.execute(sql`
      SELECT otp_code, otp_expires_at, otp_attempts 
      FROM subscribers 
      WHERE email = ${email}
    `);
    if (result.rows.length === 0) return true; // No subscriber = can't rate limit
    const row = result.rows[0] as any;
    const attempts = row.otp_attempts || 0;
    const expiresAt = row.otp_expires_at ? new Date(row.otp_expires_at) : null;
    
    // If the last OTP is still valid and attempts >= 3, block
    if (expiresAt && new Date() < expiresAt && attempts >= 3) return false;
    return true;
  } catch {
    return true; // On error, allow (don't block legitimate users)
  }
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
      if (!code) {
        return NextResponse.json({ 
          error: 'No active subscription found. If you just subscribed, please wait a moment and try again — it can take up to 30 seconds to activate.',
          retryable: true 
        }, { status: 404 });
      }
      return NextResponse.json({ error: 'No active subscription found for this email.' }, { status: 404 });
    }

    const sub = result[0];

    // STEP 2: Verify code
    if (code) {
      // Read OTP from DB
      const otpResult = await db.execute(sql`
        SELECT otp_code, otp_expires_at FROM subscribers WHERE email = ${normalized}
      `);
      const row = otpResult.rows[0] as any;
      
      if (!row?.otp_code || !row?.otp_expires_at || new Date() > new Date(row.otp_expires_at)) {
        return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
      }

      if (row.otp_code !== code.trim()) {
        return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
      }

      // Valid! Clear OTP and set cookie
      await db.execute(sql`
        UPDATE subscribers SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0 WHERE email = ${normalized}
      `);

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
    if (!(await checkAndIncrementCodeRate(normalized))) {
      return NextResponse.json({ error: 'Too many code requests. Try again in 15 minutes.' }, { status: 429 });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in DB (survives serverless cold starts)
    await db.execute(sql`
      UPDATE subscribers 
      SET otp_code = ${verifyCode}, 
          otp_expires_at = ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}::timestamp,
          otp_attempts = COALESCE(otp_attempts, 0) + 1
      WHERE email = ${normalized}
    `);

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
          subject: `Your verification code: ${verifyCode}`,
          html: `
            <div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px;">
              <h2 style="color:#111;">Your verification code</h2>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111;background:#f3f4f6;padding:16px 24px;border-radius:8px;text-align:center;margin:16px 0;">
                ${verifyCode}
              </div>
              <p style="color:#6b7280;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Greenbelt · vaas-greenbelt.vercel.app</p>
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
