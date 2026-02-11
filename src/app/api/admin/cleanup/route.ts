import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { submissions } from '@/lib/schema';
import { sql } from 'drizzle-orm';

// POST /api/admin/cleanup — Remove test data from public-facing tables
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  if (secret !== process.env.GUARDIAN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete test/debug submissions
    const deleted = await db.delete(submissions)
      .where(sql`${submissions.idea} LIKE 'Test%' OR ${submissions.idea} LIKE 'Debug%'`)
      .returning({ id: submissions.id });

    return NextResponse.json({ deleted: deleted.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
