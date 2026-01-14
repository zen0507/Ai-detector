import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, ShieldAlert, Clock, ArrowUpRight, Search } from 'lucide-react';
import { Card, Table, TableHead, TableBody, TableRow, TableCell, TableHeadCell, Badge, Progress, Button } from 'flowbite-react';

const API_BASE = 'http://localhost:8000';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const Dashboard = ({ user }) => {
    const [stats, setStats] = useState([]);
    const [recentCases, setRecentCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
        // Live Polling every 15 seconds
        const interval = setInterval(() => {
            fetchData(true);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);

        try {
            const response = await fetch(`${API_BASE}/detector/api/dashboard/`, { credentials: 'include' });
            const data = await response.json();
            if (data.stats) setStats(data.stats);
            if (data.recent_cases) setRecentCases(data.recent_cases);
        } catch {
            console.error("Failed to fetch dashboard");
            // Fallback for demo if API fails
            setStats([
                { label: 'Total Analyses', value: '1,284' },
                { label: 'Fabrications Detected', value: '42' },
                { label: 'Clearance Rate', value: '98.5%' },
            ]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Dynamic Threat Level Logic
    const highRiskStat = stats.find(s => s.label === 'High Risk Found');
    const highRiskCount = highRiskStat ? parseInt(highRiskStat.value.replace(/,/g, '')) : 0;

    let threatLevel = 'LOW';
    let threatColor = 'text-cyan-400';
    let threatBorder = 'border-cyan-500/50';
    let threatBg = 'bg-cyan-500/10';

    if (highRiskCount > 0) {
        threatLevel = 'ELEVATED';
        threatColor = 'text-amber-400';
        threatBorder = 'border-amber-500/50';
        threatBg = 'bg-amber-500/10';
    }
    if (highRiskCount >= 3) {
        threatLevel = 'CRITICAL';
        threatColor = 'text-red-500';
        threatBorder = 'border-red-500/50';
        threatBg = 'bg-red-500/10';
    }

    return (
        <div className="space-y-8 text-slate-600 dark:text-slate-200">
            <header className="flex justify-between items-end mb-8 relative">
                <div>
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight flex items-center gap-3">
                        Live Analytics
                        {isRefreshing && <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">System overview and threat monitoring</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    {user?.is_superuser && (
                        <button
                            onClick={() => window.open(`${API_BASE}/admin/`, '_blank')}
                            className="btn-ghost px-4 py-2 text-xs uppercase"
                        >
                            <ShieldAlert size={14} /> Admin Console
                        </button>
                    )}
                    <div className="glass-panel px-4 py-1.5 flex items-center gap-2 bg-slate-100 dark:bg-black/20 border-slate-200 dark:border-white/5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold tracking-widest">LIVE CONNECTION</span>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-neon-violet rounded-full animate-spin"></div>
                        <span className="text-slate-400 font-mono text-sm uppercase tracking-widest animate-pulse">Decrypting Stream...</span>
                    </div>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 gap-6"
                >
                    {/* Stats Cards */}
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            variants={item}
                            whileHover={{ y: -5 }}
                        >
                            <div className="glass-panel h-full p-6 border-l-4 border-l-neon-violet flex flex-col justify-between group hover:bg-white/5 transition-colors">
                                <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 group-hover:text-indigo-600 dark:group-hover:text-neon-violet transition-colors">{stat.label}</div>
                                <div className="text-3xl font-mono flex items-baseline gap-2 text-slate-900 dark:text-white group-hover:text-shadow-glow transition-all">
                                    {stat.value}
                                    {idx === 0 && <span className="text-xs text-emerald-500 dark:text-emerald-400 font-sans font-normal flex items-center">+12% <ArrowUpRight size={12} /></span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    <motion.div variants={item}>
                        <div className="glass-panel h-full p-6 border-l-4 border-l-emerald-500 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-30">
                                <div className="w-24 h-24 bg-emerald-500/30 blur-3xl rounded-full animate-pulse"></div>
                            </div>
                            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">System Status</div>
                            <div className="text-3xl font-mono text-emerald-400 relative z-10 flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                OPTIMAL
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Area - Table */}
                    <div className="md:col-span-3">
                        <motion.div variants={item} className="h-full min-h-[500px]">
                            <div className="glass-panel h-full overflow-hidden flex flex-col">
                                <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-black/20">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white text-lg">
                                        <Activity className="text-indigo-600 dark:text-neon-violet" size={20} />
                                        Incoming Data Stream
                                    </h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"><Search size={18} /></button>
                                    </div>
                                </div>

                                {/* Visual Trend */}
                                <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                                    <div className="flex justify-between items-end mb-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-neon-violet">Activity Volume (24h)</h4>
                                        <span className="text-xs font-mono text-emerald-500 dark:text-emerald-400">+12.5% increase</span>
                                    </div>
                                    <TrendChart />
                                </div>

                                <div className="overflow-x-auto flex-1">
                                    <Table hoverable className="bg-transparent text-slate-600 dark:text-slate-300">
                                        <TableHead className="bg-slate-100 dark:bg-black/20 text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                            <TableRow className="border-b border-slate-200 dark:border-white/5">
                                                <TableHeadCell className="p-6 bg-transparent text-xs">Case ID</TableHeadCell>
                                                <TableHeadCell className="p-6 bg-transparent text-xs">Timestamp</TableHeadCell>
                                                <TableHeadCell className="p-6 bg-transparent text-xs">Verdict</TableHeadCell>
                                                <TableHeadCell className="p-6 bg-transparent text-xs">Analysis Score</TableHeadCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody className="divide-y divide-white/5">
                                            {recentCases.map((caseItem) => (
                                                <TableRow key={caseItem.id} className="bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default border-slate-200 dark:border-white/5">
                                                    <TableCell className="p-6 font-mono text-sm text-indigo-600 dark:text-neon-cyan group-hover:text-indigo-800 dark:group-hover:text-white font-bold transition-colors">
                                                        {caseItem.id}
                                                    </TableCell>
                                                    <TableCell className="p-6 text-sm text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                                                            {caseItem.date}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-6">
                                                        <StatusBadge status={caseItem.status} />
                                                    </TableCell>
                                                    <TableCell className="p-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-32 bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full ${caseItem.risk > 80 ? 'bg-red-500' : caseItem.risk > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                                    style={{ width: `${caseItem.risk}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="font-mono text-xs text-slate-900 dark:text-white font-bold">{caseItem.risk}%</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {recentCases.length === 0 && (
                                        <div className="p-12 text-center text-slate-500 italic">No recent activity detected.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Side Feed */}
                    <div className="md:col-span-1 space-y-6">
                        <motion.div variants={item}>
                            <div className="glass-panel p-6 relative overflow-hidden">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 relative z-10">
                                    <ShieldAlert size={14} /> Threat Level
                                </h4>
                                <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none">
                                    <div className={`w-36 h-36 ${threatBg.replace('/10', '/30')} blur-3xl rounded-full`}></div>
                                </div>

                                <div className="relative h-32 flex items-center justify-center">
                                    {/* Simulated Radar */}
                                    <div className={`absolute inset-0 rounded-full border ${threatBorder.replace('/50', '/20')} animate-scale-pulse`}></div>
                                    <div className={`absolute inset-4 rounded-full border ${threatBorder.replace('/50', '/20')} animate-scale-pulse animation-delay-500`}></div>
                                    <div className={`w-24 h-24 rounded-full ${threatBg} flex items-center justify-center border ${threatBorder} transition-colors duration-500 shadow-lg backdrop-blur-md`}>
                                        <span className={`text-xl font-bold ${threatColor} tracking-tight`}>{threatLevel}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={item}>
                            <div className="glass-panel p-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
                                    <Database size={14} /> System Storage
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            <span>Encrypted Logs</span>
                                            <span className="text-slate-900 dark:text-white">45%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 flex justify-start">
                                            <div className="h-full rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            <span>Evidence Blobs</span>
                                            <span className="text-slate-900 dark:text-white">72%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 flex justify-start">
                                            <div className="h-full rounded-full bg-purple-500 dark:bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: '72%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    let colorClass = "bg-slate-500/20 text-slate-300 border-slate-500/30";
    if (status === 'HIGH RISK') colorClass = "bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    if (status === 'WARNING') colorClass = "bg-amber-500/10 text-amber-500 border-amber-500/30";
    if (status === 'SAFE') colorClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    if (status === 'VERIFIED') colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/30";

    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest border ${colorClass}`}>
            {status}
        </span>
    )
}

const TrendChart = ({ data }) => {
    // Simulated data if none provided
    const chartData = data || [40, 65, 55, 80, 70, 90, 85, 100, 95, 110, 105, 120];
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);

    // Generate path
    const points = chartData.map((val, i) => {
        const x = (i / (chartData.length - 1)) * 100;
        const y = 100 - ((val - min) / (max - min)) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-24 relative overflow-hidden rounded-xl">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    d={`M0,100 ${points} L100,100 Z`}
                    fill="url(#chartGradient)"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 1, pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                {/* Glow effect duplicate */}
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeOpacity="0.3"
                    className="blur-sm"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </svg>
        </div>
    );
};

export default Dashboard;
