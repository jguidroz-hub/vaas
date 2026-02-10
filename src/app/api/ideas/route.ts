import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/schema';
import { sql } from 'drizzle-orm';

// GET /api/ideas — Return anonymized high-scoring submissions
export async function GET() {
  try {
    // Only show ideas with confidence >= 60, anonymized (no email/fingerprint)
    const results = await db.select({
      idea: submissions.idea,
      audience: submissions.audience,
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

    return NextResponse.json({ ideas: results, count: results.length });
  } catch (err: any) {
    console.error('[Ideas] Failed:', err.message);
    return NextResponse.json({ ideas: [], count: 0 });
  }
}
