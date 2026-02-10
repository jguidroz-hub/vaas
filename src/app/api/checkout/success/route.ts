import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

// GET /api/checkout/success?session_id=xxx — Retrieve customer email after checkout
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({ 
      email: session.customer_email || session.customer_details?.email || null,
      plan: session.metadata?.plan || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }
}
