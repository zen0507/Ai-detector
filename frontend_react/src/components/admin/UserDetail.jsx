import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Shield, BarChart2, Calendar, 
  MapPin, Clock, FileText, CheckCircle, AlertOctagon,
  Download, Edit, Ban, FileWarning
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Mock user for initial build
    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/detector/api/admin/users/${id}/`, { credentials: 'include' });
                const data = await res.json();
                if (data.success) {
                    const mapped = {
                        id: data.id,
                        name: data.username,
                        email: data.email,
                        role: data.role === 'forensic_expert' ? 'Forensic Expert' : data.role === 'admin' ? 'Admin' : 'Auditor',
                        status: data.is_active ? 'Active' : 'Deactivated',
                        joined: data.date_joined,
                        lastLogin: 'Recent',
                        lastIP: 'Internal',
                        totalScans: data.stats.total,
                        fakeDetected: data.stats.fake,
                        suspiciousFlagged: data.stats.suspicious,
                        clearanceRate: data.stats.total > 0 ? Math.round((data.stats.real / data.stats.total) * 100) : 0,
                        verdicts: [
                            { name: 'REAL', value: data.stats.real, color: '#3B6D11' },
                            { name: 'SUSPICIOUS', value: data.stats.suspicious, color: '#f59e0b' },
                            { name: 'FAKE', value: data.stats.fake, color: '#ef4444' }
                        ],
                        documents: data.history.map(h => ({
                            id: h.id,
                            name: h.filename,
                            verdict: h.verdict,
                            confidence: 100, // Placeholder confidence for history
                            date: h.date
                        })),
                        timeline: [
                            { type: 'login', time: 'Recent', desc: 'Secure session established' },
                            { type: 'scan', time: 'Lately', desc: `Processed ${data.stats.total} total artifacts.` }
                        ]
                    };
                    setUser(mapped);
                }
            } catch (e) {
                console.error('User detail fetch failed', e);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchUser();
    }, [id]);

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin" />
      </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Back Link */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button 
                        onClick={() => navigate('/admin/users')}
                        className="flex items-center gap-2 text-xs font-bold text-[#7F77DD] uppercase tracking-wider hover:brightness-110"
                    >
                        <ArrowLeft size={14} /> Back to Users
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#7F77DD]/10 border border-[#7F77DD]/30 flex items-center justify-center font-bold text-[#7F77DD] text-2xl">
                            {user.name[0]}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{user.name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[var(--text-secondary)] text-sm flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'Forensic Expert' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>{user.role}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>{user.status}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-falsum-ghost px-5 py-3 rounded-2xl flex items-center gap-2 border-[var(--border-admin)]"><Edit size={16} /> Edit Profile</button>
                    <button className="px-5 py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center gap-2">
                        <Ban size={16} /> Suspend Account
                    </button>
                </div>
            </div>

            {/* Info and Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Account Details */}
                <div className="glass-panel p-8 border-[var(--border-admin)] relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-6 bg-[#7F77DD] rounded-full" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Security Profile</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-y-6">
                        <InfoItem icon={Calendar} label="Date Joined" value={user.joined} />
                        <InfoItem icon={Clock} label="Last Activity" value={user.lastLogin} />
                        <InfoItem icon={MapPin} label="Last Auth IP" value={user.lastIP} mono />
                        <InfoItem icon={Shield} label="Account Stability" value="Validated" color="#10b981" />
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Shield size={120} />
                    </div>
                </div>

                {/* Activity Highlights */}
                <div className="glass-panel p-8 border-[var(--border-admin)] relative flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-primary)]">Productivity Metrics</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-6">
                           <MetricItem label="Total Scans" value={user.totalScans} />
                           <MetricItem label="Fake Flagged" value={user.fakeDetected} />
                           <MetricItem label="Suspicious" value={user.suspiciousFlagged} />
                           <MetricItem label="Clearance Rate" value={user.clearanceRate + "%"} color="#10b981" />
                        </div>
                    </div>
                    <div className="w-48 h-48 shrink-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={user.verdicts} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                                    {user.verdicts.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                            </PieChart>
                         </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Document List */}
            <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                <div className="px-8 py-5 border-b border-[var(--border-admin)] flex items-center justify-between bg-white/2">
                    <div className="flex items-center gap-3">
                        <FileText size={18} className="text-[#7F77DD]" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">User Repository ({user.totalScans})</h3>
                    </div>
                    <button className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 hover:text-[#7F77DD] transition-all">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead>
                            <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                <th className="px-8 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Document Handle</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Verdict</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Assurance</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Capture Date</th>
                                <th className="px-8 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right px-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-admin)]">
                            {user.documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-white/3 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <FileText size={14} className="text-[#7F77DD]" />
                                            <span className="text-xs font-bold text-[var(--text-primary)]">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase 
                                            ${doc.verdict === 'REAL' ? 'bg-emerald-500/10 text-emerald-400' : 
                                              doc.verdict === 'FAKE' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}
                                        `}>
                                            {doc.verdict}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs font-mono font-bold">{doc.confidence}%</span>
                                            <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500" style={{ width: `${doc.confidence}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-mono text-[var(--text-muted)]">{doc.date}</td>
                                    <td className="px-8 py-4 text-right px-10">
                                        <button className="text-[10px] font-bold text-[#7F77DD] uppercase tracking-wider hover:brightness-110">Observe</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Timeline Activity */}
            <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                <div className="px-8 py-5 border-b border-[var(--border-admin)] flex items-center justify-between">
                     <h3 className="text-sm font-bold text-[var(--text-primary)]">System-Wide Audit Path</h3>
                     <BarChart2 size={16} className="text-[var(--text-muted)]" />
                </div>
                <div className="p-8 space-y-8 relative">
                    <div className="absolute left-[47px] top-8 bottom-8 w-[1px] bg-[var(--border-admin)]" />
                    {user.timeline.map((event, i) => (
                        <div key={i} className="flex items-start gap-6 relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-admin)] 
                                ${event.type === 'login' ? 'bg-[#7F77DD]/10 text-[#7F77DD]' : 
                                  event.type === 'scan' ? 'bg-emerald-500/10 text-emerald-400' : 
                                  event.type === 'review' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}
                            `}>
                                {event.type === 'login' ? <Clock size={16} /> : 
                                 event.type === 'scan' ? <FileText size={16} /> : 
                                 event.type === 'review' ? <CheckCircle size={16} /> : <FileWarning size={16} />}
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{event.type}</h4>
                                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{event.time}</span>
                                </div>
                                <p className="text-xs text-[var(--text-muted)]">{event.desc}</p>
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest hover:text-[#7F77DD] transition-all bg-white/2 hover:bg-white/5 rounded-xl border border-[var(--border-admin)]">Load Complete History</button>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, mono, color, border }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
            <Icon size={12} /> {label}
        </label>
        <p className={`text-sm font-semibold tracking-tight ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</p>
    </div>
);

const MetricItem = ({ label, value, color }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
        <p className="text-2xl font-bold tracking-tight" style={{ color }}>{value}</p>
    </div>
);

export default UserDetail;
