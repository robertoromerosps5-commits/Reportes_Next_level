import { Bet, DashboardStats, SportBreakdown, MonthlyPerformance, OddsRange, TipsterStats } from './types';

export function calcDashboardStats(bets: Bet[], bankrollHistory: { amount: number; date: string }[]): DashboardStats {
  const settled = bets.filter(b => b.result !== 'pending' && b.result !== 'void');
  const won = bets.filter(b => b.result === 'won');
  const lost = bets.filter(b => b.result === 'lost');
  const pending = bets.filter(b => b.result === 'pending');

  const totalProfit = settled.reduce((sum, b) => sum + b.profit, 0);
  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;
  const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : 0;
  const avgOdds = settled.length > 0 ? settled.reduce((s, b) => s + b.odds, 0) / settled.length : 0;
  const units = bets.reduce((s, b) => s + b.profit / (b.stake > 0 ? b.stake : 1), 0);
  const avgStake = bets.length > 0 ? bets.reduce((s, b) => s + b.stake, 0) / bets.length : 0;
  const bestOddsWon = won.length > 0 ? Math.max(...won.map(b => b.odds)) : 0;

  // Streak calculation
  const sorted = [...settled].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let streakType: 'won' | 'lost' | 'none' = 'none';
  if (sorted.length > 0) {
    const lastResult = sorted[0].result;
    streakType = lastResult === 'won' ? 'won' : 'lost';
    for (const b of sorted) {
      if (b.result === lastResult) streak++;
      else break;
    }
  }

  const currentBankroll = bankrollHistory.length > 0
    ? bankrollHistory[bankrollHistory.length - 1].amount + totalProfit
    : 1000 + totalProfit;
  const initialBankroll = bankrollHistory.length > 0 ? bankrollHistory[0].amount : 1000;
  const bankrollGrowth = initialBankroll > 0 ? ((currentBankroll - initialBankroll) / initialBankroll) * 100 : 0;

  // CLV proxy: average (closing odds - bet odds) / closing odds * 100
  // Since we don't track closing odds, we use 0 as placeholder
  const clv = 0;

  return {
    totalBets: bets.length,
    wonBets: won.length,
    lostBets: lost.length,
    pendingBets: pending.length,
    winRate,
    totalProfit,
    totalStaked,
    roi,
    avgOdds,
    units,
    currentBankroll,
    initialBankroll,
    bankrollGrowth,
    streak,
    streakType,
    bestOddsWon,
    avgStake,
    clv,
  };
}

export function calcSportBreakdown(bets: Bet[]): SportBreakdown[] {
  const sports = [...new Set(bets.map(b => b.sport))];
  return sports.map(sport => {
    const sportBets = bets.filter(b => b.sport === sport && b.result !== 'pending' && b.result !== 'void');
    const won = sportBets.filter(b => b.result === 'won').length;
    const profit = sportBets.reduce((s, b) => s + b.profit, 0);
    const staked = sportBets.reduce((s, b) => s + b.stake, 0);
    return {
      sport,
      bets: sportBets.length,
      won,
      profit,
      roi: staked > 0 ? (profit / staked) * 100 : 0,
      winRate: sportBets.length > 0 ? (won / sportBets.length) * 100 : 0,
    };
  }).sort((a, b) => b.bets - a.bets);
}

export function calcMonthlyPerformance(bets: Bet[]): MonthlyPerformance[] {
  const months: Record<string, Bet[]> = {};
  for (const bet of bets) {
    const month = bet.date.substring(0, 7);
    if (!months[month]) months[month] = [];
    months[month].push(bet);
  }
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthBets]) => {
      const settled = monthBets.filter(b => b.result !== 'pending' && b.result !== 'void');
      const won = settled.filter(b => b.result === 'won').length;
      const profit = settled.reduce((s, b) => s + b.profit, 0);
      const staked = settled.reduce((s, b) => s + b.stake, 0);
      return {
        month,
        bets: settled.length,
        profit,
        roi: staked > 0 ? (profit / staked) * 100 : 0,
        winRate: settled.length > 0 ? (won / settled.length) * 100 : 0,
      };
    });
}

export function calcOddsRanges(bets: Bet[]): OddsRange[] {
  const ranges = [
    { label: '1.00–1.49', min: 1.0, max: 1.49 },
    { label: '1.50–1.99', min: 1.5, max: 1.99 },
    { label: '2.00–2.99', min: 2.0, max: 2.99 },
    { label: '3.00–4.99', min: 3.0, max: 4.99 },
    { label: '5.00+', min: 5.0, max: Infinity },
  ];
  return ranges.map(({ label, min, max }) => {
    const rangeBets = bets.filter(b => b.odds >= min && b.odds <= max && b.result !== 'pending' && b.result !== 'void');
    const won = rangeBets.filter(b => b.result === 'won').length;
    const profit = rangeBets.reduce((s, b) => s + b.profit, 0);
    return {
      range: label,
      bets: rangeBets.length,
      won,
      profit,
      winRate: rangeBets.length > 0 ? (won / rangeBets.length) * 100 : 0,
    };
  }).filter(r => r.bets > 0);
}

export function calcTipsterStats(bets: Bet[]): TipsterStats[] {
  const tipsters = [...new Set(bets.map(b => b.tipster).filter(Boolean))];
  return tipsters.map(name => {
    const tipsterBets = bets.filter(b => b.tipster === name && b.result !== 'pending' && b.result !== 'void');
    const won = tipsterBets.filter(b => b.result === 'won').length;
    const profit = tipsterBets.reduce((s, b) => s + b.profit, 0);
    const staked = tipsterBets.reduce((s, b) => s + b.stake, 0);
    return {
      name,
      bets: tipsterBets.length,
      won,
      profit,
      roi: staked > 0 ? (profit / staked) * 100 : 0,
      winRate: tipsterBets.length > 0 ? (won / tipsterBets.length) * 100 : 0,
    };
  }).sort((a, b) => b.profit - a.profit);
}

export function calcValueBet(odds: number, trueProbability: number, bankroll: number): import('./types').ValueBetCalc {
  const impliedProbability = 1 / odds;
  const expectedValue = (trueProbability * (odds - 1)) - (1 - trueProbability);
  const isValue = trueProbability > impliedProbability;
  // Kelly Criterion: f = (bp - q) / b where b = odds-1, p = trueProbability, q = 1-p
  const b = odds - 1;
  const kellyCriterion = isValue ? (b * trueProbability - (1 - trueProbability)) / b : 0;
  // Use half-Kelly for safety
  const halfKelly = Math.max(0, kellyCriterion * 0.5);
  const recommendedStake = halfKelly * bankroll;
  return {
    odds,
    trueProbability,
    impliedProbability,
    expectedValue,
    isValue,
    kellyCriterion,
    recommendedStake,
  };
}
