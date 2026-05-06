'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, X, ChevronUp, ChevronDown } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BetBadge from '@/components/BetBadge';
import { Bet, BetInput, BetResult } from '@/lib/types';

const SPORTS = ['Fútbol', 'Baloncesto', 'Tenis', 'Béisbol', 'Hockey', 'Fútbol Americano', 'MMA', 'Rugby', 'Otro'];
const MARKETS = ['1X2', 'Doble Oportunidad', 'Handicap', 'O/U Goles', 'BTTS', 'Próximo Gol', 'Total Corners', 'Antepost', 'Otro'];
const RESULTS: BetResult[] = ['pending', 'won', 'lost', 'void', 'cashout'];

const emptyForm = (): BetInput => ({
  date: new Date().toISOString().split('T')[0],
  sport: 'Fútbol',
  league: '',
  event: '',
  market: '1X2',
  selection: '',
  odds: 2.0,
  stake: 10,
  units: 1,
  result: 'pending',
  tipster: '',
  notes: '',
  value_bet: false,
});

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [filtered, setFiltered] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BetInput>(emptyForm());
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Bet>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    const data = await fetch('/api/bets').then(r => r.json());
    setBets(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = [...bets];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.event.toLowerCase().includes(q) ||
        b.selection.toLowerCase().includes(q) ||
        b.league.toLowerCase().includes(q) ||
        b.sport.toLowerCase().includes(q)
      );
    }
    if (filterResult !== 'all') result = result.filter(b => b.result === filterResult);
    if (filterSport !== 'all') result = result.filter(b => b.sport === filterSport);
    result.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    setFiltered(result);
  }, [bets, search, filterResult, filterSport, sortField, sortDir]);

  const handleSort = (field: keyof Bet) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (bet: Bet) => {
    setForm({
      date: bet.date, sport: bet.sport, league: bet.league, event: bet.event,
      market: bet.market, selection: bet.selection, odds: bet.odds, stake: bet.stake,
      units: bet.units, result: bet.result, tipster: bet.tipster, notes: bet.notes,
      value_bet: bet.value_bet === 1,
    });
    setEditId(bet.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta apuesta?')) return;
    await fetch(`/api/bets/${id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `/api/bets/${editId}` : '/api/bets';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setShowForm(false);
    load();
  };

  const fmtProfit = (bet: Bet) => {
    if (bet.result === 'pending') return '—';
    return (bet.profit >= 0 ? '+$' : '-$') + Math.abs(bet.profit).toFixed(2);
  };

  const sports = [...new Set(bets.map(b => b.sport))];
  const totalProfit = filtered.filter(b => b.result !== 'pending').reduce((s, b) => s + b.profit, 0);

  const SortIcon = ({ field }: { field: keyof Bet }) => (
    sortField === field
      ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
      : <span style={{ width: 12 }} />
  );

  return (
    <div style={{ padding: 32 }}>
      <PageHeader
        title="Registro de Apuestas"
        subtitle={`${filtered.length} apuestas · P&L: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`}
        actions={
          <button onClick={openNew} style={{
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Plus size={15} /> Nueva Apuesta
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar evento, selección, liga..."
            style={{ width: '100%', paddingLeft: 32, padding: '8px 10px 8px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
          />
        </div>
        <select value={filterResult} onChange={e => setFilterResult(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}>
          <option value="all">Todos los resultados</option>
          {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterSport} onChange={e => setFilterSport(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}>
          <option value="all">Todos los deportes</option>
          {sports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterResult !== 'all' || filterSport !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterResult('all'); setFilterSport('all'); }}
            style={{ padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <X size={13} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            {bets.length === 0 ? 'Aún no hay apuestas. ¡Agrega la primera!' : 'No hay apuestas con esos filtros.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Fecha', field: 'date' },
                  { label: 'Evento / Selección', field: 'event' },
                  { label: 'Deporte', field: 'sport' },
                  { label: 'Cuota', field: 'odds' },
                  { label: 'Stake', field: 'stake' },
                  { label: 'P&L', field: 'profit' },
                  { label: 'Resultado', field: 'result' },
                  { label: '', field: null },
                ].map(col => (
                  <th key={col.label} onClick={() => col.field && handleSort(col.field as keyof Bet)}
                    style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', cursor: col.field ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label} {col.field && <SortIcon field={col.field as keyof Bet} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(bet => (
                <tr key={bet.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{bet.date}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{bet.event}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{bet.market} · {bet.selection}</div>
                    {bet.tipster && <div style={{ fontSize: 10, color: '#818cf8', marginTop: 1 }}>@{bet.tipster}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>{bet.sport}<br /><span style={{ fontSize: 11 }}>{bet.league}</span></td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{bet.odds}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>${bet.stake}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: bet.profit >= 0 && bet.result !== 'pending' ? '#22c55e' : bet.result === 'pending' ? 'var(--text-muted)' : '#ef4444' }}>
                    {fmtProfit(bet)}
                  </td>
                  <td style={{ padding: '10px 14px' }}><BetBadge result={bet.result} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(bet)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(bet.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, opacity: 0.7 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                {editId ? 'Editar Apuesta' : 'Nueva Apuesta'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Fecha">
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required style={inputStyle} />
                </Field>
                <Field label="Deporte">
                  <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))} style={inputStyle}>
                    {SPORTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Liga / Competición">
                <input value={form.league} onChange={e => setForm(f => ({ ...f, league: e.target.value }))} placeholder="Champions League, NBA..." required style={inputStyle} />
              </Field>
              <Field label="Evento">
                <input value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))} placeholder="Real Madrid vs Barcelona" required style={inputStyle} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Mercado">
                  <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} style={inputStyle}>
                    {MARKETS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Selección">
                  <input value={form.selection} onChange={e => setForm(f => ({ ...f, selection: e.target.value }))} placeholder="Real Madrid, Más de 2.5..." required style={inputStyle} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Cuota">
                  <input type="number" step="0.01" min="1.01" value={form.odds} onChange={e => setForm(f => ({ ...f, odds: parseFloat(e.target.value) }))} required style={inputStyle} />
                </Field>
                <Field label="Stake ($)">
                  <input type="number" step="0.01" min="0.01" value={form.stake} onChange={e => setForm(f => ({ ...f, stake: parseFloat(e.target.value) }))} required style={inputStyle} />
                </Field>
                <Field label="Unidades">
                  <input type="number" step="0.5" min="0.5" value={form.units} onChange={e => setForm(f => ({ ...f, units: parseFloat(e.target.value) }))} style={inputStyle} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Resultado">
                  <select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value as BetResult }))} style={inputStyle}>
                    {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                {form.result === 'cashout' && (
                  <Field label="Retorno Cashout ($)">
                    <input type="number" step="0.01" value={form.profit ?? ''} onChange={e => setForm(f => ({ ...f, profit: parseFloat(e.target.value) }))} style={inputStyle} />
                  </Field>
                )}
                <Field label="Tipster (opcional)">
                  <input value={form.tipster || ''} onChange={e => setForm(f => ({ ...f, tipster: e.target.value }))} placeholder="@usuario" style={inputStyle} />
                </Field>
              </div>
              <Field label="Notas">
                <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Análisis, justificación..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!form.value_bet} onChange={e => setForm(f => ({ ...f, value_bet: e.target.checked }))} />
                Marcar como Value Bet
              </label>
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  {saving ? 'Guardando...' : (editId ? 'Actualizar' : 'Registrar Apuesta')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}
