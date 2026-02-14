import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ timezone: 'UTC', emailNotifications: true, weeklyDigest: true });
}

export async function PUT(request: Request) {
  try {
    const settings = await request.json();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
