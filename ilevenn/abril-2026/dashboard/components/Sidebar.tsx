'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Bot, BarChart2, TrendingUp } from 'lucide-react';

const nav = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/bets', icon: ClipboardList, label: 'Apuestas' },
  { href: '/agent', icon: Bot, label: 'Agente IA' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'var(--accent)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TrendingUp size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>BetIQ</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Analytics</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', padding: '4px 10px 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menú
        </div>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 10px',
              borderRadius: 8,
              marginBottom: 2,
              background: active ? 'var(--accent-dim)' : 'transparent',
              color: active ? '#a5b4fc' : 'var(--text-muted)',
              fontWeight: active ? 600 : 400,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'all 0.15s',
              borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-muted)',
      }}>
        Powered by Claude AI
      </div>
    </aside>
  );
}
