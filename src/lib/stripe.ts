import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}

export const PRICES: Record<string, string> = {
  // Monthly subscriptions
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
  // Annual subscriptions (save 28-37%)
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_1SzQPrHS7pkl2UJIL3yyhuJI',
  enterprise_annual: process.env.STRIPE_ENT_ANNUAL_PRICE_ID || 'price_1SzQPsHS7pkl2UJIGHqopn8N',
  // Per-report one-time purchases
  single_debate: process.env.STRIPE_SINGLE_DEBATE_PRICE_ID || 'price_1SzQPsHS7pkl2UJIJsQWVOVB',
  single_verdict: process.env.STRIPE_SINGLE_VERDICT_PRICE_ID || 'price_1SzQPsHS7pkl2UJIZB4Vk1zq',
};
