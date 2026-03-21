import { useEffect, useState } from 'react';
import { Plus, Download, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getReports, getClients, createReport, deleteReport, downloadReportUrl } from '../services/api';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  clientId: '',
  startDate: '',
  endDate: '',
  reportType: 'weekly'
};

const STATUS_CONFIG = {
  sent: { label: 'SENT', bg: 'var(--accent-dim)', color: 'var(--accent)', icon: CheckCircle },
  failed: { label: 'FAILED', bg: 'var(--warn-dim)', color: 'var(--warn)', icon: XCircle },
  pending: { label: 'PENDING', bg: 'var(--blue-dim)', color: 'var(--blue)', icon: Clock },
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [delModal, setDelModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, cRes] = await Promise.all([getReports(), getClients()]);
      setReports(rRes.data);
      setClients(cRes.data);
    } catch {
      setError('Reports load nahi ho sake.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

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
  }, [search, filterStatus, filterClient, filterFrom, filterTo, reports]);

  const getClientName = (id) => {
    if (!id) return '—';
    if (typeof id === 'object') return id.clientName || '—';
    return clients.find(c => c._id === id)?.clientName || id;
  };

  const clearFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterClient('');
    setFilterFrom('');
    setFilterTo('');
  };

  const handleCreate = async () => {
    if (!form.clientId || !form.startDate || !form.endDate) {
      setFormError('Client, Start Date aur End Date required hain.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await createReport({
        clientId: form.clientId,
        startDate: form.startDate,
        endDate: form.endDate,
        reportType: form.reportType
      });

      await loadAll();
      setModal(false);
      setForm(EMPTY_FORM);
    } catch (e) {
      setFormError(e.response?.data?.message || 'Create failed.');
    }
    setSaving(false);
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

  const hasFilters = search || filterStatus || filterClient || filterFrom || filterTo;

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

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-white)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: 5
  };

  const sentCount = filtered.filter(r => r.emailStatus === 'sent').length;
  const failedCount = filtered.filter(r => r.emailStatus === 'failed').length;
  const pendingCount = filtered.filter(r => r.emailStatus === 'pending').length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300 }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>MANAGE</p>
          <h1 style={{ margin: '6px 0 0', fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--text-white)' }}>
            Reports<span style={{ color: 'var(--accent)' }}>_</span>
          </h1>
        </div>
        <button
          onClick={() => {
            setModal(true);
            setForm(EMPTY_FORM);
            setFormError('');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 8,
            color: '#0a0b0e',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            padding: '12px 20px',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} /> New Report
        </button>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-white)', letterSpacing: '0.5px' }}>SENT</p>
          <p style={{ margin: 0, fontSize: 28, color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{sentCount}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-white)', letterSpacing: '0.5px' }}>FAILED</p>
          <p style={{ margin: 0, fontSize: 28, color: 'var(--warn)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{failedCount}</p>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-white)', letterSpacing: '0.5px' }}>PENDING</p>
          <p style={{ margin: 0, fontSize: 28, color: 'var(--blue)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <input
            type="text"
            placeholder="Search by client, status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={inputStyle}>
            <option value="">All Clients</option>
            {clients.map(c => (
              <option key={c._id} value={c._id}>
                {c.clientName}
              </option>
            ))}
          </select>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={inputStyle} />
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={inputStyle} />
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
          {hasFilters ? 'No reports match your filters.' : 'No reports yet. Create one to get started!'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>CLIENT</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>DATE</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>TYPE</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>STATUS</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-white)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontSize: 13 }}>{getClientName(r.clientId)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontSize: 13 }}>
                    {new Date(r.reportDate).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-white)', fontSize: 13, textTransform: 'capitalize' }}>{r.reportType}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>
                    {STATUS_CONFIG[r.emailStatus] ? (() => {
                      const config = STATUS_CONFIG[r.emailStatus];
                      const IconComponent = config.icon;
                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          width: 'fit-content',
                          background: config.bg,
                          color: config.color,
                          padding: '4px 10px',
                          borderRadius: 6
                        }}>
                          {IconComponent && <IconComponent size={14} />}
                          {config.label}
                        </div>
                      );
                    })() : null}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      {r.pdfPath && (
                        <button
                          onClick={() => handleDownload(r._id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--accent)',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          <Download size={14} />
                        </button>
                      )}
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
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Report Modal */}
      {modal && (
        <Modal onClose={() => setModal(false)}>
          <div style={{ minWidth: 480 }}>
            <h2 style={{ margin: '0 0 20px', fontFamily: 'var(--font-display)', fontSize: 20 }}>
              New Report
            </h2>

            {formError && (
              <div style={{
                margin: '0 0 16px',
                background: 'var(--warn-dim)',
                border: '1px solid var(--warn)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--warn)',
                fontSize: 12
              }}>
                {formError}
              </div>
            )}

            {/* CLIENT */}
            <label style={labelStyle}>Client</label>
            <select
              value={form.clientId}
              onChange={e => setForm({ ...form, clientId: e.target.value })}
              style={{ ...inputStyle, marginBottom: 16 }}
            >
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>
                  {c.clientName}
                </option>
              ))}
            </select>

            {/* DATES */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* REPORT TYPE */}
            <label style={labelStyle}>Report Type</label>
            <select
              value={form.reportType}
              onChange={e => setForm({ ...form, reportType: e.target.value })}
              style={{ ...inputStyle, marginBottom: 20 }}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            {/* BUTTONS */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setModal(false)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-white)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  padding: '10px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: saving ? 'var(--bg-elevated)' : 'var(--accent)',
                  border: 'none',
                  borderRadius: 8,
                  color: saving ? 'var(--accent)' : '#0a0b0e',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 13,
                  padding: '10px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Creating...' : '+ Create Report'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {delModal && (
        <Modal onClose={() => setDelModal(null)}>
          <div style={{ minWidth: 360 }}>
            <h2 style={{ margin: '0 0 12px', fontFamily: 'var(--font-display)', fontSize: 18 }}>
              Delete Report?
            </h2>
            <p style={{ margin: '0 0 20px', color: 'var(--text-white)', fontSize: 13 }}>
              {getClientName(delModal.clientId)} report delete ho jayega. Ye undo nahi ho sakta.
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