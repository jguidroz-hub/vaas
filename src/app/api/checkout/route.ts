import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICES } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { plan, email } = await req.json();

    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICES[plan as keyof typeof PRICES];
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/?checkout=success&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}`,
      cancel_url: `${req.nextUrl.origin}/?checkout=cancelled`,
      ...(email ? { customer_email: email } : {}),
      metadata: { plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
