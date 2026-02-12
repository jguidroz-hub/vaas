import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/schema';
import { sql } from 'drizzle-orm';

// Reduce full idea text to a generic category-level summary
function anonymizeSummary(idea: string | null, category: string | null): string {
  if (!idea) return category ? `${category} venture` : 'Business idea';
  // Take first sentence only, cap at 80 chars
  const firstSentence = idea.split(/[.!?\n]/)[0]?.trim() || idea;
  const capped = firstSentence.length > 80 ? firstSentence.substring(0, 77) + '...' : firstSentence;
  return capped;
}

// GET /api/ideas — Return anonymized high-scoring submissions
export async function GET() {
  try {
    // Only show ideas with confidence >= 60, anonymized (no email/fingerprint)
    const raw = await db.select({
      idea: submissions.idea,
      revenueModel: submissions.revenueModel,
      confidence: submissions.confidence,
      verdict: submissions.verdict,
      category: submissions.category,
      ecosystem: submissions.ecosystem,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(sql`${submissions.confidence} >= 60`)
    .orderBy(sql`${submissions.confidence} DESC, ${submissions.createdAt} DESC`)
    .limit(100);

    // Anonymize: show only category + high-level summary, not full idea details
    const results = raw.map(r => ({
      idea: anonymizeSummary(r.idea, r.category),
      revenueModel: r.revenueModel,
      confidence: r.confidence,
      verdict: r.verdict,
      category: r.category,
      ecosystem: r.ecosystem,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ ideas: results, count: results.length });
  } catch (err: any) {
    console.error('[Ideas] Failed:', err.message);
    return NextResponse.json({ ideas: [], count: 0 });
  }
}
