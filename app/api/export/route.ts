import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Export endpoint ready', format: 'csv', status: 'ok' });
}
