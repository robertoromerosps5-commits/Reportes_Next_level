import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const entries = db.prepare('SELECT * FROM bankroll ORDER BY date ASC').all();
    return NextResponse.json(entries);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error fetching bankroll' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { amount, date, description } = await req.json();
    const info = db.prepare('INSERT INTO bankroll (amount, date, description) VALUES (?, ?, ?)').run(amount, date, description || '');
    return NextResponse.json({ id: info.lastInsertRowid }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error adding bankroll entry' }, { status: 500 });
  }
}
