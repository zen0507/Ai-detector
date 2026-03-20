import { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, Search, Filter, Calendar, 
  Download, Eye, User, Lock, AlertTriangle,
  FileText, Activity, Trash2, ArrowRight, ShieldCheck, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditLog = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('http://localhost:8000/detector/api/admin/audit-logs/', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setLogs(data.logs);
        } catch (e) {
            console.error('Audit logs fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(l => {
            const matchesSearch = l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 l.target.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSeverity = severityFilter === 'All' || l.severity === severityFilter;
            return matchesSearch && matchesSeverity;
        });
    }, [logs, searchTerm, severityFilter]);

    const openLogDetail = (log) => {
        setSelectedLog(log);
        setShowDetailModal(true);
    };

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin" />
      </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">System Audit Trail</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Immutable ledger of all administrative and security operations.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="btn-falsum-ghost px-4 py-2.5 rounded-xl border-[var(--border-admin)] text-sm">
                        <Download size={16} /> Export Regulatory Report
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-sm shadow-lg shadow-red-500/10 transition-all flex items-center gap-2">
                        <ShieldAlert size={18} /> Clear Non-Critical Logs
                    </button>
                </div>
            </div>

            {/* Filter Mechanism */}
            <div className="flex flex-col md:flex-row gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        type="text"
                        placeholder="Filter by action code, operator, or target identifier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="falsum-input pl-11 border-[var(--border-admin)] bg-[var(--bg-card)] focus:border-[#7F77DD]/50"
                    />
                </div>
                <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-admin)] self-start shrink-0">
                    {['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                        <button 
                            key={s}
                            onClick={() => setSeverityFilter(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider
                                ${severityFilter === s ? 'bg-[#7F77DD] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
                            `}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audit Table */}
            <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest w-16 text-center">Severity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Protocol Action</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Operator Principal</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Target Artifact</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Temporal Signature</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right px-10">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-admin)]">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-white/3 transition-colors group cursor-pointer" onClick={() => openLogDetail(log)}>
                                    <td className="px-8 py-4 text-center">
                                       <div className={`w-2.5 h-2.5 rounded-full mx-auto border-4 border-white/5 
                                          ${log.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 
                                            log.severity === 'HIGH' ? 'bg-orange-500' : 
                                            log.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-[#7F77DD]'}
                                       `} />
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                             <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#7F77DD]">
                                                 {log.action.includes('USER') ? <User size={14} /> : 
                                                  log.action.includes('ARTIFACT') ? <Trash2 size={14} /> :
                                                  log.action.includes('VERDICT') ? <ShieldCheck size={14} /> : <Activity size={14} />}
                                             </div>
                                             <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">{log.action}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-bold text-[var(--text-secondary)]">{log.user}</td>
                                    <td className="px-8 py-4">
                                        <span className="text-xs text-[var(--text-muted)] font-mono">{log.target}</span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                             <span className="text-xs font-bold text-[var(--text-primary)]">{log.time}</span>
                                             <span className="text-[10px] text-[var(--text-muted)] font-mono">{log.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right px-10">
                                         <button className="p-2.5 rounded-xl hover:bg-white/5 text-[var(--text-muted)] hover:text-[#7F77DD] transition-all"><Eye size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Log Detail Modal */}
            <AnimatePresence>
                {showDetailModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-10 max-w-lg w-full border-[#7F77DD]/30">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-admin)]">
                                 <div>
                                      <h3 className="text-xl font-bold tracking-tight">System Event Manifest</h3>
                                      <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">EVENT_ID: {String(selectedLog?.id || '').padStart(8, '0')}</p>
                                 </div>
                                 <button onClick={() => setShowDetailModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={24} /></button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                     <LogField label="Action Protocol" value={selectedLog?.action} mono />
                                     <LogField label="Risk Severity" value={selectedLog?.severity} color={selectedLog?.severity === 'CRITICAL' ? '#ef4444' : '#7F77DD'} />
                                     <LogField label="Operator Handle" value={selectedLog?.user} />
                                     <LogField label="Network Origin (IP)" value={selectedLog?.ip} mono />
                                </div>

                                <div className="p-5 rounded-2xl bg-white/3 border border-[var(--border-admin)]">
                                     <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Narrative Context</p>
                                     <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">"{selectedLog?.detail}"</p>
                                </div>

                                <div className="space-y-3">
                                     <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Digital Timestamp</p>
                                     <div className="flex items-center gap-2 text-xs font-mono bg-black/20 p-3 rounded-lg border border-white/5">
                                          <Calendar size={14} className="text-[#7F77DD]" /> {selectedLog?.date} at 14:42:01.002 UTC
                                     </div>
                                </div>

                                <button onClick={() => setShowDetailModal(false)} className="w-full h-14 rounded-2xl bg-[#7F77DD] text-white font-bold shadow-xl shadow-[#7F77DD]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                    <ShieldCheck size={20} /> Acknowledge Forensic Log
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const LogField = ({ label, value, mono, color }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</label>
        <p className={`text-sm font-bold tracking-tight ${mono ? 'font-mono' : ''}`} style={{ color }}>{value}</p>
    </div>
);

export default AuditLog;
