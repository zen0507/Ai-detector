import { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Database, Globe, 
  ShieldCheck, Server, Zap, RefreshCw,
  HardDrive, Monitor, Terminal, TerminalIcon, 
  CheckCircle, AlertOctagon, Info, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

const SystemHealth = () => {
    const [healthLog, setHealthLog] = useState([]);
    const [uptime, setUptime] = useState('14d 22h 42m');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [stats, setStats] = useState({
        cpu: 18,
        mem: 42,
        latency: 42,
        ai_engine: 'ONLINE',
        db_cluster: 'HEALTHY',
        fastapi: 'OPERATIONAL',
        worker_node: 'READY'
    });

    useEffect(() => {
        const interval = setInterval(() => {
            fetchHealth();
        }, 5000);
        fetchHealth();
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await fetch(`${API_BASE}/detector/api/admin/health/`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                setStats(data);
                setUptime(data.uptime);
                
                setHealthLog(prev => {
                    const newEntry = {
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        cpu: data.cpu,
                        mem: data.mem,
                        latency: data.latency
                    };
                    const newLog = [...prev, newEntry];
                    return newLog.length > 20 ? newLog.slice(1) : newLog;
                });
            }
        } catch (e) {
            console.error('Health fetch failed', e);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchHealth();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">System Health & Infrastructure</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Real-time heartbeat and performance telemetry for the Falsum platform.</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[var(--text-muted)] text-[10px] font-mono">
                      UPTIME: {uptime}
                   </div>
                   <button 
                      onClick={handleRefresh}
                      className={`p-2.5 rounded-xl border border-[var(--border-admin)] text-[var(--text-muted)] hover:text-[#7F77DD] hover:bg-[#7F77DD]/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                   >
                      <RefreshCw size={18} />
                   </button>
                </div>
            </div>

            {/* Health Ticker Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: 'Detection Engine', value: stats.ai_engine, icon: Zap, color: stats.ai_engine === 'ONLINE' ? 'text-emerald-500' : 'text-red-500', bg: 'bg-emerald-500/10' },
                    { label: 'Database Status', value: stats.db_cluster, icon: Database, color: stats.db_cluster === 'HEALTHY' ? 'text-emerald-500' : 'text-amber-500', bg: 'bg-emerald-500/10' },
                    { label: 'Core API Layer', value: stats.fastapi, icon: Globe, color: stats.fastapi === 'OPERATIONAL' ? 'text-emerald-500' : 'text-red-500', bg: 'bg-emerald-500/10' },
                    { label: 'PostgreSQL Pool', value: 'OPTIMAL', icon: Activity, color: 'text-[#7F77DD]', bg: 'bg-[#7F77DD]/10' }
                 ].map((item, i) => (
                    <div key={i} className="glass-panel p-5 border-[var(--border-admin)] flex items-center justify-between group hover:border-[#7F77DD]/30 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${item.bg} border border-white/5 group-hover:scale-110 transition-transform`}>
                             <item.icon className={item.color} size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{item.label}</p>
                             <h4 className="text-sm font-bold mt-0.5">{item.value}</h4>
                          </div>
                       </div>
                       <ShieldCheck className="text-white/5 group-hover:text-[#7F77DD]/20 transition-all" size={24} />
                    </div>
                 ))}
            </div>

            {/* Performance Monitoring Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 border-[var(--border-admin)] lg:col-span-2 space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Activity className="text-[#7F77DD]" size={18} />
                           <h3 className="text-sm font-bold text-[var(--text-primary)]">System Load & LATENCY (Live)</h3>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#7F77DD]" /> CPU</span>
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B6D11]" /> MEMORY</span>
                        </div>
                     </div>
                     <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                            <AreaChart data={healthLog}>
                                <defs>
                                    <linearGradient id="colorCPU" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#7F77DD" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="cpu" stroke="#7F77DD" strokeWidth={2} fillOpacity={1} fill="url(#colorCPU)" />
                                <Area type="monotone" dataKey="mem" stroke="#3B6D11" strokeWidth={2} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                     </div>
                </div>

                <div className="glass-panel p-6 border-[var(--border-admin)] space-y-8">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Zap className="text-amber-500" size={18} />
                           <h3 className="text-sm font-bold text-[var(--text-primary)]">API Response Latency</h3>
                        </div>
                        <span className="text-[10px] font-mono text-amber-500">{stats.latency}ms</span>
                     </div>
                     <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                            <LineChart data={healthLog}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                                <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>

            {/* Bottom Row - Servers & Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 border-[var(--border-admin)] flex items-center gap-6 group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[var(--text-muted)] group-hover:scale-110 group-hover:text-[#10b981] transition-all">
                      <Server size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold">Web Server 01</h4>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1 tracking-widest font-mono">Instance: Gunicorn worker-41</p>
                      <div className="flex items-center gap-1.5 mt-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                         <span className="text-[9px] font-bold text-emerald-500 uppercase">Online</span>
                      </div>
                   </div>
                </div>

                <div className="glass-panel p-6 border-[var(--border-admin)] flex items-center gap-6 group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[var(--text-muted)] group-hover:scale-110 group-hover:text-[#7F77DD] transition-all">
                      <Terminal size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold">Python Runtime</h4>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1 tracking-widest font-mono">CPython 3.11.4 [MSC v.1934]</p>
                      <div className="flex items-center gap-1.5 mt-2">
                         <div className="w-2 h-2 rounded-full bg-[#7F77DD]" />
                         <span className="text-[9px] font-bold text-[#7F77DD] uppercase">Optimized</span>
                      </div>
                   </div>
                </div>

                <div className="glass-panel p-6 border-[var(--border-admin)] flex items-center gap-6 group">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-[var(--text-muted)] group-hover:scale-110 group-hover:text-amber-500 transition-all">
                      <HardDrive size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold">Database Storage</h4>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mt-1 tracking-widest font-mono">Size: 4.8 GB / 20 GB</p>
                      <div className="flex items-center gap-1.5 mt-2">
                         <div className="w-2 h-2 rounded-full bg-amber-500" />
                         <span className="text-[9px] font-bold text-amber-500 uppercase">24% Utilized</span>
                      </div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
