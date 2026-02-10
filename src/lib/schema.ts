import { pgTable, text, integer, timestamp, jsonb, uuid, boolean } from 'drizzle-orm/pg-core';

// ── Validation Submissions (the flywheel data) ──────────────
export const submissions = pgTable('vaas_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // What they submitted
  idea: text('idea').notNull(),
  audience: text('audience'),
  revenueModel: text('revenue_model'),
  
  // What we scored
  confidence: integer('confidence').notNull(),
  verdict: text('verdict').notNull(),
  risks: jsonb('risks').$type<string[]>().default([]),
  strengths: jsonb('strengths').$type<string[]>().default([]),
  recommendations: jsonb('recommendations').$type<string[]>().default([]),
  patternsMatched: integer('patterns_matched').default(0),
  
  // Categorization (auto-detected from idea text)
  category: text('category'), // e.g. 'productivity', 'ecommerce', 'devtools', 'fintech'
  ecosystem: text('ecosystem'), // e.g. 'shopify', 'chrome', 'standalone'
  
  // Flywheel: did they build it?
  builtIt: boolean('built_it'),
  builtOutcome: text('built_outcome'), // 'success', 'failed', 'pivoted', 'abandoned'
  outcomeNotes: text('outcome_notes'),
  followUpSentAt: timestamp('follow_up_sent_at'),
  followUpRespondedAt: timestamp('follow_up_responded_at'),
  
  // Conversion: did they use Greenbelt to build?
  greenbeltInterest: boolean('greenbelt_interest').default(false),
  greenbeltVentureId: text('greenbelt_venture_id'), // links to orchestrator
  greenbeltStatus: text('greenbelt_status'), // 'interested', 'quoted', 'building', 'delivered'
  
  // User tracking (anonymous unless they sign up)
  fingerprint: text('fingerprint'), // hashed IP + UA for dedup, no PII
  email: text('email'), // only if they opt in for follow-up or build request
  
  // Metadata
  source: text('source').default('web'), // 'web', 'api', 'embed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Build Requests (VaaS → Greenbelt factory) ───────────────
export const buildRequests = pgTable('build_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  submissionId: uuid('submission_id').references(() => submissions.id),
  
  // Contact info
  email: text('email').notNull(),
  name: text('name'),
  company: text('company'),
  
  // What they want built
  idea: text('idea').notNull(),
  budget: text('budget'), // 'starter', 'pro', 'enterprise'
  timeline: text('timeline'), // 'asap', '1month', '3months'
  additionalContext: text('additional_context'),
  
  // Pipeline tracking
  status: text('status').default('new').notNull(), // 'new', 'reviewed', 'quoted', 'accepted', 'building', 'delivered', 'declined'
  greenbeltVentureId: text('greenbelt_venture_id'),
  quotedPrice: integer('quoted_price'), // cents
  
  // Validation scores at time of request
  validationConfidence: integer('validation_confidence'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Subscribers (from Stripe checkout) ───────────────────────
export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: text('plan').notNull().default('free'), // 'free', 'pro', 'enterprise'
  status: text('status').notNull().default('active'), // 'active', 'cancelled', 'past_due'
  validationsUsed: integer('validations_used').default(0),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Reports (Guardian + Venture Verdict results) ────────────
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Input
  idea: text('idea').notNull(),
  audience: text('audience'),
  revenueModel: text('revenue_model'),
  
  // Result
  tier: text('tier').notNull(), // 'pro' or 'enterprise'
  verdict: text('verdict'), // STRONG_GO, CONDITIONAL_GO, PIVOT_REQUIRED, NO_GO
  confidence: integer('confidence'),
  executiveSummary: text('executive_summary'),
  
  // Debate
  debateRounds: jsonb('debate_rounds').$type<any[]>().default([]),
  strengths: jsonb('strengths').$type<string[]>().default([]),
  risks: jsonb('risks').$type<string[]>().default([]),
  proceedConditions: jsonb('proceed_conditions').$type<string[]>().default([]),
  
  // Enterprise enrichment
  enrichment: jsonb('enrichment'), // Full enriched idea data (TAM, competitors, etc.)
  
  // Meta
  email: text('email').notNull(),
  totalCostUsd: text('total_cost_usd'),
  durationSeconds: integer('duration_seconds'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Aggregate Market Signals (for Greenbelt Discovery) ──────
export const marketSignals = pgTable('market_signals', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Aggregated from submissions
  category: text('category').notNull(),
  keyword: text('keyword').notNull(),
  submissionCount: integer('submission_count').default(0),
  avgConfidence: integer('avg_confidence').default(0),
  
  // Signal strength
  trendDirection: text('trend_direction'), // 'rising', 'stable', 'falling'
  lastSeen: timestamp('last_seen'),
  firstSeen: timestamp('first_seen'),
  
  // Fed back to Greenbelt
  fedToDiscovery: boolean('fed_to_discovery').default(false),
  fedAt: timestamp('fed_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
