import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, Search, Filter, Calendar, 
  Download, Eye, Trash2, ShieldAlert,
  ArrowRight, CheckCircle, AlertTriangle, X
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const AllDocuments = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [verdictFilter, setVerdictFilter] = useState('All');
    const [selectedDocs, setSelectedDocs] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [docToDelete, setDocToDelete] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState([]);
    const [barData, setBarData] = useState([]);

    useEffect(() => {
        loadData();
    }, [verdictFilter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [docsRes, statsRes] = await Promise.all([
                fetch(`http://localhost:8000/detector/api/admin/documents/?verdict=${verdictFilter}`, { credentials: 'include' }),
                fetch('http://localhost:8000/detector/api/daily-stats/?days=7', { credentials: 'include' })
            ]);
            
            const docsData = await docsRes.json();
            const statsData = await statsRes.json();

            if (docsData.success) setDocuments(docsData.documents);
            if (statsData.success) {
                const mapped = statsData.data.map(d => ({
                    day: d.date,
                    real: d.REAL,
                    sus: d.SUSPICIOUS,
                    fake: d.FAKE
                }));
                setBarData(mapped);
            }
        } catch (e) {
            console.error('Admin documents load failed', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 doc.user.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesVerdict = verdictFilter === 'All' || doc.verdict === verdictFilter;
            return matchesSearch && matchesVerdict;
        });
    }, [documents, searchTerm, verdictFilter]);

    const pieData = useMemo(() => {
        const counts = filteredDocs.reduce((acc, doc) => {
            acc[doc.verdict] = (acc[doc.verdict] || 0) + 1;
            return acc;
        }, {});
        return [
            { name: 'REAL', value: counts.REAL || 0, color: '#3B6D11' },
            { name: 'SUSPICIOUS', value: counts.SUSPICIOUS || 0, color: '#f59e0b' },
            { name: 'FAKE', value: counts.FAKE || 0, color: '#ef4444' },
        ];
    }, [filteredDocs]);

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedDocs(filteredDocs.map(d => d.id));
        else setSelectedDocs([]);
    };

    const handleSelectDoc = (id) => {
        setSelectedDocs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const confirmDelete = (doc) => {
        setDocToDelete(doc);
        setShowDeleteModal(true);
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
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">All Documents</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Global document repository across all auditor accounts.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="btn-falsum-ghost px-4 py-2.5 rounded-xl border-[var(--border-admin)] text-sm">
                        <Download size={16} /> Export Selected ({selectedDocs.length})
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-[#7F77DD] hover:bg-[#6b62d1] text-white font-bold text-sm shadow-lg shadow-[#7F77DD]/20 transition-all flex items-center gap-2">
                        <Calendar size={18} /> Date Range: Mar 06 - Mar 12
                    </button>
                </div>
            </div>

            {/* Summary Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-panel p-6 border-[var(--border-admin)] lg:col-span-2">
                     <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Execution Intensity (7 Days)</h3>
                     <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <BarChart data={barData}>
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
                <div className="glass-panel p-6 border-[var(--border-admin)] flex flex-col items-center">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 self-start">Filtered Analysis</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                             <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-admin)', borderRadius: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* View Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        type="text"
                        placeholder="Filter list by filename or uploader handle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="falsum-input pl-11 border-[var(--border-admin)] bg-[var(--bg-card)] focus:border-[#7F77DD]/50"
                    />
                </div>
                <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-admin)] self-start">
                    {['All', 'REAL', 'SUSPICIOUS', 'FAKE'].map(v => (
                        <button 
                            key={v}
                            onClick={() => setVerdictFilter(v)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider
                                ${verdictFilter === v ? 'bg-[#7F77DD] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
                            `}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

             {/* Documents Table */}
             <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                <th className="px-6 py-4 w-10">
                                    <input type="checkbox" onChange={handleSelectAll} checked={selectedDocs.length === filteredDocs.length && filteredDocs.length > 0} className="w-4 h-4 rounded border-[var(--border-admin)] bg-black/20 text-[#7F77DD]" />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Document Artifact</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Principal Uploader</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Date Captured</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Outcome</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center px-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-admin)]">
                            {filteredDocs.map(doc => (
                                <tr key={doc.id} className="hover:bg-white/3 transition-colors group">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" checked={selectedDocs.includes(doc.id)} onChange={() => handleSelectDoc(doc.id)} className="w-4 h-4 rounded border-[var(--border-admin)] bg-black/20 text-[#7F77DD]" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                <FileText size={18} className="text-[#7F77DD]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{doc.confidence}% Confidence</span>
                                                    {doc.flags > 0 && <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase"><ShieldAlert size={10} /> {doc.flags} Flags</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link to={`/admin/users/${doc.userId}`} className="text-xs font-bold text-[var(--text-secondary)] hover:text-[#7F77DD] transition-all flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] uppercase">{doc.user[0]}</div>
                                            {doc.user}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-[var(--text-muted)]">{doc.date}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase 
                                            ${doc.verdict === 'REAL' ? 'bg-emerald-500/10 text-emerald-400' : 
                                              doc.verdict === 'FAKE' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}
                                        `}>
                                            {doc.verdict}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right px-10">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => navigate(`/admin/documents/${doc.id}`)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[#7F77DD] transition-all"><Eye size={16} /></button>
                                            <button onClick={() => confirmDelete(doc)} className="p-2 rounded-lg hover:bg-red-500/15 text-[var(--text-muted)] hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 max-w-md w-full border-red-500/30">
                            <div className="flex items-center gap-3 mb-6 text-red-400">
                                <AlertTriangle size={24} />
                                <h3 className="text-xl font-bold uppercase tracking-tight">Security Override Required</h3>
                                <button onClick={() => setShowDeleteModal(false)} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                            </div>

                            <p className="text-sm text-[var(--text-secondary)] mb-6">You are about to permanently purge <span className="text-red-400 font-bold">{docToDelete?.name}</span> and all associated forensic analysis artifacts. This operation is irreversible and will be logged in the system audit trail.</p>
                            
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Type <span className="text-red-400">DELETE</span> to confirm permanent erasure</label>
                                <input 
                                    type="text" 
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="falsum-input bg-black/20 border-red-500/20 focus:border-red-500/50" 
                                    placeholder="DELETE" 
                                />
                                <button 
                                    disabled={deleteConfirmText !== 'DELETE'}
                                    className="w-full h-12 rounded-xl bg-red-500 text-white font-bold shadow-xl shadow-red-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    Confirm Artifact Erasure
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AllDocuments;
