export type BetResult = 'pending' | 'won' | 'lost' | 'void' | 'cashout';

export interface Bet {
  id: number;
  date: string;
  sport: string;
  league: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  units: number;
  result: BetResult;
  profit: number;
  tipster: string;
  notes: string;
  value_bet: number;
  created_at: string;
}

export interface BetInput {
  date: string;
  sport: string;
  league: string;
  event: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  units: number;
  result: BetResult;
  profit?: number;
  tipster?: string;
  notes?: string;
  value_bet?: number | boolean;
}

export interface BankrollEntry {
  id: number;
  amount: number;
  date: string;
  description: string;
  created_at: string;
}

export interface DashboardStats {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  winRate: number;
  totalProfit: number;
  totalStaked: number;
  roi: number;
  avgOdds: number;
  units: number;
  currentBankroll: number;
  initialBankroll: number;
  bankrollGrowth: number;
  streak: number;
  streakType: 'won' | 'lost' | 'none';
  bestOddsWon: number;
  avgStake: number;
  clv: number;
}

export interface SportBreakdown {
  sport: string;
  bets: number;
  won: number;
  profit: number;
  roi: number;
  winRate: number;
}

export interface MonthlyPerformance {
  month: string;
  bets: number;
  profit: number;
  roi: number;
  winRate: number;
}

export interface OddsRange {
  range: string;
  bets: number;
  won: number;
  profit: number;
  winRate: number;
}

export interface Tipster {
  id: number;
  name: string;
  sport: string;
  notes: string;
  created_at: string;
}

export interface TipsterStats {
  name: string;
  bets: number;
  won: number;
  profit: number;
  roi: number;
  winRate: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ValueBetCalc {
  odds: number;
  trueProbability: number;
  impliedProbability: number;
  expectedValue: number;
  isValue: boolean;
  kellyCriterion: number;
  recommendedStake: number;
}
