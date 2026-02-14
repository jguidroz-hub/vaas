import { NextResponse } from 'next/server';

const ACTIVITY_LOG: any[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const category = searchParams.get('category');
  
  let filtered = [...ACTIVITY_LOG];
  if (category) filtered = filtered.filter(a => a.category === category);
  
  const total = filtered.length;
  const items = filtered.slice((page - 1) * limit, page * limit);
  
  return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = {
      id: 'act_' + Date.now().toString(36),
      ...body,
      timestamp: new Date().toISOString(),
    };
    ACTIVITY_LOG.unshift(entry);
    if (ACTIVITY_LOG.length > 1000) ACTIVITY_LOG.pop();
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
