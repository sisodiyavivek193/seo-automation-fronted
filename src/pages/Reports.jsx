import { useEffect, useState } from 'react';
import { Eye, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getReports, getClients, deleteReport, downloadReportUrl } from '../services/api';
import Modal from '../components/Modal';

const STATUS_CONFIG = {
  sent: { label: 'SENT', bg: 'var(--accent-dim)', color: 'var(--accent)', icon: CheckCircle },
  failed: { label: 'FAILED', bg: 'var(--warn-dim)', color: 'var(--warn)', icon: XCircle },
  pending: { label: 'PENDING', bg: 'var(--blue-dim)', color: 'var(--blue)', icon: Clock },
};

const APPROVAL_STATUS_CONFIG = {
  pending_review: { label: 'PENDING REVIEW', bg: 'var(--blue-dim)', color: 'var(--blue)' },
  ai_rewriting: { label: 'AI REWRITING', bg: '#f59e0b22', color: '#f59e0b' },
  awaiting_approval: { label: 'AWAITING APPROVAL', bg: 'var(--accent-dim)', color: 'var(--accent)' },
  approved: { label: 'APPROVED', bg: 'var(--accent-dim)', color: 'var(--accent)' },
  rejected: { label: 'REJECTED', bg: 'var(--warn-dim)', color: 'var(--warn)' },
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [delModal, setDelModal] = useState(null);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, cRes] = await Promise.all([getReports(), getClients()]);
      // ✅ Sort by createdAt (latest first)
      const sortedReports = (rRes.data || []).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setReports(sortedReports);
      setClients(cRes.data);
    } catch {
      setError('Reports load nahi ho sake.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ✅ Real-time filtering
  useEffect(() => {
    let result = [...reports];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        getClientName(r.clientId).toLowerCase().includes(q) ||
        r.emailStatus?.toLowerCase().includes(q) ||
        r.reportType?.toLowerCase().includes(q)
      );
    }

    if (filterStatus) {
      result = result.filter(r => r.emailStatus === filterStatus);
    }

    if (filterApprovalStatus) {
      result = result.filter(r => r.approvalStatus === filterApprovalStatus);
    }

    if (filterClient) {
      result = result.filter(r => {
        const id = typeof r.clientId === 'object' ? r.clientId?._id : r.clientId;
        return id === filterClient;
      });
    }

    if (filterFrom) {
      const from = new Date(filterFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.reportDate) >= from);
    }

    if (filterTo) {
      const to = new Date(filterTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.reportDate) <= to);
    }

    setFiltered(result);
  }, [search, filterStatus, filterApprovalStatus, filterClient, filterFrom, filterTo, reports]);

  const getClientName = (id) => {
    if (!id) return '—';
    if (typeof id === 'object') return id.clientName || '—';
    return clients.find(c => c._id === id)?.clientName || id;
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterApprovalStatus('');
    setFilterClient('');
    setFilterFrom('');
    setFilterTo('');
  };

  const handleDelete = async () => {
    try {
      await deleteReport(delModal._id);
      await loadAll();
      setDelModal(null);
    } catch {
      setError('Delete failed.');
    }
  };

  const handleDownload = (reportId) => {
    const token = JSON.parse(localStorage.getItem('seo_auth') || '{}').token;
    fetch(downloadReportUrl(reportId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `report-${reportId}.pdf`;
        a.click();
      })
      .catch(() => alert('PDF available nahi hai.'));
  };

  const hasFilters = search || filterStatus || filterApprovalStatus || filterClient || filterFrom || filterTo;

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    padding: '10px 14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const sentCount = filtered.filter(r => r.emailStatus === 'sent').length;
  const failedCount = filtered.filter(r => r.emailStatus === 'failed').length;
  const pendingCount = filtered.filter(r => r.emailStatus === 'pending').length;
  const pendingReviewCount = filtered.filter(r => r.approvalStatus === 'pending_review').length;
  const awaitingApprovalCount = filtered.filter(r => r.approvalStatus === 'awaiting_approval').length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400 }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>MANAGE</p>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--text-white)' }}>
            Reports<span style={{ color: 'var(--accent)' }}>_</span>
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-white)', opacity: 0.7 }}>
          ℹ️ Reports auto-generated Saturday 9 AM. CEO approves in Approvals page.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          margin: '0 0 20px',
          background: 'var(--warn-dim)',
          border: '1px solid var(--warn)',
          borderRadius: 8,
          padding: '12px 16px',
          color: 'var(--warn)',
          fontSize: 13
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>SENT</p>
          <p style={{ margin: 0, fontSize: 24, color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{sentCount}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>FAILED</p>
          <p style={{ margin: 0, fontSize: 24, color: 'var(--warn)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{failedCount}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>PENDING EMAIL</p>
          <p style={{ margin: 0, fontSize: 24, color: 'var(--blue)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{pendingCount}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>PENDING REVIEW</p>
          <p style={{ margin: 0, fontSize: 24, color: '#f59e0b', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{pendingReviewCount}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>AWAITING APPROVAL</p>
          <p style={{ margin: 0, fontSize: 24, color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{awaitingApprovalCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <input
            type="text"
            placeholder="Search by client, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
            <option value="">All Email Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={filterApprovalStatus} onChange={e => setFilterApprovalStatus(e.target.value)} style={inputStyle}>
            <option value="">All Approval Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="ai_rewriting">AI Rewriting</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={inputStyle}>
            <option value="">All Clients</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>
                {c.clientName}
              </option>
            ))}
          </select>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={inputStyle} placeholder="From" />
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={inputStyle} placeholder="To" />
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: 'var(--border)',
                border: 'none',
                borderRadius: 8,
                color: 'var(--text-white)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                padding: '10px',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-white)' }}>
          <div
            className="spinner"
            style={{
              width: 24,
              height: 24,
              border: '2px solid var(--border-bright)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              margin: '0 auto 12px'
            }}
          />
          Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-white)' }}>
          {hasFilters ? 'No reports match your filters.' : 'No reports yet. Reports auto-generate Saturday 9 AM!'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>CLIENT</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>PERIOD</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TYPE</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>APPROVAL</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>EMAIL</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontSize: 13 }}>
                    <strong>{getClientName(r.clientId)}</strong>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontSize: 13 }}>
                    {new Date(r.startDate).toLocaleDateString('en-IN')} → {new Date(r.endDate).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontSize: 13, textTransform: 'capitalize' }}>
                    {r.reportType}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    {APPROVAL_STATUS_CONFIG[r.approvalStatus] && (
                      <div style={{
                        display: 'inline-block',
                        background: APPROVAL_STATUS_CONFIG[r.approvalStatus].bg,
                        color: APPROVAL_STATUS_CONFIG[r.approvalStatus].color,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.5px'
                      }}>
                        {APPROVAL_STATUS_CONFIG[r.approvalStatus].label}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    {STATUS_CONFIG[r.emailStatus] && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: STATUS_CONFIG[r.emailStatus].bg,
                        color: STATUS_CONFIG[r.emailStatus].color,
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        {STATUS_CONFIG[r.emailStatus].icon &&
                          <STATUS_CONFIG[r.emailStatus].icon size={12} />
                        }
                        {STATUS_CONFIG[r.emailStatus].label}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setDelModal(r)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 6,
                          color: 'var(--warn)',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                        title="Delete report"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {delModal && (
        <Modal onClose={() => setDelModal(null)}>
          <div style={{ minWidth: 360 }}>
            <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              Delete Report?
            </h2>
            <p style={{ margin: '0 0 20px', color: 'var(--text-white)', fontSize: 13 }}>
              {getClientName(delModal.clientId)} ka report delete ho jayega. Ye undo nahi ho sakta.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDelModal(null)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-white)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  padding: '9px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1,
                  background: 'var(--warn)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '9px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}