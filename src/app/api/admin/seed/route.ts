import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/schema';

// POST /api/admin/seed — Seed realistic submission data for trends/library
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.GUARDIAN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const seedData = [
    { idea: 'AI-powered contract review tool for small law firms that flags risky clauses and suggests edits', audience: 'Solo attorneys and small firms (1-5 lawyers)', confidence: 72, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'legaltech', ecosystem: 'standalone' },
    { idea: 'Shopify app that detects return fraud by analyzing patterns across serial returners, wardrobing, and receipt manipulation', audience: 'E-commerce stores with $500K+ annual revenue', confidence: 78, verdict: '🟢 Strong signal — Worth building an MVP', category: 'ecommerce', ecosystem: 'shopify' },
    { idea: 'Automated permit tracking system for construction projects that monitors city portals for status changes and deadlines', audience: 'General contractors managing 5+ active projects', confidence: 74, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'productivity', ecosystem: 'standalone' },
    { idea: 'Browser extension that blocks AI-generated content from search results using detection patterns', audience: 'Knowledge workers and researchers', confidence: 45, verdict: '🟠 Weak signal — Significant risks identified', category: 'devtools', ecosystem: 'chrome' },
    { idea: 'Subscription management dashboard for SMBs that consolidates all SaaS spend with cancellation reminders', audience: 'Finance teams at companies with 20-200 employees', confidence: 65, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'fintech', ecosystem: 'standalone' },
    { idea: 'AI menu cost optimizer for restaurants that tracks ingredient prices and suggests price adjustments in real-time', audience: 'Restaurant owners with 1-10 locations', confidence: 76, verdict: '🟢 Strong signal — Worth building an MVP', category: 'foodtech', ecosystem: 'standalone' },
    { idea: 'HIPAA-compliant patient intake automation that pre-fills forms from insurance data', audience: 'Small dental and medical practices', confidence: 68, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'healthtech', ecosystem: 'standalone' },
    { idea: 'Open-source dependency license auditor that generates SBOMs and enforces license policies across repos', audience: 'Engineering leads at companies with compliance requirements', confidence: 71, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'devtools', ecosystem: 'standalone' },
    { idea: 'WordPress plugin for A/B testing blog post titles and featured images with statistical significance tracking', audience: 'Content marketers and bloggers with 10K+ monthly visitors', confidence: 62, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'marketing', ecosystem: 'wordpress' },
    { idea: 'Lease abstraction AI that extracts key terms from commercial lease PDFs into structured data', audience: 'Commercial real estate brokers and property managers', confidence: 79, verdict: '🟢 Strong signal — Worth building an MVP', category: 'realestate', ecosystem: 'standalone' },
    { idea: 'Automated social media scheduler with AI content suggestions', audience: 'Small businesses', confidence: 32, verdict: '🔴 High risk — Major concerns found', category: 'marketing', ecosystem: 'standalone' },
    { idea: 'E-commerce inventory forecasting using historical sales data and seasonal trends to predict stockouts 30 days ahead', audience: 'Shopify merchants with 200+ SKUs', confidence: 73, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'ecommerce', ecosystem: 'shopify' },
    { idea: 'VS Code extension that auto-generates unit tests from function signatures using static analysis', audience: 'TypeScript and JavaScript developers', confidence: 66, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'devtools', ecosystem: 'vscode' },
    { idea: 'Course completion booster for online educators that detects dropout signals and sends personalized nudges', audience: 'Online course creators on Teachable/Thinkific', confidence: 70, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'edtech', ecosystem: 'standalone' },
    { idea: 'Contractor invoice validator that checks invoices against contracts and timesheets for overbilling', audience: 'Property developers managing 5+ subcontractors', confidence: 77, verdict: '🟢 Strong signal — Worth building an MVP', category: 'fintech', ecosystem: 'standalone' },
    { idea: 'AI-powered customer testimonial collector with automated email/SMS outreach and embeddable widget', audience: 'SaaS founders and service businesses', confidence: 64, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'marketing', ecosystem: 'standalone' },
    { idea: 'BigCommerce upsell and cross-sell engine that recommends products based on cart contents', audience: 'BigCommerce merchants with 100+ products', confidence: 75, verdict: '🟢 Strong signal — Worth building an MVP', category: 'ecommerce', ecosystem: 'bigcommerce' },
    { idea: 'API health monitoring dashboard with smart alerting and incident response automation', audience: 'Backend developers and DevOps teams', confidence: 69, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'devtools', ecosystem: 'standalone' },
    { idea: 'Expense categorization ML model that learns business-specific categories from historical data', audience: 'Freelancers and small businesses doing bookkeeping', confidence: 61, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'fintech', ecosystem: 'standalone' },
    { idea: 'HR onboarding workflow automation for small teams with document collection and task checklists', audience: 'HR managers at companies with 20-100 employees', confidence: 67, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'hr', ecosystem: 'standalone' },
    { idea: 'Schema migration validator that catches breaking changes and data loss risks before they hit production', audience: 'Engineering teams running PostgreSQL', confidence: 71, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'devtools', ecosystem: 'standalone' },
    { idea: 'Slack app that summarizes long threads and channels into daily digests', audience: 'Remote teams with 20+ Slack channels', confidence: 55, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'productivity', ecosystem: 'slack' },
    { idea: 'Product photo enhancer with AI background removal and lifestyle scene placement for e-commerce', audience: 'Small e-commerce sellers on Shopify/Etsy', confidence: 63, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'ecommerce', ecosystem: 'shopify' },
    { idea: 'HubSpot integration that scores leads using external data enrichment from LinkedIn and Crunchbase', audience: 'B2B sales teams at SaaS companies', confidence: 70, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'marketing', ecosystem: 'hubspot' },
    { idea: 'AI-powered restaurant shift replacement tool with skills-based ranking and SMS cascade', audience: 'Multi-location restaurant operators', confidence: 73, verdict: '🟡 Moderate signal — Validate assumptions before building', category: 'foodtech', ecosystem: 'standalone' },
  ];

  try {
    let inserted = 0;
    for (const s of seedData) {
      await db.insert(submissions).values({
        idea: s.idea,
        audience: s.audience,
        confidence: s.confidence,
        verdict: s.verdict,
        category: s.category,
        ecosystem: s.ecosystem,
        patternsMatched: Math.floor(Math.random() * 3),
        risks: [],
        strengths: [],
        recommendations: [],
        fingerprint: 'seed',
        source: 'seed',
      });
      inserted++;
    }
    return NextResponse.json({ inserted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
