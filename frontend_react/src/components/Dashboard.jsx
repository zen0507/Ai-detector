import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Shield, FileText, AlertOctagon, ShieldCheck, ChevronRight, Upload } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const API_BASE = 'http://localhost:8000';
// NOTE: Daily upload counts endpoint needed: GET /detector/api/daily-stats/?days=14
// NOTE: Score distribution endpoint needed: GET /detector/api/score-distribution/
//   Returns: { buckets: [{ range: "0-10%", count: 4 }, ...] }

const CHART_TOOLTIP = {
  contentStyle: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text-muted)', fontFamily: 'monospace' },
};

const DONUT_COLORS = { REAL: '#3B6D11', SUSPICIOUS: '#BA7517', FAKE: '#A32D2D' };

const VerdictBadge = ({ verdict }) => {
  const map = {
    REAL:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    SUSPICIOUS:  'bg-amber-500/15  text-amber-400  border-amber-500/30',
    FAKE:        'bg-red-500/15    text-red-400    border-red-500/30',
    'HIGH RISK': 'bg-red-500/15   text-red-400    border-red-500/30',
    WARNING:     'bg-amber-500/15  text-amber-400  border-amber-500/30',
    SAFE:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    VERIFIED:    'bg-[#534AB7]/15  text-[#7F77DD] border-[#534AB7]/30',
    PENDING:     'bg-slate-500/15  text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest border ${map[verdict] || map.PENDING}`}>
      {verdict}
    </span>
  );
};

// Histogram bar color based on score range
const histogramBarColor = (rangeStr) => {
  const low = parseInt(rangeStr);
  if (low >= 70) return '#ef4444';
  if (low >= 40) return '#f59e0b';
  return '#22c55e';
};

const DonutCenterLabel = ({ cx, cy, total }) => (
  <text textAnchor="middle" dominantBaseline="middle">
    <tspan x={cx} y={cy - 6} fontSize={22} fontWeight={700} fill="var(--text-primary)">{total}</tspan>
    <tspan x={cx} y={cy + 14} fontSize={9} fill="var(--text-muted)" letterSpacing="2">DOCS</tspan>
  </text>
);

const Dashboard = ({ user, onViewChange }) => {
  const [stats, setStats]           = useState(null);
  const [dailyData, setDailyData]   = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [storage, setStorage]       = useState(null);
  const [scoreHist, setScoreHist]   = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [statsRes, docsRes, storageRes] = await Promise.all([
        fetch(`${API_BASE}/detector/api/stats/`,   { credentials: 'include' }),
        fetch(`${API_BASE}/detector/api/recent/`,  { credentials: 'include' }),
        fetch(`${API_BASE}/detector/api/storage/`, { credentials: 'include' }),
      ]);
      const [s, d, st] = await Promise.all([statsRes.json(), docsRes.json(), storageRes.json()]);
      if (s.success)  setStats(s);
      if (d.success)  setRecentDocs(d.documents);
      if (st.success) setStorage(st);
    } catch (e) { console.error('Dashboard load failed', e); }

    // Try fetching daily chart data
    try {
      const res = await fetch(`${API_BASE}/detector/api/daily-stats/?days=14`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) setDailyData(data.data);
      }
    } catch { /* endpoint may not be available yet */ }

    // Try score distribution
    try {
      const res = await fetch(`${API_BASE}/detector/api/score-distribution/`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.buckets) setScoreHist(data.buckets);
      }
    } catch { /* endpoint may not be available yet */ }

    setLoading(false);
  };

  const riskLevel = (() => {
    if (!stats) return { label: 'LOW', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' };
    if (stats.fake >= 3) return { label: 'CRITICAL', color: 'text-red-400',    border: 'border-red-500/40',    bg: 'bg-red-500/10'    };
    if (stats.fake > 0)  return { label: 'ELEVATED', color: 'text-amber-400',  border: 'border-amber-500/40',  bg: 'bg-amber-500/10'  };
    return { label: 'LOW', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10' };
  })();

  const docsUsedPct = storage ? Math.min(Math.round((storage.documents_mb / 100) * 100), 100) : 0;
  const reportsPct  = storage ? Math.min(Math.round((storage.reports_mb   / 10)  * 100), 100) : 0;

  // Donut data from stats
  const donutData = useMemo(() => [
    { name: 'REAL',       value: stats?.real      ?? stats?.low_risk    ?? 0 },
    { name: 'SUSPICIOUS', value: stats?.suspicious ?? stats?.medium_risk ?? 0 },
    { name: 'FAKE',       value: stats?.fake       ?? stats?.high_risk   ?? 0 },
  ].filter(d => d.value > 0), [stats]);

  const totalDocs = stats?.total ?? 0;

  // Build total volume data from daily_data if available (single purple series)
  const volumeData = useMemo(() => dailyData.map(d => ({
    date: d.date,
    count: (d.REAL || 0) + (d.SUSPICIOUS || 0) + (d.FAKE || 0),
  })), [dailyData]);

  return (
    <div className="space-y-8 text-[var(--text-secondary)] pb-12 transition-colors duration-300">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Live Analytics</h2>
          <p className="text-[var(--text-muted)] mt-1 text-sm">Real-time document upload and verdict monitoring</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Documents', val: stats?.total ?? '—', icon: FileText,    color: '#534AB7' },
          { label: 'Fake Detected',   val: stats?.fake  ?? '—', icon: AlertOctagon, color: '#ef4444' },
          { label: 'Clearance Rate',  val: stats ? `${stats.clearance_rate}%` : '—', icon: ShieldCheck, color: '#10b981' },
          { label: 'System Status',   val: 'OPTIMAL',            icon: Activity,    color: '#10b981', isStatus: true },
        ].map(({ label, val, icon: Icon, color, isStatus }, idx) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
            className="glass-panel p-6 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(83,74,183,0.15)] transition-all"
            style={{ border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div className={`text-2xl font-mono font-bold ${isStatus ? 'flex items-center gap-2' : ''}`}
              style={{ color: isStatus ? color : 'var(--text-primary)' }}>
              {isStatus && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
              {val}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* FIX 5 ADD: Daily Volume Area Chart — 3 cols */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-3 glass-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Activity size={18} style={{ color: '#7F77DD' }} /> Daily Document Volume — Last 14 Days
            </h3>
          </div>
          {loading || volumeData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-[var(--text-muted)] text-sm italic">
              {loading ? 'Loading chart data...' : (
                <span>No activity yet.{' '}
                  <span className="text-[#7F77DD] font-semibold cursor-pointer" onClick={() => onViewChange?.('upload')}>
                    Upload a document
                  </span>{' '}to see trends.
                </span>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={volumeData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#534AB7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-default)" strokeOpacity={0.5} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...CHART_TOOLTIP} />
                <Area type="monotone" dataKey="count" stroke="#534AB7" fill="url(#gVol)" strokeWidth={2}
                  dot={{ r: 3, fill: '#534AB7', strokeWidth: 0 }}
                  isAnimationActive={true} animationDuration={600} name="Documents" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Side widgets */}
        <div className="space-y-5">
          {/* FIX 5 ADD: Verdict Donut Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass-panel p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <Shield size={13} /> Verdict Split
            </h4>
            {donutData.length > 0 ? (
              <div style={{ position: 'relative', height: 150 }}>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={44} outerRadius={66}
                      dataKey="value" isAnimationActive={true} animationDuration={600}>
                      {donutData.map(entry => (
                        <Cell key={entry.name} fill={DONUT_COLORS[entry.name]} />
                      ))}
                      <DonutCenterLabel cx={75} cy={75} total={totalDocs} />
                    </Pie>
                    <Tooltip contentStyle={{ ...CHART_TOOLTIP.contentStyle }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-[var(--text-muted)] text-xs italic">No data</div>
            )}
            <div className="flex flex-col gap-1 mt-2">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: DONUT_COLORS[d.name] }} />
                    {d.name}
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk Level */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
              <Shield size={13} />Risk Level
            </h4>
            <div className="relative h-24 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border ${riskLevel.border} opacity-20 animate-pulse`} />
              <div className={`w-20 h-20 rounded-full ${riskLevel.bg} flex items-center justify-center border ${riskLevel.border}`}>
                <span className={`text-sm font-bold ${riskLevel.color} text-center leading-tight`}>{riskLevel.label}</span>
              </div>
            </div>
          </motion.div>

          {/* Storage */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-panel p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 flex items-center gap-2">
              <Database size={13} /> Storage
            </h4>
            <div className="space-y-3">
              {[
                { label: 'Documents',     pct: docsUsedPct, mb: storage?.documents_mb ?? 0, color: '#534AB7' },
                { label: 'Reports',       pct: reportsPct,  mb: storage?.reports_mb   ?? 0, color: '#7F77DD' },
              ].map(({ label, pct, mb, color }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{label}</span>
                    <span className="text-[var(--text-primary)] font-mono">{mb} MB</span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'var(--divider)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* FIX 5 ADD: Risk Score Distribution Histogram */}
      {scoreHist.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="glass-panel p-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <Activity size={16} style={{ color: '#7F77DD' }} /> Confidence Score Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoreHist} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border-default)" strokeOpacity={0.5} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={600} name="Documents">
                {scoreHist.map((entry, idx) => (
                  <Cell key={idx} fill={histogramBarColor(entry.range)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-emerald-500" />0–40% (Clean)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-amber-500" />40–70% (Suspicious)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm inline-block bg-red-500" />70–100% (High Risk)</span>
          </div>
        </motion.div>
      )}

      {/* FIX 5 ADD: Recent Activity Table — connected to real API */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--divider)] flex items-center gap-2">
          <Activity size={16} style={{ color: '#7F77DD' }} />
          <h3 className="font-bold text-[var(--text-primary)]">Recent Case Activity</h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-[var(--text-muted)] animate-pulse">Loading activity...</div>
        ) : recentDocs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] mb-3">No documents uploaded yet.</p>
            <button onClick={() => onViewChange?.('upload')}
              className="px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all"
              style={{ background: 'rgba(83,74,183,0.12)', border: '1px solid rgba(83,74,183,0.25)', color: '#7F77DD' }}>
              <Upload size={14} /> Upload Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--divider)] bg-white/3">
                  {['Document Name', 'Uploaded By', 'Timestamp', 'Verdict', 'Confidence', 'Action'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {recentDocs.slice(0, 10).map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)] max-w-[160px] truncate">
                      {doc.original_filename || doc.filename || doc.document_id}
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)] text-xs font-mono">{doc.uploaded_by || doc.user || '—'}</td>
                    <td className="px-6 py-4 text-[var(--text-muted)] text-xs">{doc.uploaded_at}</td>
                    <td className="px-6 py-4"><VerdictBadge verdict={doc.verdict} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                          <div className={`h-full rounded-full ${doc.score > 70 ? 'bg-red-500' : doc.score > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${doc.score || 0}%` }} />
                        </div>
                        <span className="font-mono text-xs text-[var(--text-primary)]">{doc.score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => onViewChange?.('document_detail', doc.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        style={{ background: 'rgba(83,74,183,0.10)', border: '1px solid rgba(83,74,183,0.25)', color: '#7F77DD' }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
