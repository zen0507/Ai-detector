import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, FileText, Eye, Trash2, AlertTriangle, ShieldCheck, AlertOctagon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = 'http://localhost:8000';

const DONUT_COLORS = {
  REAL:       '#3B6D11',
  SUSPICIOUS: '#BA7517',
  FAKE:       '#A32D2D',
};

const VerdictBadge = ({ riskLevel, reviewStatus }) => {
  if (reviewStatus === 'rejected')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-red-500/15 text-red-400 border-red-500/30"><AlertOctagon size={10}/>FAKE (Confirmed)</span>;
  if (reviewStatus === 'approved')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><ShieldCheck size={10}/>REAL (Verified)</span>;
  if (riskLevel === 'high_risk')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-red-500/15 text-red-400 border-red-500/30"><AlertOctagon size={10}/>FAKE</span>;
  if (riskLevel === 'medium_risk')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-amber-500/15 text-amber-400 border-amber-500/30"><AlertTriangle size={10}/>SUSPICIOUS</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><ShieldCheck size={10}/>REAL</span>;
};

// Resolve confidence from whichever field the backend returns
const getConfidence = (r) => {
  // Use OR to fallback when value is 0 or null, prioritizing score (final AI result)
  const raw = r.score || r.confidence_score || r.risk_score || r.confidence || r.ai_score || 0;
  const val = typeof raw === 'number' ? raw : parseFloat(raw) || 0;
  // If the score is in 0-1 range, multiply to get percentage
  return val <= 1 && val > 0 ? Math.round(val * 100) : Math.round(val);
};

// Bar color by verdict
const confidenceBarColor = (riskLevel, reviewStatus) => {
  if (riskLevel === 'high_risk' || reviewStatus === 'rejected') return '#ef4444';
  if (riskLevel === 'medium_risk') return '#f59e0b';
  return '#22c55e';
};

const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', padding: '8px 14px', borderRadius: 10 }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13 }}>{payload[0].name}: {payload[0].value}</p>
    </div>
  );
};

const PAGE_SIZE = 10;

const CaseReports = ({ onViewChange }) => {
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterKey, setFilterKey]       = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/detector/api/reports/`, { credentials: 'include' });
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (e) {
      console.error('Reports fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (report) => {
    const id = report.id?.toString().replace('DOC-', '');
    if (id) onViewChange('document_detail', parseInt(id));
  };

  const handleDelete = async (report, e) => {
    e.stopPropagation();
    setDeleteConfirm(report);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id?.toString().replace('DOC-', '');
    try {
      await fetch(`${API_BASE}/detector/api/delete/${id}/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested deletion' }),
      });
      setReports(prev => prev.filter(r => r.id !== deleteConfirm.id));
    } catch (e) {
      console.error('Delete failed', e);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filtered = useMemo(() => {
    return reports.filter(r => {
      // FIX 1: use original_filename || filename
      const name = r.original_filename || r.filename || '';
      const matchSearch = !searchTerm ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id?.toString().includes(searchTerm) ||
        r.date?.includes(searchTerm);
      const matchFilter   = !filterKey || r.risk_level === filterKey;
      const matchDateFrom = !dateFrom  || (r.date && r.date >= dateFrom);
      const matchDateTo   = !dateTo    || (r.date && r.date <= dateTo);
      return matchSearch && matchFilter && matchDateFrom && matchDateTo;
    });
  }, [reports, searchTerm, filterKey, dateFrom, dateTo]);

  const counts = useMemo(() => ({
    '':          reports.length,
    low_risk:    reports.filter(r => r.risk_level === 'low_risk').length,
    medium_risk: reports.filter(r => r.risk_level === 'medium_risk').length,
    high_risk:   reports.filter(r => r.risk_level === 'high_risk').length,
  }), [reports]);

  // Donut chart data
  const donutData = useMemo(() => [
    { name: 'REAL',       value: counts.low_risk    },
    { name: 'SUSPICIOUS', value: counts.medium_risk },
    { name: 'FAKE',       value: counts.high_risk   },
  ].filter(d => d.value > 0), [counts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [searchTerm, filterKey, dateFrom, dateTo]);

  const handleExportCSV = () => {
    const header = 'Document ID,Document Name,Date,Risk Level,Review Status,Confidence';
    const rows = filtered.map(r =>
      [r.id, `"${r.original_filename || r.filename || r.id}"`, r.date, r.risk_level, r.review_status, getConfidence(r)].join(',')
    );
    const csv  = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `falsum_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 text-[var(--text-secondary)] transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Audit History</h2>
          <p className="text-[var(--text-muted)] mt-1 text-sm">Review and manage all forensic document analyses</p>
        </div>
        <div className="flex items-center gap-4">
          {/* FIX 1 ADD: Verdict Donut Chart */}
          {!loading && donutData.length > 0 && (
            <div style={{ width: 160, height: 160, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={72}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={600}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={DONUT_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{counts['']}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>docs</span>
              </div>
            </div>
          )}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--divider)] text-[var(--text-primary)] rounded-xl font-semibold text-sm transition-all shadow-sm"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Donut legend */}
      {!loading && donutData.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          {donutData.map(d => (
            <div key={d.name} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[d.name] }} />
              {d.name}: <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
          <input
            type="text"
            placeholder="Search by Document Name, ID, or Date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-[var(--divider)] focus:border-[#534AB7] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'REAL', 'SUSPICIOUS', 'FAKE'].map((f) => {
            const key = f === 'ALL' ? '' : f === 'REAL' ? 'low_risk' : f === 'SUSPICIOUS' ? 'medium_risk' : 'high_risk';
            const isActive = filterKey === key;
            return (
              <button
                key={f}
                onClick={() => setFilterKey(key)}
                className={`rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap
                  ${isActive
                    ? 'bg-[#534AB7] border-[#534AB7] text-white shadow-lg shadow-[#534AB7]/20'
                    : 'bg-white/5 border-[var(--divider)] text-[var(--text-muted)] hover:border-[#534AB7]/40 hover:text-[var(--text-primary)]'}`}
                style={{ minWidth: 44, padding: '6px 14px' }}
              >
                {f}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
                  {counts[key] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--divider)] bg-white/3">
                {['Document Name', 'Verdict', 'Confidence', 'Upload Date', 'Action'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider)]">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-white/5 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="p-4 inline-block mb-3"><FileText size={32} className="text-[var(--text-muted)]" /></div>
                    <p className="text-[var(--text-muted)] font-medium">No documents match your filters.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((report, idx) => {
                  const confidence = getConfidence(report);
                  const barColor   = confidenceBarColor(report.risk_level, report.review_status);
                  // FIX 1: use original_filename
                  const displayName = report.original_filename || report.filename || `Document #${report.id}`;
                  return (
                    <motion.tr
                      key={report.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-[var(--text-primary)] font-medium truncate max-w-[150px] md:max-w-xs">{displayName}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">{report.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <VerdictBadge riskLevel={report.risk_level} reviewStatus={report.review_status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: barColor }} />
                          </div>
                          <span className="text-xs font-mono text-[var(--text-secondary)]">{confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)] font-mono text-[10px]">
                        {report.date ? new Date(report.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {/* FIX 1: Always-visible View button */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDocument(report)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                            style={{ borderColor: 'var(--border-default)', color: 'var(--brand-light, #7F77DD)' }}
                          >
                            <Eye size={13} /> View
                          </button>
                          <button
                            onClick={(e) => handleDelete(report, e)}
                            className="p-1.5 hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-[var(--divider)] flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              Showing <span className="font-bold text-[var(--text-secondary)]">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-[var(--text-secondary)]">{Math.min(filtered.length, page * PAGE_SIZE)}</span> of{' '}
              <span className="font-bold text-[var(--text-secondary)]">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-[var(--divider)] hover:bg-[#534AB7]/10 disabled:opacity-30 text-[var(--text-primary)] transition-all">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                .map((p, i) => p === '...'
                  ? <span key={`e${i}`} className="px-2 text-[var(--text-muted)] text-xs">...</span>
                  : <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-[#534AB7] text-white' : 'text-[var(--text-muted)] hover:bg-white/10'}`}>{p}</button>
                )}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-[var(--divider)] hover:bg-[#534AB7]/10 disabled:opacity-30 text-[var(--text-primary)] transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-7 max-w-sm w-full mx-4 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/20"><Trash2 size={18} className="text-red-400" /></div>
              <h3 className="font-bold text-[var(--text-primary)] text-lg">Delete Record</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Remove <span className="text-[var(--text-primary)] font-semibold">"{deleteConfirm.original_filename || deleteConfirm.filename}"</span>? This action will be logged.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-[var(--divider)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] transition-all">Cancel</button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 transition-all">Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CaseReports;
