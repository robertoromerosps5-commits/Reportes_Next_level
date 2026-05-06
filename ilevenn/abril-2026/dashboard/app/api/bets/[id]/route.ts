import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BetInput } from '@/lib/types';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body: BetInput = await req.json();

    const { date, sport, league, event, market, selection, odds, stake, units, result, tipster, notes, value_bet } = body;

    let profit = 0;
    if (result === 'won') profit = (odds - 1) * stake;
    else if (result === 'lost') profit = -stake;
    else if (result === 'cashout') profit = (body.profit ?? 0) - stake;
    else if (result === 'void') profit = 0;

    db.prepare(`
      UPDATE bets SET date=?, sport=?, league=?, event=?, market=?, selection=?, odds=?, stake=?, units=?, result=?, profit=?, tipster=?, notes=?, value_bet=?
      WHERE id=?
    `).run(date, sport, league, event, market, selection, odds, stake, units || 1, result, profit, tipster || '', notes || '', value_bet ? 1 : 0, id);

    return NextResponse.json({ success: true, profit });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error updating bet' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM bets WHERE id=?').run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error deleting bet' }, { status: 500 });
  }
}
