import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ClipboardCheck, Search, Filter, Calendar, 
  Download, Eye, UserPlus, ShieldAlert, FileText,
  ArrowRight, CheckCircle, AlertTriangle, X, Clock, HelpCircle,
  UserCheck, Shield, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Expert Assignment Modal ───────────────────────────────────────────────
const AssignModal = ({ experts, currentAssigned, onAssign, onClose }) => {
  const overlayRef = useRef(null);

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const avatarColor = (name) => {
    const colors = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative w-full max-w-sm mx-4 rounded-2xl border border-[#7F77DD]/30 bg-[#13142a] shadow-2xl shadow-[#7F77DD]/10 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#7F77DD]/15 border border-[#7F77DD]/20">
              <UserCheck size={18} className="text-[#7F77DD]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Assign Forensic Expert</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Select an expert to review this case</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Expert List */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {experts.length === 0 ? (
            <div className="text-center py-8">
              <Shield size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No forensic experts available.</p>
              <p className="text-slate-600 text-xs mt-1">Create an expert via User Management.</p>
            </div>
          ) : (
            experts.map((expert) => {
              const isSelected = expert === currentAssigned;
              return (
                <motion.button
                  key={expert}
                  onClick={() => { onAssign(expert); onClose(); }}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                    ${isSelected
                      ? 'bg-[#7F77DD]/15 border-[#7F77DD]/40 text-white'
                      : 'bg-white/3 border-white/8 hover:bg-[#7F77DD]/10 hover:border-[#7F77DD]/25 text-slate-300'
                    }`}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColor(expert)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {expert.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{expert}</p>
                    <p className="text-[10px] text-slate-500">Forensic Expert</p>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-[#7F77DD] bg-[#7F77DD]/10 px-2 py-0.5 rounded-md border border-[#7F77DD]/25">
                      Assigned
                    </span>
                  )}
                  {!isSelected && <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />}
                </motion.button>
              );
            })
          )}
        </div>

        {/* Unassign option */}
        {currentAssigned !== 'Unassigned' && (
          <div className="px-4 pb-4">
            <button
              onClick={() => { onAssign('Unassigned'); onClose(); }}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-red-400 border border-white/5 hover:border-red-400/20 rounded-xl transition-all hover:bg-red-500/5"
            >
              Remove Assignment
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const API_BASE = 'http://localhost:8000';

const ForensicQueue = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [expertFilter, setExpertFilter] = useState('All');
    const [modalCaseId, setModalCaseId] = useState(null); // which case's assign modal is open
    
    const [pendingCases, setPendingCases] = useState([]);
    const [forensicExperts, setForensicExperts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueueData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Queue (ONLY pending documents requested by auditor)
            const queueRes = await fetch(`${API_BASE}/detector/api/expert-queue/`, { credentials: 'include' });
            const queueJson = await queueRes.json();
            
            // 2. Fetch Experts for dropdown
            const usersRes = await fetch(`${API_BASE}/detector/api/admin/users/`, { credentials: 'include' });
            const usersJson = await usersRes.json();
            
            if (usersJson.success) {
                const experts = usersJson.users
                    .filter(u => u.role === 'forensic_expert')
                    .map(u => u.username);
                setForensicExperts(experts);
            }

            if (queueJson.success) {
                setPendingCases(queueJson.queue.map(q => ({
                    id: q.id,
                    name: q.filename,
                    user: q.uploaded_by,
                    userId: q.id,
                    date: q.uploaded_at.split(' ')[0],
                    timeInQueue: 'Pending',
                    assigned: q.reviewer || 'Unassigned',
                    priority: q.verdict === 'FAKE' ? 'HIGH' : 'MEDIUM',
                    confidence: q.score,
                    status: q.review_status
                })));
            }
        } catch (e) {
            console.error('Queue fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueueData();
    }, []);

    const filteredCases = useMemo(() => {
        return pendingCases.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 c.user.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesExpert = expertFilter === 'All' || c.assigned === expertFilter;
            return matchesSearch && matchesExpert;
        });
    }, [pendingCases, searchTerm, expertFilter]);

    const stats = {
        total: pendingCases.length,
        unassigned: pendingCases.filter(c => c.assigned === 'Unassigned').length,
        avgTime: '2.4 days',
        expertsActive: forensicExperts.length
    };

    const handleAssign = async (id, expert) => {
        try {
            const res = await fetch(`${API_BASE}/detector/api/admin/assign-expert/${id}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expert }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setPendingCases(prev => prev.map(c => c.id === id ? { ...c, assigned: expert } : c));
            }
        } catch (e) {
            console.error('Assign failed', e);
        }
    };

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
         <div className="w-8 h-8 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin" />
      </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Expert Analysis Hub</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Delegated forensic tasks requested by platform auditors.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="btn-falsum-ghost px-4 py-2.5 rounded-xl border-[var(--border-admin)] text-sm">
                        <Download size={16} /> Audit Trail
                    </button>
                </div>
            </div>

            {/* Queue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: 'Pending Reviews', value: stats.total, icon: ClipboardCheck, color: 'text-[#7F77DD]' },
                    { label: 'Unassigned Cases', value: stats.unassigned, icon: HelpCircle, color: 'text-amber-500' },
                    { label: 'Avg Latency', value: stats.avgTime, icon: Clock, color: 'text-emerald-500' },
                    { label: 'Available Personnel', value: stats.expertsActive, icon: ShieldAlert, color: 'text-red-500' }
                 ].map((s, i) => (
                    <div key={i} className="glass-panel p-6 border-[var(--border-admin)]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/5">
                               <s.icon className={s.color} size={24} />
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{s.label}</p>
                               <h4 className="text-2xl font-bold mt-1 tracking-tighter">{s.value}</h4>
                            </div>
                        </div>
                    </div>
                 ))}
            </div>

            {/* Filter Toolbar */}
            <div className="glass-panel p-4 border-[var(--border-admin)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                   <input 
                      type="text" 
                      placeholder="Search cases by filename or user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-[#7F77DD]/50 outline-none transition-all"
                   />
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <Filter size={14} className="text-[var(--text-muted)]" />
                       <select 
                          value={expertFilter}
                          onChange={(e) => setExpertFilter(e.target.value)}
                          className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none border-none cursor-pointer"
                       >
                          <option value="All" className="bg-[#1a1c2e]">Filter Assignee</option>
                          {forensicExperts.map(e => <option key={e} value={e} className="bg-[#1a1c2e]">{e}</option>)}
                          <option value="Unassigned" className="bg-[#1a1c2e]">Unassigned</option>
                       </select>
                    </div>
                </div>
            </div>

            {/* Queue Table */}
            <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Document Artifact</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Detection Confidence</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Expert Assignee</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right px-8">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-admin)]/40">
                            {filteredCases.map((doc) => (
                                <tr key={doc.id} className="group hover:bg-white/2 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${doc.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'} border border-white/5`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{doc.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">Requested by <span className="text-[var(--text-secondary)]">{doc.user}</span> • {doc.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                           <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-white/5 overflow-hidden">
                                              <div className={`h-full ${doc.priority === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${doc.confidence}%` }} />
                                           </div>
                                           <span className={`text-[10px] font-bold ${doc.priority === 'HIGH' ? 'text-red-400' : 'text-amber-400'}`}>
                                              {doc.confidence}%
                                           </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {doc.assigned === 'Unassigned' ? (
                                                <button
                                                    onClick={() => setModalCaseId(doc.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-dashed border-white/20 text-slate-400 hover:border-[#7F77DD]/50 hover:text-[#7F77DD] hover:bg-[#7F77DD]/5 transition-all"
                                                >
                                                    <UserCheck size={12} /> Assign Expert
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setModalCaseId(doc.id)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#7F77DD]/15 text-[#7F77DD] border border-[#7F77DD]/30 hover:bg-[#7F77DD]/25 transition-all"
                                                >
                                                    <div className="w-4 h-4 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[8px] font-black">
                                                        {doc.assigned.charAt(0).toUpperCase()}
                                                    </div>
                                                    {doc.assigned}
                                                </button>
                                            )}
                                        </div>
                                        {/* Assignment Modal */}
                                        <AnimatePresence>
                                            {modalCaseId === doc.id && (
                                                <AssignModal
                                                    experts={forensicExperts}
                                                    currentAssigned={doc.assigned}
                                                    onAssign={(expert) => handleAssign(doc.id, expert)}
                                                    onClose={() => setModalCaseId(null)}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </td>
                                    <td className="px-6 py-4 text-right px-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`/admin/documents/${doc.id}`)}
                                                className="p-2 rounded-xl border border-white/10 hover:border-[#7F77DD]/30 text-[var(--text-muted)] hover:text-[#7F77DD] transition-all cursor-pointer"
                                                title="View Forensic Artifacts"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCases.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5 text-[var(--text-muted)] opacity-20">
                                <ClipboardCheck size={32} />
                            </div>
                            <h4 className="text-sm font-bold text-[var(--text-muted)]">Queue is clear: No pending expert requests</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForensicQueue;
