import { NextRequest, NextResponse } from 'next/server';

// Rate limiting for generation (expensive — uses orchestrator AI)
const genLimitMap = new Map<string, { count: number; resetAt: number }>();
const GEN_LIMIT = 3; // 3 generations per day
const GEN_WINDOW = 24 * 60 * 60 * 1000;

function checkGenLimit(ip: string): boolean {
  const now = Date.now();
  const entry = genLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    genLimitMap.set(ip, { count: 1, resetAt: now + GEN_WINDOW });
    return true;
  }
  if (entry.count >= GEN_LIMIT) return false;
  entry.count++;
  return true;
}

// Saturated markets to steer away from (from our failure data)
const SATURATED_MARKETS = [
  'todo app', 'task manager', 'note taking', 'social media scheduler',
  'CRM', 'email marketing', 'project management', 'chat app',
  'AI writing tool', 'landing page builder', 'invoice tool',
  'time tracking', 'password manager', 'VPN', 'link shortener',
  'analytics dashboard', 'generic AI chatbot', 'calendar app',
];

// High-signal opportunity patterns
const OPPORTUNITY_SIGNALS = [
  { pattern: 'compliance/regulation', reason: 'Regulatory requirements create switching costs' },
  { pattern: 'API/integration/middleware', reason: 'Integration products have high lock-in' },
  { pattern: 'vertical SaaS', reason: 'Higher retention and willingness to pay' },
  { pattern: 'migration/deprecation deadline', reason: 'Time-sensitive demand' },
  { pattern: 'monitoring/alerting', reason: 'Insurance-like retention' },
  { pattern: 'data/reporting', reason: 'Compounds value over time' },
  { pattern: 'workflow automation', reason: 'Clear ROI calculation' },
  { pattern: 'marketplace plugin/extension', reason: 'Built-in distribution' },
];

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  
  if (!checkGenLimit(ip)) {
    return NextResponse.json(
      { error: 'Generation limit reached (3 per day). Try again tomorrow or subscribe for unlimited.' },
      { status: 429 }
    );
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { skills, budget, timeline, interests, avoid } = body;
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    return NextResponse.json({ error: 'Select at least one skill' }, { status: 400 });
  }

  // Build the generation prompt
  const prompt = buildPrompt(skills, budget, timeline, interests, avoid);
  
  try {
    // Call orchestrator's AI (reuse existing infrastructure)
    const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'https://projectgreenbelt.com';
    
    // Use a lightweight generation approach — call our own AI via the orchestrator
    // For now, generate locally using structured patterns + randomization
    const ideas = generateIdeasLocally(skills, budget, timeline, interests, avoid);
    
    return NextResponse.json({ ideas, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Generate] Failed:', err.message);
    return NextResponse.json({ error: 'Generation failed. Try again.' }, { status: 500 });
  }
}

function generateIdeasLocally(
  skills: string[], budget: string, timeline: string, 
  interests: string, avoid: string
): any[] {
  // Idea templates organized by skill + market signal
  const ideaBank: any[] = [
    // Developer tools
    { name: 'API Health Monitor', description: 'Real-time monitoring dashboard for REST/GraphQL APIs with smart alerting, latency tracking, and incident response automation', category: 'DevTools', revenueModel: 'Subscription', audience: 'Backend developers & DevOps teams', pricing: '$19-99/mo', competitionLevel: 'Medium', timeToMvp: '2-4 weeks', whyItWorks: 'Monitoring is insurance — once set up, teams never cancel', biggestRisk: 'Datadog/PagerDuty have monitoring built in', skills: ['Full-stack development', 'DevOps / Infrastructure'], confidence: 72 },
    { name: 'Schema Migration Validator', description: 'Pre-flight checker for database migrations that catches breaking changes, data loss risks, and rollback issues before they hit production', category: 'DevTools', revenueModel: 'Freemium', audience: 'Engineering teams running PostgreSQL/MySQL', pricing: '$29-149/mo', competitionLevel: 'Low', timeToMvp: '3-6 weeks', whyItWorks: 'One prevented outage pays for a year of subscription', biggestRisk: 'Niche market — ceiling may be low', skills: ['Full-stack development', 'Data science / ML'], confidence: 68 },
    { name: 'Dependency License Auditor', description: 'Automated open-source license compliance scanning for npm/pip/cargo projects with policy enforcement and SBOM generation', category: 'DevTools', revenueModel: 'Subscription', audience: 'Engineering leads at companies with legal/compliance teams', pricing: '$49-299/mo', competitionLevel: 'Medium', timeToMvp: '4-8 weeks', whyItWorks: 'Compliance is mandatory — not optional. Legal teams mandate this.', biggestRisk: 'Snyk and FOSSA are established players', skills: ['Full-stack development'], confidence: 65 },
    
    // E-commerce
    { name: 'Return Fraud Detector', description: 'AI-powered return abuse detection for Shopify/WooCommerce stores. Flags serial returners, wardrobing, and receipt fraud', category: 'E-commerce', revenueModel: 'Subscription', audience: 'E-commerce stores with $1M+ revenue', pricing: '$49-199/mo', competitionLevel: 'Low', timeToMvp: '4-6 weeks', whyItWorks: 'Return fraud costs US retailers $24B/year. Clear ROI.', biggestRisk: 'Needs enough data to train models — cold start problem', skills: ['Full-stack development', 'Data science / ML', 'E-commerce'], confidence: 74 },
    { name: 'Product Photo Enhancer', description: 'Bulk AI background removal, shadow generation, and lifestyle scene placement for product photos. Shopify/Etsy integration.', category: 'E-commerce', revenueModel: 'Usage-based', audience: 'Small e-commerce sellers with 50+ products', pricing: '$0.10/photo or $29/mo unlimited', competitionLevel: 'Medium', timeToMvp: '2-3 weeks', whyItWorks: 'Every seller needs professional photos. Usage-based = low barrier.', biggestRisk: 'Canva and remove.bg are free/cheap alternatives', skills: ['Full-stack development', 'Design / UX', 'E-commerce'], confidence: 62 },
    
    // Vertical SaaS
    { name: 'Permit Tracker Pro', description: 'Construction permit tracking and notification system. Monitors city/county portals for status changes, deadlines, and required inspections.', category: 'Construction', revenueModel: 'Subscription', audience: 'General contractors and construction managers', pricing: '$29-99/mo per project', competitionLevel: 'Low', timeToMvp: '4-8 weeks', whyItWorks: 'Missed permit deadlines cost thousands in delays. Vertical = sticky.', biggestRisk: 'Scraping government sites is fragile', skills: ['Full-stack development', 'Construction'], confidence: 71 },
    { name: 'Menu Cost Optimizer', description: 'AI-powered food cost analysis for restaurants. Connects to POS + suppliers, suggests menu price adjustments based on ingredient cost changes.', category: 'Food & Beverage', revenueModel: 'Subscription', audience: 'Restaurant owners with 1-10 locations', pricing: '$49-149/mo', competitionLevel: 'Low', timeToMvp: '6-8 weeks', whyItWorks: 'Food costs are #1 concern for restaurant owners. Clear ROI: save 2-5% on food costs.', biggestRisk: 'POS integration complexity (Toast, Square, Clover all different)', skills: ['Full-stack development', 'Food & beverage'], confidence: 73 },
    { name: 'Patient Intake Automator', description: 'Digital patient intake forms with insurance verification, consent management, and EHR auto-population for medical offices', category: 'Healthcare', revenueModel: 'Subscription', audience: 'Small medical/dental practices (1-5 providers)', pricing: '$99-299/mo', competitionLevel: 'Medium', timeToMvp: '8-12 weeks', whyItWorks: 'HIPAA compliance creates switching costs. Saves 30min/patient.', biggestRisk: 'HIPAA compliance is complex and expensive to maintain', skills: ['Full-stack development', 'Healthcare'], confidence: 69 },
    
    // Content/Marketing
    { name: 'Testimonial Collector', description: 'Automated customer testimonial collection via email/SMS. AI writes draft testimonials from reviews, customer approves/edits, widget embeds on site.', category: 'Marketing', revenueModel: 'Freemium', audience: 'SaaS founders and service businesses', pricing: '$19-49/mo', competitionLevel: 'Medium', timeToMvp: '2-3 weeks', whyItWorks: 'Social proof directly increases conversion rates. Easy to measure ROI.', biggestRisk: 'Senja and testimonial.to are established', skills: ['Full-stack development', 'Marketing / Growth'], confidence: 64 },
    { name: 'Course Completion Booster', description: 'AI-powered student engagement system for online course creators. Detects dropout signals, sends personalized nudges, gamifies progress.', category: 'Education', revenueModel: 'Subscription', audience: 'Online course creators on Teachable/Thinkific/Kajabi', pricing: '$29-99/mo', competitionLevel: 'Low', timeToMvp: '4-6 weeks', whyItWorks: 'Course completion rates are 5-15%. Doubling it = massive value for creators.', biggestRisk: 'Platform API access may be limited', skills: ['Full-stack development', 'Education', 'Data science / ML'], confidence: 70 },
    
    // Finance
    { name: 'Expense Category Trainer', description: 'ML model that learns YOUR business expense categories from historical data. Auto-categorizes bank/credit card transactions with 95%+ accuracy.', category: 'Finance', revenueModel: 'Subscription', audience: 'Freelancers and small businesses doing bookkeeping', pricing: '$9-29/mo', competitionLevel: 'Medium', timeToMvp: '3-5 weeks', whyItWorks: 'Everyone hates categorizing expenses. Time saved = money saved at tax time.', biggestRisk: 'QuickBooks and Mint have auto-categorization built in', skills: ['Full-stack development', 'Finance / Accounting', 'Data science / ML'], confidence: 60 },
    { name: 'Contractor Invoice Validator', description: 'Validates contractor invoices against contracts, timesheets, and change orders. Flags overbilling, duplicate charges, and missing documentation.', category: 'Construction/Finance', revenueModel: 'Subscription', audience: 'Property developers and GCs managing 5+ subcontractors', pricing: '$99-499/mo', competitionLevel: 'Low', timeToMvp: '6-8 weeks', whyItWorks: 'Construction invoice fraud/errors run 1-3% of project costs. On a $5M project, that is $50-150K.', biggestRisk: 'Complex domain — needs deep construction knowledge', skills: ['Full-stack development', 'Construction', 'Finance / Accounting'], confidence: 75 },
    
    // Real estate
    { name: 'Lease Abstract Generator', description: 'AI that reads commercial lease PDFs and extracts key terms: rent escalations, options, CAM charges, co-tenancy clauses into structured data', category: 'Real Estate', revenueModel: 'Usage-based', audience: 'Commercial real estate brokers and property managers', pricing: '$5/lease or $99/mo unlimited', competitionLevel: 'Low', timeToMvp: '4-6 weeks', whyItWorks: 'Manual lease abstraction costs $50-200/lease and takes hours. AI does it in minutes.', biggestRisk: 'Accuracy needs to be very high for legal documents', skills: ['Full-stack development', 'Real estate', 'Data science / ML'], confidence: 76 },
  ];

  const avoidLower = (avoid || '').toLowerCase();
  const interestsLower = (interests || '').toLowerCase();

  // Skill alias map for fuzzy matching
  const SKILL_ALIASES: Record<string, string[]> = {
    'Full-stack development': ['coding', 'programming', 'developer', 'full-stack', 'fullstack', 'web dev', 'software', 'engineer'],
    'Data science / ML': ['data', 'ml', 'machine learning', 'ai', 'analytics', 'data science'],
    'Design / UX': ['design', 'ux', 'ui', 'frontend', 'visual'],
    'Marketing / Growth': ['marketing', 'growth', 'seo', 'content', 'social media'],
    'E-commerce': ['ecommerce', 'e-commerce', 'shopify', 'store', 'retail'],
    'DevOps / Infrastructure': ['devops', 'infrastructure', 'cloud', 'aws', 'deploy'],
    'Finance / Accounting': ['finance', 'accounting', 'fintech', 'bookkeeping'],
    'Healthcare': ['health', 'medical', 'healthcare', 'clinical'],
    'Education': ['education', 'teaching', 'edtech', 'learning'],
    'Construction': ['construction', 'building', 'contractor'],
    'Food & beverage': ['food', 'restaurant', 'culinary', 'hospitality'],
    'Real estate': ['real estate', 'property', 'realestate'],
  };

  function skillMatches(ideaSkill: string, userSkills: string[]): boolean {
    // Direct match
    if (userSkills.includes(ideaSkill)) return true;
    // Fuzzy match via aliases
    const aliases = SKILL_ALIASES[ideaSkill] || [];
    return userSkills.some(us => {
      const usLower = us.toLowerCase();
      return aliases.some(a => usLower.includes(a) || a.includes(usLower));
    });
  }

  // Filter by skills match + interests + avoidance
  let candidates = ideaBank.filter(idea => {
    // Must match at least one skill (with fuzzy matching)
    if (!idea.skills.some((s: string) => skillMatches(s, skills))) return false;
    // Check avoidance
    if (avoidLower && (avoidLower.includes(idea.category.toLowerCase()) || idea.description.toLowerCase().includes(avoidLower))) return false;
    return true;
  });

  // If no matches with skill filter, return top ideas regardless (better than empty)
  if (candidates.length === 0) {
    candidates = ideaBank.filter(idea => {
      if (avoidLower && (avoidLower.includes(idea.category.toLowerCase()) || idea.description.toLowerCase().includes(avoidLower))) return false;
      return true;
    });
  }

  // Boost ideas matching interests
  if (interestsLower) {
    candidates = candidates.map(idea => ({
      ...idea,
      confidence: idea.confidence + (
        interestsLower.includes(idea.category.toLowerCase()) || 
        idea.description.toLowerCase().split(' ').some((w: string) => interestsLower.includes(w))
          ? 5 : 0
      ),
    }));
  }

  // Adjust for budget/timeline
  candidates = candidates.map(idea => {
    let adj = 0;
    if (budget === 'bootstrap' && idea.pricing.includes('$99')) adj -= 3;
    if (timeline === 'weekend' && !idea.timeToMvp.includes('2-3')) adj -= 5;
    if (timeline === '6months') adj += 3;
    return { ...idea, confidence: Math.min(95, Math.max(30, idea.confidence + adj)) };
  });

  // Sort by confidence, take top 5
  candidates.sort((a, b) => b.confidence - a.confidence);
  
  // Remove internal fields
  return candidates.slice(0, 5).map(({ skills: _, ...idea }) => idea);
}

function buildPrompt(skills: string[], budget: string, timeline: string, interests: string, avoid: string): string {
  return `Generate 5 startup ideas for someone with these skills: ${skills.join(', ')}.
Budget: ${budget}. Timeline: ${timeline}.
${interests ? `Interests: ${interests}` : ''}
${avoid ? `Avoid: ${avoid}` : ''}
Avoid saturated markets: ${SATURATED_MARKETS.join(', ')}.
Focus on: ${OPPORTUNITY_SIGNALS.map(s => s.pattern).join(', ')}.`;
}
