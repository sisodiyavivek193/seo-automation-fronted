import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, RefreshCw, Globe, Mail, FileText, ExternalLink } from 'lucide-react';
import { getClients, createClient, updateClient, deleteClient } from '../services/api';
import Modal from '../components/Modal';

const EMPTY = {
  clientName: '',
  email: '',
  website: '',
  googleDocId: '',
  reportFrequency: 'weekly',
  status: 'active',
};

const extractDocId = (input) => {
  if (!input) return '';
  const match = input.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input;
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await getClients();
      setClients(res.data); setFiltered(res.data);
    } catch { setError('Clients load nahi ho sake. Server check karein.'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(clients.filter(c =>
      c.clientName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.website?.toLowerCase().includes(q)
    ));
  }, [search, clients]);

  const openAdd = () => { setForm(EMPTY); setFormError(''); setModal('add'); };
  const openEdit = (c) => {
    setSelected(c);
    setForm({ clientName: c.clientName, email: c.email, website: c.website || '', googleDocId: c.googleDocId || '', reportFrequency: c.reportFrequency, status: c.status });
    setFormError(''); setModal('edit');
  };
  const openDelete = (c) => { setSelected(c); setModal('delete'); };

  const handleSave = async () => {
    if (!form.clientName.trim() || !form.email.trim()) { setFormError('Client name aur email required hain.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = { ...form, googleDocId: extractDocId(form.googleDocId) };
      if (modal === 'add') await createClient(payload);
      else await updateClient(selected._id, payload);
      await load(); setModal(null);
    } catch (e) { setFormError(e.response?.data?.message || 'Save failed. Retry karein.'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await deleteClient(selected._id); await load(); setModal(null); }
    catch { setError('Delete failed.'); }
    setSaving(false);
  };

  const freqColor = { weekly: 'var(--accent)', monthly: 'var(--blue)', both: 'var(--warn)' };

  const inputStyle = { width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '10px 14px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: 11, color: 'var(--text-white)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>

      {/* ── Header ── */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Manage</p>
          <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-1px' }}>
            Clients <span style={{ color: 'var(--accent)' }}>_</span>
          </h1>
        </div>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#0a0b0e', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '10px 18px', cursor: 'pointer' }}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      {error && <div style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--warn)', marginBottom: 20 }}>⚠ {error}</div>}

      {/* ── Search + Refresh ── */}
      <div className="fade-up-1" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} color="var(--text-white)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '9px 14px 9px 36px', outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontSize: 12, fontFamily: 'var(--font-mono)', padding: '9px 16px', cursor: 'pointer' }}>
          <RefreshCw size={13} className={loading ? 'spinner' : ''} />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="fade-up-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 100px 90px 90px', padding: '12px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          {['Client Name', 'Email', 'Website', 'Google Doc', 'Frequency', 'Status', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 10, color: 'var(--text-white)', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-white)', fontSize: 13 }}>
            <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px' }} />Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-white)', fontSize: 13 }}>
            {search ? 'No matching clients found.' : 'Koi client nahi hai. Pehla client add karein!'}
          </div>
        ) : (
          filtered.map((c, i) => (
            <div key={c._id}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 100px 90px 90px', padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
              onMouseOver={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Client Name */}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.clientName}</span>

              {/* Email */}
              <span style={{ fontSize: 12, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                <Mail size={11} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
              </span>

              {/* Website */}
              <span style={{ fontSize: 12, color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                {c.website
                  ? <><Globe size={11} style={{ flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.website.replace(/https?:\/\//, '')}</span></>
                  : '—'}
              </span>

              {/* Google Doc */}
              <span>
                {c.googleDocId ? (
                  <a href={`https://docs.google.com/document/d/${c.googleDocId}/edit`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--accent)', textDecoration: 'none', background: 'var(--accent-dim)', padding: '3px 8px', borderRadius: 6 }}>
                    <FileText size={10} /> Doc <ExternalLink size={9} />
                  </a>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-white)' }}>—</span>
                )}
              </span>

              {/* Frequency */}
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.2)', color: freqColor[c.reportFrequency] || 'var(--text-white)', width: 'fit-content' }}>
                {c.reportFrequency}
              </span>

              {/* Status */}
              <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, width: 'fit-content', background: c.status === 'active' ? 'var(--accent-dim)' : 'var(--warn-dim)', color: c.status === 'active' ? 'var(--accent)' : 'var(--warn)' }}>
                {c.status?.toUpperCase()}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(c)} style={{ background: 'var(--blue-dim)', border: 'none', borderRadius: 6, color: 'var(--blue)', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={12} />
                </button>
                <button onClick={() => openDelete(c)} style={{ background: 'var(--warn-dim)', border: 'none', borderRadius: 6, color: 'var(--warn)', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-white)' }}>
        {filtered.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
      </p>

      {/* ── Add / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add New Client' : 'Edit Client'} onClose={() => setModal(null)}>

          {/* Client Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Client Name *</label>
            <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="ABC Technologies" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="client@example.com" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Website */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com" style={inputStyle} onFocus={e => (e.target.style.borderColor = 'var(--accent)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Google Doc */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Google Doc Link ya ID
              <span style={{ marginLeft: 6, color: 'var(--text-white)', fontSize: 10, letterSpacing: 0, textTransform: 'none' }}>(link paste karo — auto extract ho jaayega)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={13} color="var(--text-white)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={form.googleDocId}
                onChange={e => setForm(f => ({ ...f, googleDocId: e.target.value }))}
                placeholder="https://docs.google.com/document/d/... ya sirf ID"
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            {/* Live preview link */}
            {extractDocId(form.googleDocId) && (
              <a href={`https://docs.google.com/document/d/${extractDocId(form.googleDocId)}/edit`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: 'var(--accent)', marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={10} /> Preview Doc
              </a>
            )}
          </div>

          {/* Frequency + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Report Frequency</label>
              <select value={form.reportFrequency} onChange={e => setForm(f => ({ ...f, reportFrequency: e.target.value }))} style={inputStyle}>
                <option value="weekly">📅 Weekly</option>
                <option value="monthly">🗓️ Monthly</option>
                <option value="both">📊 Both</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {formError && <div style={{ background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--warn)', marginBottom: 16 }}>{formError}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '9px 20px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#0a0b0e', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '9px 24px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {modal === 'delete' && (
        <Modal title="Delete Client" onClose={() => setModal(null)}>
          <p style={{ fontSize: 14, color: 'var(--text-white)', marginBottom: 8 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selected?.clientName}</strong>?
          </p>
          <p style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 24 }}>
            ⚠ Ye action undo nahi hoga.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setModal(null)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '9px 20px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleDelete} disabled={saving} style={{ background: 'var(--warn)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '9px 24px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
