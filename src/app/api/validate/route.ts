import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ── Rate Limiting ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per window
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Clean up old entries periodically
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ── Failure Pattern Database (subset of Greenbelt's 1,310+ patterns) ──
const FAILURE_PATTERNS = [
  { pattern: 'social media scheduler', risk: 'Extreme saturation (Buffer, Hootsuite, Later, etc.)', weight: 0.9 },
  { pattern: 'todo|task manager', risk: 'Over-saturated market with strong incumbents (Todoist, Things, TickTick)', weight: 0.8 },
  { pattern: 'crm|customer relationship', risk: 'Enterprise-dominated market (Salesforce, HubSpot). SMB CRMs have high churn.', weight: 0.7 },
  { pattern: 'email marketing', risk: 'Commoditized market (Mailchimp, ConvertKit). Margins compress toward zero.', weight: 0.8 },
  { pattern: 'project management', risk: 'Red ocean (Asana, Monday, Linear, Notion). New entrants die within 18 months.', weight: 0.85 },
  { pattern: 'note taking|notes app', risk: 'Feature of existing platforms. Hard to monetize. Apple Notes is free.', weight: 0.75 },
  { pattern: 'chat|messaging|slack alternative', risk: 'Network effects make switching nearly impossible. Teams/Slack/Discord lock-in.', weight: 0.9 },
  { pattern: 'ai writing|ai content', risk: 'Race to bottom. OpenAI/Anthropic APIs commoditize. No defensible moat.', weight: 0.8 },
  { pattern: 'landing page builder', risk: 'Saturated (Carrd, Framer, Webflow). Differentiation is temporary.', weight: 0.7 },
  { pattern: 'invoice|invoicing', risk: 'Embedded in accounting tools (QuickBooks, Wave, FreshBooks). Hard to unbundle.', weight: 0.65 },
  { pattern: 'time tracking', risk: 'Feature, not product. Built into every project management tool.', weight: 0.7 },
  { pattern: 'password manager', risk: 'Security-critical + trust requirements + Apple/Google building it natively.', weight: 0.85 },
  { pattern: 'vpn', risk: 'Race to bottom pricing. Privacy trust is hard to establish.', weight: 0.8 },
  { pattern: 'link shortener', risk: 'Bit.ly won. Free alternatives everywhere. Zero switching cost.', weight: 0.9 },
  { pattern: 'analytics|website analytics', risk: 'Google Analytics is free. Plausible/Fathom have privacy niche. Margins thin.', weight: 0.65 },
];

const STRENGTH_INDICATORS = [
  { pattern: 'compliance|regulation|gdpr|hipaa|sox', strength: 'Regulatory requirements create switching costs and justify pricing' },
  { pattern: 'api|integration|webhook|middleware', strength: 'Integration products have high switching costs (infrastructure lock-in)' },
  { pattern: 'vertical|niche|specific industry', strength: 'Vertical SaaS has higher retention and willingness to pay' },
  { pattern: 'migration|switch|convert|transition', strength: 'Migration tools have clear deadline-driven urgency' },
  { pattern: 'deprecat|sunset|deadline|end.of.life', strength: 'Platform deprecation creates time-sensitive demand' },
  { pattern: 'enterprise|b2b|team|organization', strength: 'B2B has higher LTV and lower churn than B2C' },
  { pattern: 'plugin|extension|app store|marketplace', strength: 'Platform ecosystems provide built-in distribution' },
  { pattern: 'workflow|automat|orchestrat', strength: 'Automation tools save measurable time — easy ROI calculation' },
  { pattern: 'monitor|alert|watchdog|detect', strength: 'Monitoring tools are "insurance" — high retention, low churn' },
  { pattern: 'data|report|dashboard|insight', strength: 'Data products compound value over time (more data = more useful)' },
];

interface ValidateRequest {
  idea: string;
  audience?: string;
  model?: string;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limited. Free tier: 5 validations/hour.' },
      { status: 429 }
    );
  }

  let body: ValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { idea, audience, model } = body;
  if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
    return NextResponse.json(
      { error: 'Please describe your idea in at least 10 characters.' },
      { status: 400 }
    );
  }

  if (idea.length > 5000) {
    return NextResponse.json(
      { error: 'Idea description must be under 5,000 characters.' },
      { status: 400 }
    );
  }

  const ideaLower = idea.toLowerCase();
  const audienceLower = (audience || '').toLowerCase();
  const combined = `${ideaLower} ${audienceLower} ${model || ''}`;

  // ── Pattern matching ──
  const matchedRisks: Array<{ risk: string; weight: number }> = [];
  for (const fp of FAILURE_PATTERNS) {
    if (new RegExp(fp.pattern, 'i').test(combined)) {
      matchedRisks.push({ risk: fp.risk, weight: fp.weight });
    }
  }

  const matchedStrengths: string[] = [];
  for (const si of STRENGTH_INDICATORS) {
    if (new RegExp(si.pattern, 'i').test(combined)) {
      matchedStrengths.push(si.strength);
    }
  }

  // ── Confidence scoring ──
  let confidence = 60; // Base confidence

  // Penalty for matched failure patterns
  const riskPenalty = matchedRisks.reduce((sum, r) => sum + r.weight * 15, 0);
  confidence -= Math.min(riskPenalty, 40);

  // Bonus for strengths
  confidence += matchedStrengths.length * 5;

  // Bonus for specificity (longer, more detailed descriptions score higher)
  if (idea.length > 200) confidence += 5;
  if (idea.length > 500) confidence += 3;
  if (audience && audience.length > 20) confidence += 5;

  // Revenue model bonuses
  if (model === 'marketplace_app') confidence += 3; // Built-in distribution
  if (model === 'usage_based') confidence += 2; // Aligns cost with value

  // Clamp
  confidence = Math.max(5, Math.min(95, Math.round(confidence)));

  // ── Verdict ──
  let verdict: string;
  if (confidence >= 75) verdict = '🟢 Strong signal — Worth building an MVP';
  else if (confidence >= 55) verdict = '🟡 Moderate signal — Validate assumptions before building';
  else if (confidence >= 35) verdict = '🟠 Weak signal — Significant risks identified';
  else verdict = '🔴 High risk — Major concerns found';

  // ── Recommendations ──
  const recommendations: string[] = [];
  if (matchedRisks.length > 0) {
    recommendations.push('Research competitors deeply — find the specific gap they\'re NOT solving');
  }
  if (!audience || audience.length < 10) {
    recommendations.push('Define your target audience more specifically (role, company size, pain frequency)');
  }
  if (confidence < 50) {
    recommendations.push('Talk to 10 potential customers before writing any code');
    recommendations.push('Consider a different angle or niche within this space');
  }
  if (matchedStrengths.length === 0) {
    recommendations.push('Add a defensible moat: compliance, integrations, vertical focus, or data network effects');
  }
  if (model === 'one_time') {
    recommendations.push('Consider switching to subscription for predictable recurring revenue');
  }
  recommendations.push('Build the smallest possible version and charge from day one');

  // ── Summary ──
  const summary = confidence >= 55
    ? `Your idea shows promise. ${matchedStrengths.length > 0 ? `Key strengths: ${matchedStrengths[0].toLowerCase()}.` : ''} ${matchedRisks.length > 0 ? `Watch out for: ${matchedRisks[0].risk.split('.')[0].toLowerCase()}.` : ''} Focus on validating your core assumption with real users.`
    : `This space has significant headwinds. ${matchedRisks.length > 0 ? matchedRisks[0].risk : 'The market is highly competitive.'} That doesn't mean it's impossible — but you'll need a very specific angle to succeed.`;

  const risks = matchedRisks.map(r => r.risk);
  const patternsMatchedCount = matchedRisks.length + matchedStrengths.length;

  // ── Flywheel: Capture submission data ──
  // Non-blocking — never let DB failures break the validation response
  const fingerprint = crypto.createHash('sha256').update(`${ip}:${request.headers.get('user-agent') || ''}`).digest('hex').slice(0, 16);
  const category = detectCategory(ideaLower);
  const ecosystem = detectEcosystem(ideaLower);

  // Non-blocking data capture — fire and forget but log errors
  captureSubmission({
    idea: idea.slice(0, 2000), // Truncate for storage
    audience: audience?.slice(0, 500),
    revenueModel: model,
    confidence,
    verdict,
    risks,
    strengths: matchedStrengths,
    recommendations,
    patternsMatched: patternsMatchedCount,
    category,
    ecosystem,
    fingerprint,
  }).catch((err) => console.error('[VaaS] Submission capture error:', err)); // Fire and forget

  return NextResponse.json({
    confidence,
    verdict,
    summary,
    risks,
    strengths: matchedStrengths,
    recommendations,
    patternsMatched: patternsMatchedCount,
    validatedAt: new Date().toISOString(),
    // Tease the build offering for viable ideas
    ...(confidence >= 50 ? {
      buildCta: {
        message: 'Want us to build this for you? Our AI factory produces production-grade apps in days, not months.',
        url: '/build',
        tier: confidence >= 75 ? 'strong_candidate' : 'moderate_candidate',
      }
    } : {}),
  });
}

// ── Category Detection ─────────────────────────────────────
function detectCategory(text: string): string {
  const categories: Array<[RegExp, string]> = [
    [/e.?commerce|shop|store|cart|merchant|retail/, 'ecommerce'],
    [/fintech|payment|banking|trading|invest|crypto/, 'fintech'],
    [/health|medical|patient|clinic|wellness/, 'healthtech'],
    [/education|learn|course|student|tutor/, 'edtech'],
    [/developer|code|api|devtool|ci.?cd|deploy/, 'devtools'],
    [/market|seo|social|content|email.*market|growth/, 'marketing'],
    [/hr|recruit|hiring|employee|team|workforce/, 'hr'],
    [/real.?estate|property|rent|mortgage/, 'realestate'],
    [/restaurant|food|delivery|kitchen|menu/, 'foodtech'],
    [/legal|compliance|contract|law/, 'legaltech'],
    [/productiv|task|project|workflow|automat/, 'productivity'],
    [/data|analytics|dashboard|report|insight/, 'analytics'],
    [/security|auth|identity|access|encrypt/, 'security'],
    [/ai|machine.?learn|llm|gpt|model/, 'ai-native'],
  ];
  for (const [re, cat] of categories) {
    if (re.test(text)) return cat;
  }
  return 'other';
}

function detectEcosystem(text: string): string {
  if (/shopify/.test(text)) return 'shopify';
  if (/bigcommerce/.test(text)) return 'bigcommerce';
  if (/chrome.*ext|browser.*ext/.test(text)) return 'chrome';
  if (/vs.?code|visual studio/.test(text)) return 'vscode';
  if (/wordpress|wp/.test(text)) return 'wordpress';
  if (/slack/.test(text)) return 'slack';
  if (/salesforce/.test(text)) return 'salesforce';
  if (/hubspot/.test(text)) return 'hubspot';
  if (/jira|atlassian|confluence/.test(text)) return 'atlassian';
  return 'standalone';
}

// ── Submission Capture (async, non-blocking) ───────────────
async function captureSubmission(data: {
  idea: string;
  audience?: string;
  revenueModel?: string;
  confidence: number;
  verdict: string;
  risks: string[];
  strengths: string[];
  recommendations: string[];
  patternsMatched: number;
  category: string;
  ecosystem: string;
  fingerprint: string;
}) {
  if (!process.env.DATABASE_URL) return; // Skip if no DB configured
  
  try {
    const { db } = await import('@/lib/db');
    const { submissions } = await import('@/lib/schema');
    
    await db.insert(submissions).values({
      idea: data.idea,
      audience: data.audience,
      revenueModel: data.revenueModel,
      confidence: data.confidence,
      verdict: data.verdict,
      risks: data.risks,
      strengths: data.strengths,
      recommendations: data.recommendations,
      patternsMatched: data.patternsMatched,
      category: data.category,
      ecosystem: data.ecosystem,
      fingerprint: data.fingerprint,
      source: 'web',
    });
  } catch (err) {
    console.error('[VaaS] Submission capture failed:', err);
  }
}
