import { NextResponse } from 'next/server';

export async function DELETE() {
  return NextResponse.json({ message: 'Account deletion initiated' });
}
