import { useEffect, useState } from 'react';
import { Eye, Wand2, CheckCircle, XCircle, RefreshCw, Send, Clock, AlertCircle } from 'lucide-react';
import { getReports, getReportPreview, rewriteReport, approveReport, rejectReport } from '../services/api';

const STATUS_COLORS = {
    pending_review: { color: 'var(--blue)', bg: 'var(--blue-dim)', label: 'PENDING REVIEW' },
    ai_rewriting: { color: '#f59e0b', bg: '#f59e0b22', label: 'AI REWRITING...' },
    awaiting_approval: { color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'AWAITING APPROVAL' },
    approved: { color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'APPROVED' },
    rejected: { color: 'var(--warn)', bg: 'var(--warn-dim)', label: 'REJECTED' },
};

const inputStyle = {
    width: '100%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border)', borderRadius: 8,
    color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
    fontSize: 13, padding: '10px 14px', outline: 'none', boxSizing: 'border-box'
};

export default function Approvals() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);      // Selected report for preview
    const [preview, setPreview] = useState(null);         // Preview data
    const [previewLoading, setPreviewLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [rewriting, setRewriting] = useState(false);
    const [approving, setApproving] = useState(false);
    const [showAI, setShowAI] = useState(false);          // Show AI rewritten content
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rejectModal, setRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const loadReports = async () => {
        setLoading(true);
        try {
            // Pending review + awaiting approval reports
            const [pendingRes, awaitingRes] = await Promise.all([
                getReports({ approvalStatus: 'pending_review' }),
                getReports({ approvalStatus: 'awaiting_approval' })
            ]);
            const all = [...(pendingRes.data || []), ...(awaitingRes.data || [])];
            // Sort by date
            all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setReports(all);
        } catch {
            setError('Reports load nahi ho sake.');
        }
        setLoading(false);
    };

    useEffect(() => { loadReports(); }, []);

    const handleSelect = async (report) => {
        setSelected(report);
        setPreview(null);
        setPrompt('');
        setShowAI(false);
        setError('');
        setSuccess('');
        setPreviewLoading(true);

        try {
            const res = await getReportPreview(report._id);
            setPreview(res.data);
            if (res.data.ceoPrompt) setPrompt(res.data.ceoPrompt);
        } catch {
            setError('Preview load nahi ho saka.');
        }
        setPreviewLoading(false);
    };

    const handleRewrite = async () => {
        if (!prompt.trim()) { setError('Prompt likhna zaroori hai!'); return; }
        setRewriting(true);
        setError('');
        setSuccess('');

        try {
            const res = await rewriteReport(selected._id, prompt);
            setPreview(prev => ({ ...prev, aiRewrittenContent: res.data.aiRewrittenContent, approvalStatus: 'awaiting_approval' }));
            setShowAI(true);
            setSuccess('✅ AI ne content rewrite kar diya! Preview dekho aur approve karo.');
            await loadReports();
        } catch (e) {
            setError(e.response?.data?.message || 'AI rewrite fail ho gaya.');
        }
        setRewriting(false);
    };

    const handleApprove = async () => {
        setApproving(true);
        setError('');
        setSuccess('');

        try {
            await approveReport(selected._id);
            setSuccess('🎉 Report approved! Email send ho gaya client ko.');
            setSelected(null);
            setPreview(null);
            await loadReports();
        } catch (e) {
            setError(e.response?.data?.message || 'Approve fail ho gaya.');
        }
        setApproving(false);
    };

    const handleReject = async () => {
        try {
            await rejectReport(selected._id, rejectReason);
            setRejectModal(false);
            setRejectReason('');
            setSuccess('Report rejected — dobara edit kar sakte ho.');
            setSelected(null);
            setPreview(null);
            await loadReports();
        } catch {
            setError('Reject fail ho gaya.');
        }
    };

    const getClientName = (r) => {
        if (!r.clientId) return '—';
        if (typeof r.clientId === 'object') return r.clientId.clientName || '—';
        return r.clientId;
    };

    const pendingCount = reports.filter(r => r.approvalStatus === 'pending_review').length;
    const awaitingCount = reports.filter(r => r.approvalStatus === 'awaiting_approval').length;

    return (
        <div style={{ padding: '32px 40px', maxWidth: 1400, display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: 24 }}>

            {/* LEFT — Report List */}
            <div>
                {/* Header */}
                <div className="fade-up" style={{ marginBottom: 20 }}>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-white)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>CEO Workflow</p>
                    <h1 style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-1px' }}>
                        Approvals <span style={{ color: 'var(--accent)' }}>_</span>
                    </h1>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)33', borderRadius: 10, padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--blue)' }}>{pendingCount}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>PENDING REVIEW</p>
                    </div>
                    <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)33', borderRadius: 10, padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>{awaitingCount}</p>
                        <p style={{ margin: 0, fontSize: 10, color: 'var(--text-white)', letterSpacing: '0.5px' }}>AWAITING APPROVAL</p>
                    </div>
                </div>

                {/* Refresh */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={loadReports} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                        <RefreshCw size={12} className={loading ? 'spinner' : ''} /> Refresh
                    </button>
                </div>

                {/* Report Cards */}
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-white)' }}>
                        <div className="spinner" style={{ width: 20, height: 20, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 10px' }} />
                        Loading...
                    </div>
                ) : reports.length === 0 ? (
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px', textAlign: 'center' }}>
                        <CheckCircle size={32} color="var(--accent)" style={{ marginBottom: 12 }} />
                        <p style={{ fontSize: 14, color: 'var(--text-white)', margin: 0 }}>Koi pending report nahi hai!</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>Jab cron job run hoga, reports yahan dikhenge.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {reports.map(r => {
                            const sc = STATUS_COLORS[r.approvalStatus] || STATUS_COLORS.pending_review;
                            const isSelected = selected?._id === r._id;
                            return (
                                <div
                                    key={r._id}
                                    onClick={() => handleSelect(r)}
                                    style={{
                                        background: isSelected ? 'var(--accent-dim)' : 'var(--bg-card)',
                                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                                        borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{getClientName(r)}</p>
                                            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                                                {new Date(r.startDate).toLocaleDateString('en-IN')} → {new Date(r.endDate).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                                            {sc.label}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-elevated)', color: 'var(--text-white)', border: '1px solid var(--border)' }}>
                                            {r.reportType?.toUpperCase()}
                                        </span>
                                        {r.ceoPrompt && (
                                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b33' }}>
                                                AI Prompt Added
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT — Preview & Actions */}
            {selected && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>

                    {/* Panel Header */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{preview?.clientName || getClientName(selected)}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-white)', fontFamily: 'var(--font-mono)' }}>
                                {selected.reportType?.toUpperCase()} • {new Date(selected.startDate).toLocaleDateString('en-IN')} → {new Date(selected.endDate).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                        <button onClick={() => { setSelected(null); setPreview(null); }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div style={{ margin: '12px 20px 0', background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--warn)', flexShrink: 0 }}>
                            ⚠ {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ margin: '12px 20px 0', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--accent)', flexShrink: 0 }}>
                            {success}
                        </div>
                    )}

                    {previewLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-white)' }}>
                            <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border-bright)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} />
                            Loading preview...
                        </div>
                    ) : preview && (
                        <>
                            {/* AI Prompt Section */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                                <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--text-white)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    🤖 AI Prompt (CEO Instructions)
                                </p>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Example: Content ko simple English mein likho, bullet points use karo, positive tone rakho, technical jargon avoid karo..."
                                    rows={3}
                                    style={{ ...inputStyle, resize: 'vertical', fontSize: 12 }}
                                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                />
                                <button
                                    onClick={handleRewrite}
                                    disabled={rewriting || !prompt.trim()}
                                    style={{
                                        marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
                                        background: rewriting ? 'var(--bg-elevated)' : '#f59e0b',
                                        border: 'none', borderRadius: 8,
                                        color: rewriting ? 'var(--text-white)' : '#000',
                                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                                        padding: '8px 16px', cursor: rewriting ? 'not-allowed' : 'pointer',
                                        opacity: !prompt.trim() ? 0.5 : 1
                                    }}
                                >
                                    {rewriting ? (
                                        <><div className="spinner" style={{ width: 12, height: 12, border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%' }} /> AI Rewriting...</>
                                    ) : (
                                        <><Wand2 size={13} /> AI se Rewrite Karo</>
                                    )}
                                </button>
                            </div>

                            {/* Content Toggle */}
                            {preview.aiRewrittenContent && (
                                <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button
                                        onClick={() => setShowAI(false)}
                                        style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${!showAI ? 'var(--accent)' : 'var(--border)'}`, background: !showAI ? 'var(--accent-dim)' : 'transparent', color: !showAI ? 'var(--accent)' : 'var(--text-white)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                                    >
                                        📄 Original Content
                                    </button>
                                    <button
                                        onClick={() => setShowAI(true)}
                                        style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${showAI ? '#f59e0b' : 'var(--border)'}`, background: showAI ? '#f59e0b22' : 'transparent', color: showAI ? '#f59e0b' : 'var(--text-white)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
                                    >
                                        🤖 AI Rewritten
                                    </button>
                                </div>
                            )}

                            {/* Content Preview */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                                <div
                                    style={{ background: '#fff', borderRadius: 8, padding: '20px', fontSize: 13, color: '#333', lineHeight: 1.6 }}
                                    dangerouslySetInnerHTML={{
                                        __html: showAI
                                            ? (preview.aiRewrittenContent || '<p>AI content nahi mila</p>')
                                            : (preview.rawDocContent || '<p>Original content nahi mila</p>')
                                    }}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
                                <button
                                    onClick={() => { setRejectModal(true); setError(''); setSuccess(''); }}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--warn-dim)', border: '1px solid var(--warn)', borderRadius: 8, color: 'var(--warn)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '10px', cursor: 'pointer' }}
                                >
                                    <XCircle size={15} /> Reject
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={approving}
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: approving ? 'var(--accent-dim)' : 'var(--accent)', border: 'none', borderRadius: 8, color: approving ? 'var(--accent)' : '#0a0b0e', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '10px', cursor: approving ? 'not-allowed' : 'pointer' }}
                                >
                                    {approving ? (
                                        <><div className="spinner" style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} /> Sending...</>
                                    ) : (
                                        <><Send size={15} /> Approve & Send Email</>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420 }}>
                        <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Report Reject Karo</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-white)', marginBottom: 12 }}>Rejection reason (optional):</p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Kya change karna chahte ho..."
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical', marginBottom: 16 }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setRejectModal(false)}
                                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-white)', fontFamily: 'var(--font-mono)', fontSize: 13, padding: '9px', cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleReject}
                                style={{ flex: 1, background: 'var(--warn)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '9px', cursor: 'pointer' }}>
                                Reject Karo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
