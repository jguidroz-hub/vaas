import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
      const email = (session.customer_email || session.customer_details?.email || '').toLowerCase();
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const plan = session.metadata?.plan || 'pro';

      if (email && customerId) {
        try {
          // Upsert subscriber
          const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
          if (existing.length > 0) {
            await db.update(subscribers)
              .set({ plan, status: 'active', stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, updatedAt: new Date() })
              .where(eq(subscribers.email, email));
          } else {
            await db.insert(subscribers).values({
              email,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              plan,
              status: 'active',
            });
          }
          console.log('✅ Subscriber created/updated:', email, plan);
        } catch (err: any) {
          console.error('Failed to save subscriber:', err.message);
        }
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'cancelled';
      try {
        await db.update(subscribers)
          .set({ status, currentPeriodEnd: new Date((sub as any).current_period_end * 1000), updatedAt: new Date() })
          .where(eq(subscribers.stripeSubscriptionId, sub.id));
        console.log('📝 Subscription updated:', sub.id, status);
      } catch (err: any) {
        console.error('Failed to update subscriber:', err.message);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      try {
        await db.update(subscribers)
          .set({ status: 'cancelled', plan: 'free', updatedAt: new Date() })
          .where(eq(subscribers.stripeSubscriptionId, sub.id));
        console.log('❌ Subscription cancelled:', sub.id);
      } catch (err: any) {
        console.error('Failed to cancel subscriber:', err.message);
      }
      break;
    }
    default:
      console.log('Unhandled event:', event.type);
  }

  return NextResponse.json({ received: true });
}
