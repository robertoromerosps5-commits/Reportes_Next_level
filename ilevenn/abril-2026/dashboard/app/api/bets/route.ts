import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BetInput } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const bets = db.prepare('SELECT * FROM bets ORDER BY date DESC, created_at DESC').all();
    return NextResponse.json(bets);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error fetching bets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body: BetInput = await req.json();

    const { date, sport, league, event, market, selection, odds, stake, units, result, tipster, notes, value_bet } = body;

    // Calculate profit
    let profit = 0;
    if (result === 'won') profit = (odds - 1) * stake;
    else if (result === 'lost') profit = -stake;
    else if (result === 'cashout') profit = (body.profit ?? 0) - stake;
    else if (result === 'void') profit = 0;

    const stmt = db.prepare(`
      INSERT INTO bets (date, sport, league, event, market, selection, odds, stake, units, result, profit, tipster, notes, value_bet)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(date, sport, league, event, market, selection, odds, stake, units || 1, result, profit, tipster || '', notes || '', value_bet ? 1 : 0);

    return NextResponse.json({ id: info.lastInsertRowid, profit }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error creating bet' }, { status: 500 });
  }
}
