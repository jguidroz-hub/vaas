import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// POST /api/reports — Save a Guardian/Verdict report (called by orchestrator)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.secret !== 'greenbelt-guardian-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [report] = await db.insert(reports).values({
      idea: body.idea || body.name,
      audience: body.audience || body.targetMarket,
      revenueModel: body.revenueModel,
      tier: body.tier || 'pro',
      verdict: body.verdict,
      confidence: body.confidence,
      executiveSummary: body.executiveSummary,
      debateRounds: body.debateRounds || [],
      strengths: body.strengths || [],
      risks: body.risks || [],
      proceedConditions: body.proceedConditions || [],
      enrichment: body.enrichment || null,
      email: body.email,
      totalCostUsd: body.totalCostUsd,
      durationSeconds: body.durationSeconds,
    }).returning();

    return NextResponse.json({ 
      id: report.id, 
      url: `https://vaas-greenbelt.vercel.app/report/${report.id}` 
    });
  } catch (err: any) {
    console.error('[Reports] Save failed:', err.message);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}

// GET /api/reports?id=xxx — Retrieve a report
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const result = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    if (result.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json(result[0]);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
