import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min cache

export async function GET() {
  try {
    // Total submissions
    const [{ count: totalSubmissions }] = await db.select({ count: sql<number>`count(*)` }).from(submissions);
    
    // Average confidence
    const [{ avg: avgConfidence }] = await db.select({ avg: sql<number>`round(avg(${submissions.confidence}))` }).from(submissions);
    
    // High confidence count
    const [{ count: highConfidenceCount }] = await db.select({ count: sql<number>`count(*)` }).from(submissions).where(sql`${submissions.confidence} >= 70`);
    
    // Top categories
    const topCategories = await db.execute(sql`
      SELECT ${submissions.category} as category, 
             count(*) as count, 
             round(avg(${submissions.confidence})) as "avgConfidence"
      FROM ${submissions} 
      WHERE ${submissions.category} IS NOT NULL 
      GROUP BY ${submissions.category} 
      ORDER BY count(*) DESC 
      LIMIT 10
    `);

    // Top ecosystems
    const topEcosystems = await db.execute(sql`
      SELECT ${submissions.ecosystem} as ecosystem, count(*) as count 
      FROM ${submissions} 
      WHERE ${submissions.ecosystem} IS NOT NULL 
      GROUP BY ${submissions.ecosystem} 
      ORDER BY count(*) DESC 
      LIMIT 6
    `);

    // Recent high-scoring (anonymized)
    const recentHighScoring = await db.select({
      idea: submissions.idea,
      confidence: submissions.confidence,
      category: submissions.category,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(sql`${submissions.confidence} >= 65`)
    .orderBy(sql`${submissions.createdAt} DESC`)
    .limit(10);

    return NextResponse.json({
      totalSubmissions: Number(totalSubmissions) || 0,
      avgConfidence: Number(avgConfidence) || 0,
      highConfidenceCount: Number(highConfidenceCount) || 0,
      topCategories: topCategories.rows || [],
      topEcosystems: topEcosystems.rows || [],
      recentHighScoring,
    });
  } catch (err: any) {
    console.error('[Trends] Failed:', err.message);
    return NextResponse.json({ totalSubmissions: 0, avgConfidence: 0, highConfidenceCount: 0, topCategories: [], topEcosystems: [], recentHighScoring: [] });
  }
}
