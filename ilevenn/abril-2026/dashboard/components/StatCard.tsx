interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: 'green' | 'red' | 'yellow' | 'purple' | 'default';
  icon?: React.ReactNode;
}

const colorMap = {
  green: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', text: '#22c55e' },
  red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' },
  yellow: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)', text: '#eab308' },
  purple: { bg: 'rgba(108,99,255,0.1)', border: 'rgba(108,99,255,0.2)', text: '#818cf8' },
  default: { bg: 'var(--surface-2)', border: 'var(--border)', text: '#e2e8f0' },
};

export default function StatCard({ label, value, sub, color = 'default', icon }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ color: c.text, opacity: 0.7 }}>{icon}</span>}
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{value}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}
