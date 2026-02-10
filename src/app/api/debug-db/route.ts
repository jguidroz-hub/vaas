import { NextResponse } from 'next/server';

export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  
  if (!hasDbUrl) {
    return NextResponse.json({ error: 'No DATABASE_URL', env: Object.keys(process.env).filter(k => k.includes('DATA') || k.includes('NEON')).join(', ') });
  }

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT count(*) as cnt FROM vaas_submissions`;
    return NextResponse.json({ ok: true, count: result[0].cnt, dbUrlPrefix: process.env.DATABASE_URL!.slice(0, 30) + '...' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
