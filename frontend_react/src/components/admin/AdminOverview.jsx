import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, AlertOctagon, ClipboardCheck, 
  Activity, Cpu, ArrowRight, Download, Eye, Plus, UserPlus
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

const API_BASE = 'http://localhost:8000';

const StatCard = ({ icon: Icon, label, value, subtext, trend, color = "#7F77DD" }) => (
  <div className="glass-panel p-6 border border-[var(--border-admin)] relative group hover:border-[#7F77DD]/40 transition-all">
    <div className="flex items-start justify-between">
      <div className="p-3 rounded-xl bg-white/5 border border-white/5 group-hover:bg-[#7F77DD]/10 group-hover:scale-110 transition-all duration-300" style={{ color }}>
         <Icon size={24} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
          {trend}
        </span>
      )}
    </div>
    <div className="mt-6">
      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</h4>
        {subtext && <span className="text-xs text-[var(--text-muted)] font-medium">/ {subtext}</span>}
      </div>
    </div>
  </div>
);

const AdminOverview = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        auditors: 0,
        experts: 0,
        totalDocs: 0,
        fakeDocs: 0,
        fakePercent: 0,
        pendingReview: 0,
        uptime: 99.9,
        fastapiOnline: true
    });

    const [recentDocs, setRecentDocs] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [verdictData, setVerdictData] = useState([]);
    const [dailyVolume, setDailyVolume] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdminData();
    }, []);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const statsRes = await fetch(`${API_BASE}/detector/api/admin/stats/`, { credentials: 'include' });
            if (!statsRes.ok) throw new Error('Stats fetch failed');
            const statsData = await statsRes.json();
            
            if (statsData.success) {
                setStats(statsData.stats);
                setVerdictData(statsData.verdictData);
            }

            // Fetch daily stats (chart)
            const dailyRes = await fetch(`${API_BASE}/detector/api/daily-stats/?days=14`, { credentials: 'include' });
            const dailyData = await dailyRes.json();
            if (dailyData.success) {
                // Map to Recharts format: { day, real, sus, fake }
                setDailyVolume(dailyData.data.map(d => ({
                    day: d.date,
                    real: d.REAL,
                    sus: d.SUSPICIOUS,
                    fake: d.FAKE
                })));
            }

            // Fetch recent docs
            const docsRes = await fetch(`${API_BASE}/detector/api/admin/documents/`, { credentials: 'include' });
            const docsData = await docsRes.json();
            if (docsData.success) {
                setRecentDocs(docsData.documents.slice(0, 5));
            }

            // Fetch recent users
            const usersRes = await fetch(`${API_BASE}/detector/api/admin/users/`, { credentials: 'include' });
            const usersData = await usersRes.json();
            if (usersData.success) {
                setRecentUsers(usersData.users.slice(0, 5));
            }

        } catch (e) {
            console.error('Admin overview load failed', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin" />
      </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">System Overview</h2>
                    <p className="text-[var(--text-secondary)] mt-2">Real-time telemetry and management controls for Falsum AI.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                         onClick={() => navigate('/admin/documents')}
                         className="btn-falsum-ghost px-5 py-3 rounded-2xl flex items-center gap-2 border-[var(--border-admin)] cursor-pointer"
                    >
                        <Download size={16} /> Export System Report
                    </button>
                    <button 
                        onClick={() => navigate('/admin/users')}
                        className="px-5 py-3 rounded-2xl bg-[#7F77DD] hover:bg-[#6b62d1] text-white font-bold text-sm shadow-xl shadow-[#7F77DD]/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <UserPlus size={18} /> Manage Accounts
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} subtext={stats.experts + " Exp"} trend="+4.2%" />
                <StatCard icon={FileText} label="Total Scans" value={stats.totalDocs} trend="+12k" />
                <StatCard icon={AlertOctagon} label="Fake Detected" value={stats.fakeDocs} subtext={stats.fakePercent + "%"} color="#ef4444" trend="+2.4%" />
                <StatCard icon={ClipboardCheck} label="Pending queue" value={stats.pendingReview} color="#f59e0b" />
                <StatCard icon={Activity} label="System Uptime" value={stats.uptime + "%"} color="#10b981" />
                <StatCard 
                  icon={Cpu} 
                  label="Backend Engine" 
                  value={stats.fastapiOnline ? 'Online' : 'Offline'} 
                  color={stats.fastapiOnline ? '#10b981' : '#ef4444'} 
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-8 border-[var(--border-admin)] min-h-[360px] flex flex-col">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Verdict Distribution</h3>
                     <div className="flex-1 w-full min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                            <PieChart>
                                <Pie data={verdictData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                                    {verdictData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'var(--bg-card)', 
                                    border: '1px solid var(--border-admin)',
                                    borderRadius: '12px',
                                    fontSize: '11px'
                                  }} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex justify-center gap-6 mt-4">
                        {verdictData.map(d => (
                            <div key={d.name} className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)]">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                                {d.name}
                            </div>
                        ))}
                     </div>
                </div>

                <div className="glass-panel p-8 border-[var(--border-admin)] lg:col-span-2 min-h-[360px] flex flex-col">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Execution Volume (14 Days)</h3>
                    <div className="flex-1 w-full min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                            <BarChart data={dailyVolume}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }}
                                />
                                <Bar dataKey="real" stackId="a" fill="#3B6D11" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="sus" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="fake" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Table Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Documents */}
                <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[var(--border-admin)] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">System-Wide Records</h3>
                        <button 
                            onClick={() => navigate('/admin/documents')}
                            className="text-[10px] font-bold text-[#7F77DD] uppercase tracking-wider flex items-center gap-1 hover:brightness-110 cursor-pointer"
                        >
                            All Documents <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Document</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Risk</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right px-8">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-admin)]/40">
                                {recentDocs.map((doc) => (
                                    <tr key={doc.id} className="group hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-white/5 text-[var(--text-muted)]">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[var(--text-primary)]">{doc.name}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{doc.date}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                doc.verdict === 'FAKE' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                doc.verdict === 'SUSPICIOUS' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            }`}>
                                                {doc.verdict}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] font-medium text-[var(--text-secondary)]">{doc.user}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right px-8">
                                            <button 
                                                onClick={() => navigate(`/admin/documents/${doc.id}`)}
                                                className="p-2 rounded-lg hover:bg-[#7F77DD]/10 text-[var(--text-muted)] hover:text-[#7F77DD] transition-all cursor-pointer"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Registrations */}
                <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                    <div className="px-6 py-5 border-b border-[var(--border-admin)] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Identity Provisioning Activity</h3>
                        <button 
                             onClick={() => navigate('/admin/users')}
                             className="text-[10px] font-bold text-[#7F77DD] uppercase tracking-wider flex items-center gap-1 hover:brightness-110 cursor-pointer"
                        >
                            Go to Management <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right px-8">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-admin)]/40">
                                {recentUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-xs font-bold text-[var(--text-primary)]">{user.username}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                                user.is_staff ? 'bg-[#7F77DD]/10 text-[#7F77DD] border border-[#7F77DD]/30' : 'bg-white/5 text-[var(--text-secondary)] border border-white/10'
                                            }`}>
                                                {user.is_staff ? 'System Admin' : user.role === 'forensic_expert' ? 'Forensic Expert' : 'Auditor'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right px-8">
                                            <button 
                                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                                className="text-[10px] font-bold text-[#7F77DD] hover:underline cursor-pointer"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
