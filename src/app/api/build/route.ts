import { NextRequest, NextResponse } from 'next/server';

// Rate limit: 3 build requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, name, idea, budget, timeline, additionalContext } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }
  if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
    return NextResponse.json({ error: 'Please describe what you want built (at least 10 characters)' }, { status: 400 });
  }

  // Store in DB if available
  try {
    if (process.env.DATABASE_URL) {
      const { db } = await import('@/lib/db');
      const { buildRequests } = await import('@/lib/schema');
      
      await db.insert(buildRequests).values({
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        idea: idea.trim().slice(0, 5000),
        budget: budget || 'pro',
        timeline: timeline || 'flexible',
        additionalContext: additionalContext?.trim().slice(0, 2000) || null,
        status: 'new',
      });
    }
  } catch (err) {
    console.error('[VaaS] Build request capture failed:', err);
    // Don't fail the request — we'll still send the notification
  }

  // Send notification email to Jon/Pete
  try {
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'VaaS <noreply@projectgreenbelt.com>',
          to: ['jguidroz@gmail.com'],
          subject: `🏗️ New VaaS Build Request: ${budget?.toUpperCase() || 'PRO'} tier`,
          html: `
            <h2>New Build Request</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Name:</strong> ${name || 'Not provided'}</p>
            <p><strong>Budget:</strong> ${budget || 'pro'}</p>
            <p><strong>Timeline:</strong> ${timeline || 'flexible'}</p>
            <h3>Idea</h3>
            <p>${idea.replace(/\n/g, '<br>')}</p>
            ${additionalContext ? `<h3>Additional Context</h3><p>${additionalContext.replace(/\n/g, '<br>')}</p>` : ''}
            <hr>
            <p><em>VaaS by Greenbelt — vaas-greenbelt.vercel.app</em></p>
          `,
        }),
      });
    }
  } catch (err) {
    console.error('[VaaS] Notification email failed:', err);
  }

  return NextResponse.json({
    success: true,
    message: 'Build request received. We\'ll review and respond within 24 hours.',
  });
}
