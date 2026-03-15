import { useEffect, useState } from 'react';
import { Users, FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { getClients, getReportStats } from '../services/api';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [cRes, sRes] = await Promise.all([getClients(), getReportStats()]);
      setClients(cRes.data);
      setStats(sRes.data);
    } catch {
      setError('Backend se data load nahi ho saka. Server check karein.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const user = JSON.parse(localStorage.getItem('seo_auth') || '{}');

  // Build last 7 days chart data from stats.daily
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const getDayCount = (dateStr, status) => {
    if (!stats?.daily) return 0;
    const found = stats.daily.find(d => d._id.date === dateStr && d._id.status === status);
    return found?.count || 0;
  };

  const days7 = getLast7Days();
  const maxBar = Math.max(1, ...days7.map(d => getDayCount(d, 'sent') + getDayCount(d, 'failed')));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Welcome back</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-1px' }}>
            Dashboard <span style={{ color: 'var(--accent)' }}>_</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-white)' }}>
            {user.email} &nbsp;•&nbsp; {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchAll} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '9px 16px', cursor: 'pointer' }}>
          <RefreshCw size={13} className={loading ? 'spinner' : ''} /> Refresh
        </button>
      </div>

      {error && <div style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--warn)', marginBottom: 24 }}>⚠ {error}</div>}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-white)', fontSize: 13, paddingTop: 40 }}>
          <div className="spinner" style={{ width: 18, height: 18, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
          Loading stats...
        </div>
      ) : (
        <>
          {/* ── Stat Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Clients" value={clients.length} icon={Users} color="accent" sub={`${clients.filter(c => c.status === 'active').length} active`} delay="fade-up-1" />
            <StatCard label="Total Reports" value={stats?.total} icon={FileText} color="blue" delay="fade-up-2" />
            <StatCard label="Emails Sent ✅" value={stats?.sent} icon={CheckCircle} color="accent" delay="fade-up-3" />
            <StatCard label="Failed ❌" value={stats?.failed} icon={XCircle} color="warn" delay="fade-up-4" />
            <StatCard label="Pending ⏳" value={stats?.pending} icon={Clock} color="blue" delay="fade-up-5" />
          </div>

          {/* ── Two column ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

            {/* Last 7 days bar chart */}
            <div className="fade-up-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Last 7 Days</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-white)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 2, display: 'inline-block' }} />Sent</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: 'var(--warn)', borderRadius: 2, display: 'inline-block' }} />Failed</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 100 }}>
                {days7.map(d => {
                  const sent = getDayCount(d, 'sent');
                  const failed = getDayCount(d, 'failed');
                  const total = sent + failed;
                  const h = total === 0 ? 4 : Math.max(8, (total / maxBar) * 90);
                  const label = new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  return (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 90 }}>
                        {failed > 0 && <div style={{ width: '100%', height: (failed / maxBar) * 90, background: 'var(--warn)', borderRadius: '3px 3px 0 0', opacity: 0.8 }} />}
                        {sent > 0 && <div style={{ width: '100%', height: (sent / maxBar) * 90, background: 'var(--accent)', borderRadius: failed > 0 ? 0 : '3px 3px 0 0', opacity: 0.9 }} />}
                        {total === 0 && <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 3 }} />}
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--text-white)', textAlign: 'center', letterSpacing: '0.3px' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clients status */}
            <div className="fade-up-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Clients</h3>
                <span style={{ fontSize: 11, color: 'var(--text-white)' }}>{clients.length} TOTAL</span>
              </div>
              {clients.length === 0 ? (
                <p style={{ padding: '20px', fontSize: 13, color: 'var(--text-white)', textAlign: 'center' }}>No clients yet</p>
              ) : (
                clients.slice(0, 6).map((c, i) => (
                  <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', borderBottom: i < Math.min(clients.length, 6) - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{c.clientName}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-white)' }}>{c.reportFrequency} • {c.email}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c.status === 'active' ? 'var(--accent-dim)' : 'var(--warn-dim)', color: c.status === 'active' ? 'var(--accent)' : 'var(--warn)' }}>
                        {c.status?.toUpperCase()}
                      </span>
                      {c.lastReportSentAt && (
                        <span style={{ fontSize: 10, color: 'var(--text-white)' }}>
                          Last: {new Date(c.lastReportSentAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Email Status Summary ── */}
          <div className="fade-up-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Email Delivery Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Successfully Sent', count: stats?.sent, color: 'var(--accent)', bg: 'var(--accent-dim)', icon: '✅' },
                { label: 'Failed to Send', count: stats?.failed, color: 'var(--warn)', bg: 'var(--warn-dim)', icon: '❌' },
                { label: 'Pending / Queued', count: stats?.pending, color: 'var(--blue)', bg: 'var(--blue-dim)', icon: '⏳' },
              ].map(item => (
                <div key={item.label} style={{ background: item.bg, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color: item.color }}>{item.count ?? 0}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', marginTop: 2 }}>{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
            {stats?.total > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-white)' }}>Success Rate</span>
                  <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {Math.round((stats.sent / stats.total) * 100)}%
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((stats.sent / stats.total) * 100)}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
