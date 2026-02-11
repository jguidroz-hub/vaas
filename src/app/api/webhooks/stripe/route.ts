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
          
          // Send welcome email (FIX-7)
          if (process.env.RESEND_API_KEY) {
            const planName = plan === 'enterprise' ? 'Venture Verdict' : 'Guardian Debate';
            const features = plan === 'enterprise' 
              ? ['Full research dossier (Perplexity + Gemini)', 'Adversarial Guardian debate', 'PDF report export', 'Up to 50 validations/month']
              : ['Adversarial Guardian debate', 'PDF report export', 'Up to 30 validations/month'];
            
            fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'Greenbelt <noreply@projectgreenbelt.com>',
                to: email,
                subject: `Welcome to ${planName} — your account is active`,
                html: `
                  <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:32px;">
                    <h2 style="color:#111;">Welcome to ${planName} 🎉</h2>
                    <p style="color:#374151;">Your subscription is active. Here's how to get started:</p>
                    <ol style="color:#374151;line-height:1.8;">
                      <li>Go to <a href="https://vaas-greenbelt.vercel.app" style="color:#10b981;">vaas-greenbelt.vercel.app</a></li>
                      <li>Click <strong>Sign In</strong> and enter your email: <strong>${email}</strong></li>
                      <li>Enter the verification code we send you</li>
                      <li>Submit any idea — your ${planName.toLowerCase()} runs automatically</li>
                    </ol>
                    <p style="color:#374151;font-weight:600;">What you get:</p>
                    <ul style="color:#374151;line-height:1.8;">
                      ${features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    <p style="color:#374151;">Results are emailed to you within 7-12 minutes of submission, with a shareable PDF report link.</p>
                    <p style="color:#6b7280;font-size:13px;margin-top:24px;">Questions? Reply to this email. — Greenbelt Team</p>
                  </div>
                `,
              }),
            }).catch(err => console.error('Welcome email failed:', err));
          }
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
