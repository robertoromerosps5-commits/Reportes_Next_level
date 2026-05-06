import { BetResult } from '@/lib/types';

const config: Record<BetResult, { label: string; bg: string; color: string }> = {
  won: { label: '✓ Ganada', bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  lost: { label: '✗ Perdida', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  pending: { label: '⏳ Pendiente', bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
  void: { label: '○ Nula', bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  cashout: { label: '↩ Cashout', bg: 'rgba(168,85,247,0.15)', color: '#a855f7' },
};

export default function BetBadge({ result }: { result: BetResult }) {
  const { label, bg, color } = config[result] || config.pending;
  return (
    <span style={{
      background: bg,
      color,
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 8px',
      borderRadius: 6,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
