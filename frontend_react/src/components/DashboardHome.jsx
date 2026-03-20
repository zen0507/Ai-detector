import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle, AlertOctagon, BarChart2, ChevronRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';

const API_BASE = 'http://localhost:8000';
// NOTE: Weekly trend endpoint needed: GET /detector/api/daily-stats/?days=7
// Expected response: { success: true, data: [{ date: "Mon", REAL: 2, SUSPICIOUS: 1, FAKE: 0 }, ...] }

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-default)',
    borderRadius: 10,
    color:  'var(--text-primary)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--text-muted)', fontFamily: 'monospace' },
};

const verdictColors = {
  REAL:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  SUSPICIOUS: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  FAKE:       'bg-red-500/15 text-red-400 border-red-500/30',
};

const VerdictBadge = ({ verdict }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${verdictColors[verdict] || verdictColors.REAL}`}>
    {verdict === 'REAL'       && <ShieldCheck size={10} />}
    {verdict === 'SUSPICIOUS' && <AlertTriangle size={10} />}
    {verdict === 'FAKE'       && <AlertOctagon size={10} />}
    {verdict}
  </span>
);

// Mini sparkline — 80×32, no axes, no tooltip
const Sparkline = ({ data, color }) => {
  if (!data || data.length < 2) return <div style={{ width: 80, height: 32 }} />;
  return (
    <div style={{ width: 80, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false}
            isAnimationActive={true} animationDuration={600} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, trend, trendLabel, sparkData, sparkColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-panel p-6 flex flex-col gap-3 group hover:shadow-[0_0_24px_rgba(83,74,183,0.15)] transition-all"
    style={{ border: '1px solid var(--border-default)' }}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</span>
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon size={16} style={{ color }} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div className="text-3xl font-mono font-bold text-[var(--text-primary)]">{value}</div>
      <Sparkline data={sparkData} color={sparkColor || color} />
    </div>
    {trend !== undefined && trend !== null && (
      <div className="flex items-center gap-1 text-xs">
        {trend > 0 ? <TrendingUp size={12} className="text-emerald-400" />
          : trend < 0 ? <TrendingDown size={12} className="text-red-400" />
          : <Minus size={12} className="text-[var(--text-muted)]" />}
        <span className={trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}>
          {trend === 0 ? 'No change' : `${trend > 0 ? '+' : ''}${trend} this week`}
        </span>
      </div>
    )}
  </motion.div>
);

const DashboardHome = ({ user, onNavigate }) => {
  const [stats, setStats]           = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [trendData, setTrendData]   = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingDocs, setLoadingDocs]   = useState(true);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    fetchStats();
    fetchRecentDocs();
    fetchTrendData();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/detector/api/stats/`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setStats(data);
    } catch (e) { console.error('Stats fetch failed', e); }
    finally { setLoadingStats(false); }
  };

  const fetchRecentDocs = async () => {
    try {
      const res = await fetch(`${API_BASE}/detector/api/recent/`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setRecentDocs(data.documents);
    } catch (e) { console.error('Recent docs fetch failed', e); }
    finally { setLoadingDocs(false); }
  };

  // NOTE: This endpoint needs to exist: GET /detector/api/daily-stats/?days=7
  // Returns: { success: true, data: [{ date: "Mon", REAL: n, SUSPICIOUS: n, FAKE: n }] }
  const fetchTrendData = async () => {
    try {
      const res = await fetch(`${API_BASE}/detector/api/daily-stats/?days=7`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) setTrendData(data.data);
    } catch (e) { /* endpoint may not exist yet */ }
  };

  const roleName  = user?.is_forensic_expert ? 'Forensic Expert' : user?.is_staff ? 'Admin' : 'Auditor';
  const roleColor = user?.is_forensic_expert
    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : 'text-[#7F77DD] border-[#534AB7]/30 bg-[#534AB7]/10';

  // FIX 3: Clearance rate calculation
  const realCount  = stats?.real ?? stats?.low_risk ?? 0;
  const totalCount = stats?.total ?? 0;
  const clearanceRate = totalCount > 0 ? `${Math.round((realCount / totalCount) * 100)}%` : 'N/A';

  // Derive sparklines from trendData (last 7 days)
  const toSpark = (key) => trendData.map(d => ({ v: d[key] || 0 }));
  const totalSpark = trendData.map(d => ({ v: (d.REAL || 0) + (d.SUSPICIOUS || 0) + (d.FAKE || 0) }));

  return (
    <div className="space-y-8 pb-12 transition-colors duration-300">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">{today}</p>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {/* FIX 3: Username in brand violet #7F77DD */}
            Welcome back, <span style={{ color: '#7F77DD' }}>{user?.username || 'Analyst'}</span>
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${roleColor}`}>{roleName}</span>
            <span className="text-[var(--text-muted)] text-xs">· Falsum Forensics Platform</span>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#534AB7] hover:bg-[#4540a8] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#534AB7]/30 transition-all">
          <Upload size={16} /> Upload New Document
        </motion.button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loadingStats ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="glass-panel p-6 h-36 animate-pulse" />)
        ) : (
          <>
            <StatCard label="Total Scanned" value={stats?.total ?? 0} icon={FileText} color="#534AB7"
              trend={stats?.trend_new_this_week ?? 0}
              sparkData={totalSpark} sparkColor="#534AB7" delay={0} />
            <StatCard label="Fake Detected" value={stats?.fake ?? 0} icon={AlertOctagon} color="#ef4444"
              sparkData={toSpark('FAKE')} sparkColor="#ef4444" delay={0.05} />
            <StatCard label="Suspicious Flagged" value={stats?.suspicious ?? 0} icon={AlertTriangle} color="#f59e0b"
              sparkData={toSpark('SUSPICIOUS')} sparkColor="#f59e0b" delay={0.1} />
            <StatCard label="Clearance Rate" value={clearanceRate} icon={BarChart2} color="#10b981"
              sparkData={toSpark('REAL')} sparkColor="#10b981" delay={0.15} />
          </>
        )}
      </div>

      {/* FIX 3 ADD: Weekly Verdict Trend Area Chart */}
      {trendData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="glass-panel p-6">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mb-5">
            <BarChart2 size={16} className="text-[#7F77DD]" /> Weekly Verdict Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gREAL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSUSPICIOUS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFAKE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border-default)" strokeOpacity={0.5} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} isAnimationActive={true} />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: 12 }} />
              <Area type="monotone" dataKey="REAL" stroke="#22c55e" fill="url(#gREAL)" strokeWidth={2}
                isAnimationActive={true} animationDuration={600} />
              <Area type="monotone" dataKey="SUSPICIOUS" stroke="#f59e0b" fill="url(#gSUSPICIOUS)" strokeWidth={2}
                isAnimationActive={true} animationDuration={600} />
              <Area type="monotone" dataKey="FAKE" stroke="#ef4444" fill="url(#gFAKE)" strokeWidth={2}
                isAnimationActive={true} animationDuration={600} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent Activity Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--divider)]">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={16} style={{ color: '#7F77DD' }} /> Recent Activity
          </h3>
          <button onClick={() => onNavigate('reports')} className="flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#7F77DD' }}>
            View All <ChevronRight size={14} />
          </button>
        </div>

        {loadingDocs ? (
          <div className="p-8 text-center text-[var(--text-muted)] animate-pulse">Loading recent documents...</div>
        ) : recentDocs.length === 0 ? (
          <div className="p-12 text-center text-[var(--text-muted)]">
            <FileText size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)] font-medium">No documents yet</p>
            <p className="text-sm mt-1">Upload your first document to begin analysis.</p>
            <button onClick={() => onNavigate('upload')}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all"
              style={{ background: 'rgba(83,74,183,0.15)', border: '1px solid rgba(83,74,183,0.3)', color: '#7F77DD' }}>
              <Upload size={14} /> Upload Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--divider)] bg-white/3">
                  {['Document Name', 'Upload Date', 'Verdict', 'Confidence', 'Action'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--divider)]">
                {recentDocs.map((doc) => {
                  const score = doc.score ?? 0;
                  return (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(83,74,183,0.12)', border: '1px solid rgba(83,74,183,0.2)' }}>
                            <FileText size={14} style={{ color: '#7F77DD' }} />
                          </div>
                          <span className="text-[var(--text-primary)] font-medium truncate max-w-[180px]">
                            {doc.original_filename || doc.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)] font-mono text-xs">{doc.uploaded_at}</td>
                      <td className="px-6 py-4"><VerdictBadge verdict={doc.verdict} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                            <div className={`h-full rounded-full ${score > 70 ? 'bg-red-500' : score > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs font-mono text-[var(--text-primary)]">{score}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => onNavigate('document_detail', doc.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                          style={{ background: 'rgba(83,74,183,0.08)', border: '1px solid rgba(83,74,183,0.25)', color: '#7F77DD' }}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DashboardHome;
