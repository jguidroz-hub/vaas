import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || '0.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
}
