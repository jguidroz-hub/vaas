import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// POST /api/admin/migrate — Run DB migrations
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.GUARDIAN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Add OTP columns to subscribers (for FIX-6: DB-backed OTP)
    await db.execute(sql`
      ALTER TABLE subscribers 
      ADD COLUMN IF NOT EXISTS otp_code TEXT,
      ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0
    `);
    results.push('Added OTP columns to subscribers');
  } catch (err: any) {
    results.push(`OTP columns: ${err.message}`);
  }

  return NextResponse.json({ results });
}
