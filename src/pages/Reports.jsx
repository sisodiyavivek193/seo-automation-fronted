import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Plus, Download, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getReports, getClients, createReport, deleteReport, downloadReportUrl } from '../services/api';
import Modal from '../components/Modal';

const EMPTY_FORM = { clientId: '', startDate: '', endDate: '', reportType: 'weekly', aiSummary: '' };

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

  // Filters — all live, no Apply needed
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Load all reports + clients once
  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [rRes, cRes] = await Promise.all([getReports(), getClients()]);
      setReports(rRes.data);
      setClients(cRes.data);
    } catch { setError('Reports load nahi ho sake.'); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ✅ Real-time filtering — runs whenever ANY filter changes
  useEffect(() => {
    let result = [...reports];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        getClientName(r.clientId).toLowerCase().includes(q) ||
        r.emailStatus?.toLowerCase().includes(q) ||
        r.reportType?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus) {
      result = result.filter(r => r.emailStatus === filterStatus);
    }

    // Client filter
    if (filterClient) {
      result = result.filter(r => {
        const id = typeof r.clientId === 'object' ? r.clientId?._id : r.clientId;
        return id === filterClient;
      });
    }

    // Date from filter
    if (filterFrom) {
      const from = new Date(filterFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(r => new Date(r.reportDate) >= from);
    }

    // Date to filter
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
      setFormError('Client, Start Date aur End Date required hain.'); return;
    }
    setSaving(true); setFormError('');
    try {
      await createReport({ ...form, traffic: 0, keywords: 0, backlinks: 0 });
      await loadAll(); setModal(false); setForm(EMPTY_FORM);
    } catch (e) { setFormError(e.response?.data?.message || 'Create failed.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await deleteReport(delModal._id);
      await loadAll(); setDelModal(null);
    } catch { setError('Delete failed.'); }
  };

  const handleDownload = (reportId) => {
    const token = JSON.parse(localStorage.getItem('seo_auth') || '{}').token;
    fetch(downloadReportUrl(reportId), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.blob(); })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `report-${reportId}.pdf`;
        a.click();
      })
      .catch(() => alert('PDF available nahi hai.'));
  };

  const hasFilters = search || filterStatus || filterClient || filterFrom || filterTo;

  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '10px 14px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text-white)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 5 };

  const sentCount = filtered.filter(r => r.emailStatus === 'sent').length;
  const failedCount = filtered.filter(r => r.emailStatus === 'failed').length;
  const pendingCount = filtered.filter(r => r.emailStatus === 'pending').length;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300 }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Analytics</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-1px' }}>
            Reports <span style={{ color: 'var(--accent)' }}>_</span>
          </h1>
        </div>
        <button onClick={() => { setFormError(''); setForm(EMPTY_FORM); setModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#0a0b0e', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '10px 18px', cursor: 'pointer' }}>
          <Plus size={15} /> New Report
        </button>
      </div>

      {/* Mini stats — clickable to filter */}
      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Sent', count: sentCount, key: 'sent', ...STATUS_CONFIG.sent },
          { label: 'Failed', count: failedCount, key: 'failed', ...STATUS_CONFIG.failed },
          { label: 'Pending', count: pendingCount, key: 'pending', ...STATUS_CONFIG.pending },
        ].map(s => (
          <div key={s.key}
            onClick={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}
            style={{
              background: s.bg,
              border: `1px solid ${filterStatus === s.key ? s.color : s.color + '33'}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', transition: 'all 0.15s',
              opacity: filterStatus && filterStatus !== s.key ? 0.5 : 1,
            }}>
            <s.icon size={18} color={s.color} />
            <div>
              <p style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800, color: s.color }}>{s.count}</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>{s.label.toUpperCase()}</p>
            </div>
            {filterStatus === s.key && (
              <span style={{ marginLeft: 'auto', fontSize: 9, color: s.color, background: s.color + '22', padding: '2px 6px', borderRadius: 10 }}>ACTIVE</span>
            )}
          </div>
        ))}
      </div>

      {/* ✅ Live Filters — NO Apply button */}
      <div className="fade-up-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Search — live */}
          <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
            <Search size={13} color="var(--text-white)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search client, type, status..."
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Status — live */}
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
              <option value="">All Status</option>
              <option value="sent">✅ Sent</option>
              <option value="failed">❌ Failed</option>
              <option value="pending">⏳ Pending</option>
            </select>
          </div>

          {/* Client — live */}
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={labelStyle}>Client</label>
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={inputStyle}>
              <option value="">All Clients</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.clientName}</option>)}
            </select>
          </div>

          {/* Date From — live */}
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Date To — live */}
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={labelStyle}>To</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Refresh + Clear */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
            {hasFilters && (
              <button onClick={clearFilters}
                style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 8, color: 'var(--warn)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 14px', cursor: 'pointer' }}>
                Clear
              </button>
            )}
            <button onClick={loadAll}
              style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', padding: '10px 12px', cursor: 'pointer' }}>
              <RefreshCw size={13} className={loading ? 'spinner' : ''} />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {search && <Chip label={`Search: "${search}"`} onRemove={() => setSearch('')} />}
            {filterStatus && <Chip label={`Status: ${filterStatus}`} onRemove={() => setFilterStatus('')} color="var(--accent)" />}
            {filterClient && <Chip label={`Client: ${clients.find(c => c._id === filterClient)?.clientName || filterClient}`} onRemove={() => setFilterClient('')} color="var(--blue)" />}
            {filterFrom && <Chip label={`From: ${filterFrom}`} onRemove={() => setFilterFrom('')} />}
            {filterTo && <Chip label={`To: ${filterTo}`} onRemove={() => setFilterTo('')} />}
          </div>
        )}
      </div>

      {error && <div style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--warn)', marginBottom: 16 }}>⚠ {error}</div>}

      {/* Table */}
      <div className="fade-up-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.3fr 110px 110px 110px', padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          {['Client', 'Type', 'Period', 'Status', 'Sent At', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 10, color: 'var(--text-white)', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-white)', fontSize: 13 }}>
            <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px' }} />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-white)', fontSize: 13 }}>
            {hasFilters ? 'Koi report filter se match nahi karta.' : 'Koi report nahi hai abhi.'}
          </div>
        ) : (
          filtered.map((r, i) => {
            const sc = STATUS_CONFIG[r.emailStatus] || STATUS_CONFIG.pending;
            const Icon = sc.icon;
            return (
              <div key={r._id}
                style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.3fr 110px 110px 110px', padding: '13px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{getClientName(r.clientId)}</p>
                  {r.emailError && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--warn)' }}>⚠ {r.emailError}</p>}
                </div>

                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: r.reportType === 'weekly' ? 'var(--accent-dim)' : 'var(--blue-dim)', color: r.reportType === 'weekly' ? 'var(--accent)' : 'var(--blue)', width: 'fit-content' }}>
                  {r.reportType?.toUpperCase() || 'WEEKLY'}
                </span>

                <span style={{ fontSize: 11, color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(r.startDate).toLocaleDateString('en-IN')} → {new Date(r.endDate).toLocaleDateString('en-IN')}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={13} color={sc.color} />
                  <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
                </div>

                <span style={{ fontSize: 11, color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                  {r.emailSentAt ? new Date(r.emailSentAt).toLocaleDateString('en-IN') : '—'}
                </span>

                <div style={{ display: 'flex', gap: 6 }}>
                  {r.pdfPath && (
                    <button onClick={() => handleDownload(r._id)} title="Download PDF"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent-dim)', border: 'none', borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '5px 10px', cursor: 'pointer' }}>
                      <Download size={11} /> PDF
                    </button>
                  )}
                  <button onClick={() => setDelModal(r)} title="Delete"
                    style={{ background: 'var(--warn-dim)', border: 'none', borderRadius: 6, color: 'var(--warn)', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-white)' }}>
        {filtered.length} of {reports.length} report{reports.length !== 1 ? 's' : ''}
        {hasFilters && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>— filtered</span>}
      </p>

      {/* Create Modal */}
      {modal && (
        <Modal title="Create New Report" onClose={() => setModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Client *</label>
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} style={{ ...inputStyle, color: form.clientId ? 'var(--text-primary)' : 'var(--text-white)' }}>
              <option value="">-- Client Select Karein --</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.clientName}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Report Type</label>
            <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))} style={inputStyle}>
              <option value="weekly">📅 Weekly</option>
              <option value="monthly">🗓️ Monthly</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <div>
              <label style={labelStyle}>End Date *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notes / AI Summary</label>
            <textarea value={form.aiSummary} onChange={e => setForm(f => ({ ...f, aiSummary: e.target.value }))} placeholder="Optional notes..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>
          {formError && <div style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--warn)', marginBottom: 16 }}>{formError}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '9px 20px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#0a0b0e', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '9px 24px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {delModal && (
        <Modal title="Delete Report" onClose={() => setDelModal(null)}>
          <p style={{ fontSize: 14, color: 'var(--text-white)', marginBottom: 8 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{getClientName(delModal.clientId)}</strong> ka yeh report delete karna chahte ho?
          </p>
          <p style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 24 }}>⚠ Yeh action undo nahi hoga.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDelModal(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '9px 20px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDelete} style={{ background: 'var(--warn)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '9px 24px', cursor: 'pointer' }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Small chip component for active filters
function Chip({ label, onRemove, color = 'var(--text-white)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color, fontFamily: 'var(--font-mono)' }}>
      {label}
      <span onClick={onRemove} style={{ cursor: 'pointer', color: 'var(--text-white)', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>×</span>
    </span>
  );
}
