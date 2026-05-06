'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Target, DollarSign, Activity, Award, Clock, Zap, Bot } from 'lucide-react';
import StatCard from '@/components/StatCard';
import PageHeader from '@/components/PageHeader';
import BetBadge from '@/components/BetBadge';
import { DashboardStats, Bet } from '@/lib/types';

interface AnalyticsData {
  stats: DashboardStats;
}

const fmt = (n: number, dec = 2) => (n >= 0 ? '+' : '') + n.toFixed(dec);
const fmtMoney = (n: number) => (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2);
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/bets').then(r => r.json()),
    ]).then(([analytics, bets]) => {
      setData(analytics);
      setRecentBets((bets as Bet[]).slice(0, 8));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
          <div>Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  if (!stats) return null;

  const roiColor = stats.roi >= 0 ? 'green' : 'red';
  const profitColor = stats.totalProfit >= 0 ? 'green' : 'red';
  const growthColor = stats.bankrollGrowth >= 0 ? 'green' : 'red';

  return (
    <div style={{ padding: 24, maxWidth: 1280 }}>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen de tu rendimiento como apostador"
        actions={
          <Link href="/bets" style={{
            background: 'var(--accent)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}>
            + Nueva Apuesta
          </Link>
        }
      />

      {/* Key Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }}>
        <StatCard
          label="ROI Total"
          value={fmtPct(stats.roi)}
          sub={`${stats.totalBets - stats.pendingBets} apuestas cerradas`}
          color={roiColor}
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="P&L Total"
          value={fmtMoney(stats.totalProfit)}
          sub={`Invertido: $${stats.totalStaked.toFixed(2)}`}
          color={profitColor}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.wonBets}W / ${stats.lostBets}L / ${stats.pendingBets}P`}
          color={stats.winRate >= 50 ? 'green' : 'red'}
          icon={<Target size={16} />}
        />
        <StatCard
          label="Bankroll"
          value={`$${stats.currentBankroll.toFixed(2)}`}
          sub={`${fmtPct(stats.bankrollGrowth)} desde inicio`}
          color={growthColor}
          icon={<Activity size={16} />}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard
          label="Cuota Media"
          value={stats.avgOdds.toFixed(2)}
          sub="Apuestas cerradas"
          color="purple"
          icon={<Award size={16} />}
        />
        <StatCard
          label="Stake Medio"
          value={`$${stats.avgStake.toFixed(2)}`}
          sub="Por apuesta"
          color="default"
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Racha Actual"
          value={stats.streak > 0 ? `${stats.streak} ${stats.streakType === 'won' ? '🟢' : '🔴'}` : '—'}
          sub={stats.streakType !== 'none' ? (stats.streakType === 'won' ? 'victorias seguidas' : 'derrotas seguidas') : 'sin datos'}
          color={stats.streakType === 'won' ? 'green' : stats.streakType === 'lost' ? 'red' : 'default'}
          icon={<Zap size={16} />}
        />
        <StatCard
          label="Pendientes"
          value={String(stats.pendingBets)}
          sub="Apuestas activas"
          color={stats.pendingBets > 0 ? 'yellow' : 'default'}
          icon={<Clock size={16} />}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Recent Bets */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>Últimas Apuestas</h2>
            <Link href="/bets" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          {recentBets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>No hay apuestas registradas aún.</p>
              <Link href="/bets" style={{ color: 'var(--accent)', fontSize: 13 }}>Agregar primera apuesta →</Link>
            </div>
          ) : (
            <div>
              {recentBets.map(bet => (
                <div key={bet.id} style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 2 }}>
                      {bet.event} — <span style={{ color: 'var(--text-muted)' }}>{bet.selection}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {bet.sport} · {bet.league} · {bet.date} · Cuota: <strong style={{ color: '#e2e8f0' }}>{bet.odds}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: bet.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {bet.result !== 'pending' ? fmtMoney(bet.profit) : `$${bet.stake}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Stake: ${bet.stake}
                    </div>
                  </div>
                  <BetBadge result={bet.result} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + AI tip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AI Agent promo */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 12,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Bot size={20} color="#818cf8" />
              <span style={{ fontWeight: 600, color: '#c7d2fe', fontSize: 14 }}>Agente IA</span>
            </div>
            <p style={{ fontSize: 13, color: '#a5b4fc', margin: '0 0 14px', lineHeight: 1.5 }}>
              Analiza partidos en tiempo real, detecta value bets, investiga tipsters y diseña tu metodología ganadora.
            </p>
            <Link href="/agent" style={{
              display: 'block',
              background: 'rgba(99,102,241,0.3)',
              color: '#c7d2fe',
              padding: '9px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              textAlign: 'center',
              border: '1px solid rgba(99,102,241,0.4)',
            }}>
              Consultar al Agente →
            </Link>
          </div>

          {/* Quick stats */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Resumen Rápido</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Mejor cuota ganada', value: stats.bestOddsWon > 0 ? stats.bestOddsWon.toFixed(2) : '—' },
                { label: 'Bankroll inicial', value: `$${stats.initialBankroll.toFixed(2)}` },
                { label: 'Crecimiento', value: fmtPct(stats.bankrollGrowth), color: stats.bankrollGrowth >= 0 ? '#22c55e' : '#ef4444' },
                { label: 'Total apuestas', value: String(stats.totalBets) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: row.color || '#e2e8f0' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value calculator promo */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
              <TrendingUp size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Analytics Detallado
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Curva de bankroll, rendimiento por deporte, rangos de cuotas y análisis de tipsters.
            </p>
            <Link href="/analytics" style={{
              display: 'block',
              background: 'var(--surface-2)',
              color: 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              Ver Analytics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
