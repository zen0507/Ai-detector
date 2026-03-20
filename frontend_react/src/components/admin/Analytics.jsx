import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Calendar, Download, TrendingUp, 
  Users, FileText, ShieldAlert, Zap, Layers,
  LayoutGrid, Activity, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

const Analytics = () => {
    const [range, setRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        scanVolume: [],
        registrationGrowth: [],
        activeUsers: [],
        enginePerformance: [],
        docTypeData: []
    });

    useEffect(() => {
        fetchAnalytics();
    }, [range]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const days = range === '7d' ? 7 : range === '14d' ? 14 : range === '90d' ? 90 : 30;
            const res = await fetch(`${API_BASE}/detector/api/admin/analytics/?days=${days}`, { credentials: 'include' });
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (e) {
            console.error('Analytics fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#7F77DD', '#3B6D11', '#f59e0b', '#4a4870'];

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
         <div className="w-8 h-8 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin" />
      </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Date Range Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">System Analytics</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Telemetry intelligence and forensic outcome trends.</p>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    {['7d', '14d', '30d', '90d'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                range === r 
                                ? 'bg-[#7F77DD] text-white shadow-lg' 
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {r.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Scan Volume Over Time */}
                <div className="glass-panel p-6 border-[var(--border-admin)] lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="text-[#7F77DD]" size={18} />
                           <h3 className="text-sm font-bold text-[var(--text-primary)]">Platform Scan Volume</h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B6D11]" /> REAL</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" /> SUSPICIOUS</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> FAKE</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                            <AreaChart data={data.scanVolume}>
                                <defs>
                                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B6D11" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B6D11" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="real" stackId="1" stroke="#3B6D11" fillOpacity={1} fill="url(#colorReal)" />
                                <Area type="monotone" dataKey="sus" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                                <Area type="monotone" dataKey="fake" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Document Type Shares */}
                <div className="glass-panel p-6 border-[var(--border-admin)] flex flex-col">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8">Metadata Format Distribution</h3>
                    <div className="flex-1 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={data.docTypeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {data.docTypeData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 mt-6">
                        {data.docTypeData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    {d.name}
                                </span>
                                <span className="text-xs font-bold text-[var(--text-primary)]">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Registration Trends */}
                <div className="glass-panel p-6 border-[var(--border-admin)]">
                     <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8">Forensic Identity Expansion</h3>
                     <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <LineChart data={data.registrationGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                                <Line type="stepAfter" dataKey="users" stroke="#7F77DD" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                     </div>
                </div>

                {/* 4. Engine Capability Radar */}
                <div className="glass-panel p-6 border-[var(--border-admin)]">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8">Analysis Engine Efficacy</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <RadarChart data={data.enginePerformance}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 8 }} />
                                <Radar name="Falsum v2.1" dataKey="A" stroke="#7F77DD" fill="#7F77DD" fillOpacity={0.6} />
                                <Radar name="Legacy" dataKey="B" stroke="#4a4870" fill="#4a4870" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Most Active Experts/Users */}
                <div className="glass-panel p-6 border-[var(--border-admin)]">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-bold text-[var(--text-primary)]">Forensic Power-Users</h3>
                       <LayoutGrid size={16} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="space-y-5">
                        {data.activeUsers.map((u, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5 hover:border-[#7F77DD]/20 transition-all">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-lg bg-[#7F77DD]/10 border border-[#7F77DD]/20 flex items-center justify-center text-[10px] font-bold text-[#7F77DD]">
                                      {u.name[0]}
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold">{u.name}</p>
                                      <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">Dominant Verdict: {u.dominant}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-xs font-bold text-[#7F77DD]">{u.count}</p>
                                   <p className="text-[9px] text-[var(--text-muted)]">Scans</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
