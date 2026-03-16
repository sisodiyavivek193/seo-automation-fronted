import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut, TrendingUp, CheckSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getReports } from '../services/api';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  // Pending approvals badge
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const [r1, r2] = await Promise.all([
          getReports({ approvalStatus: 'pending_review' }),
          getReports({ approvalStatus: 'awaiting_approval' })
        ]);
        setPendingCount((r1.data?.length || 0) + (r2.data?.length || 0));
      } catch { /* silent */ }
    };
    fetchPending();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('seo_auth');
    navigate('/login');
  };

  return (
    <aside
      style={{
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        width: 220,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#0a0b0e" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            SEO<span style={{ color: 'var(--accent)' }}>OS</span>
          </span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
          AUTOMATION SUITE
        </p>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 4,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
              transition: 'all 0.15s',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              position: 'relative'
            })}
          >
            <Icon size={16} />
            {label}
            {/* Badge for pending approvals */}
            {to === '/approvals' && pendingCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--warn)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 10,
                fontFamily: 'var(--font-display)',
                minWidth: 18,
                textAlign: 'center'
              }}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 12px 24px' }}>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 8, width: '100%',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.color = 'var(--warn)'; e.currentTarget.style.background = 'var(--warn-dim)'; }}
          onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
