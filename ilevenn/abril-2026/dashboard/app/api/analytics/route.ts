import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Bet, BankrollEntry } from '@/lib/types';
import { calcDashboardStats, calcSportBreakdown, calcMonthlyPerformance, calcOddsRanges, calcTipsterStats } from '@/lib/stats';

export async function GET() {
  try {
    const db = getDb();
    const bets = db.prepare('SELECT * FROM bets ORDER BY date ASC').all() as Bet[];
    const bankrollHistory = db.prepare('SELECT * FROM bankroll ORDER BY date ASC').all() as BankrollEntry[];

    const stats = calcDashboardStats(bets, bankrollHistory);
    const sportBreakdown = calcSportBreakdown(bets);
    const monthlyPerformance = calcMonthlyPerformance(bets);
    const oddsRanges = calcOddsRanges(bets);
    const tipsterStats = calcTipsterStats(bets);

    // Bankroll curve: cumulative profit over time
    const sorted = [...bets]
      .filter(b => b.result !== 'pending' && b.result !== 'void')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const initialBankroll = bankrollHistory.length > 0 ? bankrollHistory[0].amount : 1000;
    let cumulative = initialBankroll;
    const bankrollCurve = sorted.map(b => {
      cumulative += b.profit;
      return { date: b.date, bankroll: Math.round(cumulative * 100) / 100 };
    });

    if (bankrollCurve.length === 0) {
      bankrollCurve.push({ date: new Date().toISOString().split('T')[0], bankroll: initialBankroll });
    }

    return NextResponse.json({ stats, sportBreakdown, monthlyPerformance, oddsRanges, tipsterStats, bankrollCurve });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 });
  }
}
