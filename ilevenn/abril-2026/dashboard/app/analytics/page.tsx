'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie, Legend,
} from 'recharts';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { DashboardStats, SportBreakdown, MonthlyPerformance, OddsRange, TipsterStats } from '@/lib/types';
import { TrendingUp, TrendingDown, Target, DollarSign, Calculator } from 'lucide-react';
import { calcValueBet } from '@/lib/stats';

interface AnalyticsData {
  stats: DashboardStats;
  sportBreakdown: SportBreakdown[];
  monthlyPerformance: MonthlyPerformance[];
  oddsRanges: OddsRange[];
  tipsterStats: TipsterStats[];
  bankrollCurve: { date: string; bankroll: number }[];
}

const PIE_COLORS = ['#6c63ff', '#22c55e', '#ef4444', '#eab308', '#06b6d4', '#f97316'];

const fmtMoney = (n: number) => `${n >= 0 ? '+' : ''}$${n.toFixed(2)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  // Value bet calculator state
  const [vbOdds, setVbOdds] = useState(2.5);
  const [vbProb, setVbProb] = useState(0.45);
  const [vbBankroll, setVbBankroll] = useState(1000);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => {
      setData(d);
      if (d.stats.currentBankroll) setVbBankroll(d.stats.currentBankroll);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando analytics...</div>
    </div>
  );

  if (!data) return null;
  const { stats, sportBreakdown, monthlyPerformance, oddsRanges, tipsterStats, bankrollCurve } = data;
  const vbCalc = calcValueBet(vbOdds, vbProb, vbBankroll);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
          {payload.map((p: any) => (
            <div key={p.name} style={{ color: p.color }}>
              {p.name}: {typeof p.value === 'number' ? (p.name.includes('$') || p.name === 'Bankroll' ? `$${p.value.toFixed(2)}` : p.value.toFixed(1)) : p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const pieData = sportBreakdown.slice(0, 6).map(s => ({ name: s.sport, value: s.bets }));
  const hasEnoughData = monthlyPerformance.length > 0 || bankrollCurve.length > 1;

  return (
    <div style={{ padding: 24, maxWidth: 1280 }}>
      <PageHeader
        title="Analytics"
        subtitle="Rendimiento detallado, tendencias y herramientas de análisis"
      />

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="ROI" value={fmtPct(stats.roi)} sub={`${stats.totalBets - stats.pendingBets} apuestas`} color={stats.roi >= 0 ? 'green' : 'red'} icon={<TrendingUp size={16} />} />
        <StatCard label="P&L Total" value={fmtMoney(stats.totalProfit)} sub={`Invertido: $${stats.totalStaked.toFixed(0)}`} color={stats.totalProfit >= 0 ? 'green' : 'red'} icon={<DollarSign size={16} />} />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} sub={`${stats.wonBets}W / ${stats.lostBets}L`} color={stats.winRate >= 50 ? 'green' : 'red'} icon={<Target size={16} />} />
        <StatCard label="Crecimiento" value={fmtPct(stats.bankrollGrowth)} sub={`$${stats.initialBankroll.toFixed(0)} → $${stats.currentBankroll.toFixed(0)}`} color={stats.bankrollGrowth >= 0 ? 'green' : 'red'} icon={<TrendingUp size={16} />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Bankroll Curve */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>Curva de Bankroll</h3>
          {bankrollCurve.length < 2 ? (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Registra más apuestas para ver la curva
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={bankrollCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={customTooltip} />
                <ReferenceLine y={stats.initialBankroll} stroke="var(--border)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="bankroll" stroke="#6c63ff" strokeWidth={2} dot={false} name="Bankroll" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly P&L */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>P&L Mensual</h3>
          {monthlyPerformance.length === 0 ? (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Registra apuestas para ver el rendimiento mensual
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={customTooltip} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]} name="P&L ($)">
                  {monthlyPerformance.map((m, i) => (
                    <Cell key={i} fill={m.profit >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Sport breakdown table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Por Deporte</h3>
          </div>
          {sportBreakdown.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>Sin datos</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Deporte', 'Apuestas', 'ROI', 'P&L'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sportBreakdown.map(s => (
                  <tr key={s.sport} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px', fontSize: 12 }}>{s.sport}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{s.bets}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: s.roi >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{s.roi.toFixed(1)}%</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: s.profit >= 0 ? '#22c55e' : '#ef4444' }}>{fmtMoney(s.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Odds ranges */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Rangos de Cuota</h3>
          </div>
          {oddsRanges.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>Sin datos</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Rango', 'Apuestas', 'Win%', 'P&L'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {oddsRanges.map(r => (
                  <tr key={r.range} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px', fontSize: 12 }}>{r.range}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{r.bets}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: r.winRate >= 50 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{r.winRate.toFixed(0)}%</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: r.profit >= 0 ? '#22c55e' : '#ef4444' }}>{fmtMoney(r.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tipster breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Tipsters</h3>
          </div>
          {tipsterStats.length === 0 ? (
            <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>Sin tipsters registrados</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Tipster', 'Bets', 'ROI', 'P&L'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tipsterStats.map(t => (
                  <tr key={t.name} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: '#818cf8' }}>@{t.name}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{t.bets}</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: t.roi >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{t.roi.toFixed(1)}%</td>
                    <td style={{ padding: '8px 14px', fontSize: 12, color: t.profit >= 0 ? '#22c55e' : '#ef4444' }}>{fmtMoney(t.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Value Bet Calculator */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Calculator size={15} color="var(--accent)" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>Calculadora Value Bet + Kelly Criterion</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>CUOTA</label>
            <input type="number" step="0.05" min="1.01" value={vbOdds}
              onChange={e => setVbOdds(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>PROBABILIDAD REAL (0-1)</label>
            <input type="number" step="0.01" min="0.01" max="0.99" value={vbProb}
              onChange={e => setVbProb(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>BANKROLL ($)</label>
            <input type="number" step="10" min="1" value={vbBankroll}
              onChange={e => setVbBankroll(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 15, fontWeight: 700 }} />
          </div>
          <div style={{
            background: vbCalc.isValue ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${vbCalc.isValue ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            borderRadius: 8, padding: '10px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>VEREDICTO</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: vbCalc.isValue ? '#22c55e' : '#ef4444' }}>
              {vbCalc.isValue ? '✓ HAY VALOR' : '✗ SIN VALOR'}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 12 }}>
          {[
            { label: 'Prob. Implícita', value: `${(vbCalc.impliedProbability * 100).toFixed(1)}%`, color: 'default' },
            { label: 'Prob. Real', value: `${(vbCalc.trueProbability * 100).toFixed(1)}%`, color: 'purple' },
            { label: 'Expected Value', value: vbCalc.expectedValue.toFixed(3), color: vbCalc.expectedValue > 0 ? 'green' : 'red' },
            { label: 'Kelly (½)', value: `${(vbCalc.kellyCriterion * 50).toFixed(1)}%`, color: vbCalc.isValue ? 'green' : 'default' },
            { label: 'Stake Rec.', value: vbCalc.isValue ? `$${vbCalc.recommendedStake.toFixed(2)}` : '$0', color: vbCalc.isValue ? 'green' : 'default' },
          ].map(item => {
            const colors = {
              green: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', text: '#22c55e' },
              red: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
              purple: { bg: 'rgba(108,99,255,0.08)', border: 'rgba(108,99,255,0.2)', text: '#818cf8' },
              default: { bg: 'var(--surface-2)', border: 'var(--border)', text: '#e2e8f0' },
            };
            const c = colors[item.color as keyof typeof colors] || colors.default;
            return (
              <div key={item.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{item.value}</div>
              </div>
            );
          })}
        </div>
        {vbCalc.isValue && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, fontSize: 12, color: '#86efac' }}>
            💡 Esta apuesta tiene valor positivo. El Kelly sugiere apostar el {(vbCalc.kellyCriterion * 50).toFixed(1)}% del bankroll (Half-Kelly por seguridad) = <strong>${vbCalc.recommendedStake.toFixed(2)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
