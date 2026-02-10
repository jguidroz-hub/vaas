import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { plan, email, billing } = await request.json();

    // Validate plan
    const validPlans = ['pro', 'enterprise', 'pro_annual', 'enterprise_annual', 'single_debate', 'single_verdict'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const priceId = PRICES[plan as keyof typeof PRICES];
    if (!priceId) {
      return NextResponse.json({ error: 'Price not found' }, { status: 400 });
    }

    const stripe = getStripe();
    
    // Per-report purchases use payment mode, subscriptions use subscription mode
    const isOneTime = plan.startsWith('single_');
    
    const session = await stripe.checkout.sessions.create({
      mode: isOneTime ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://vaas-greenbelt.vercel.app?checkout=success&email={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `https://vaas-greenbelt.vercel.app?checkout=cancelled`,
      metadata: { plan },
      ...(email ? { customer_email: email } : {}),
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Checkout] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
