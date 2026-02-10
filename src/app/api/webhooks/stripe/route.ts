import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('✅ VaaS subscription started:', {
        customer: session.customer,
        email: session.customer_email || session.customer_details?.email,
        plan: session.metadata?.plan,
        subscription: session.subscription,
      });
      // TODO: provision user account, unlock unlimited validations
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      console.log('📝 VaaS subscription updated:', {
        id: sub.id,
        status: sub.status,
        customer: sub.customer,
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      console.log('❌ VaaS subscription cancelled:', {
        id: sub.id,
        customer: sub.customer,
      });
      // TODO: downgrade to free tier
      break;
    }
    default:
      console.log('Unhandled event:', event.type);
  }

  return NextResponse.json({ received: true });
}
