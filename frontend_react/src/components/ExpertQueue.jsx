import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, FileText, User, Calendar, ArrowRight, RefreshCw, ShieldOff, Image, CheckCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const VerdictBadge = ({ verdict }) => {
  const map = {
    SUSPICIOUS: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    FAKE:       'bg-red-500/15   text-red-400   border-red-500/30',
    REAL:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${map[verdict] || map.SUSPICIOUS}`}>
      {verdict === 'SUSPICIOUS' && <AlertTriangle size={10} />}
      {verdict}
    </span>
  );
};

const FileIcon = ({ filename }) => {
  const ext = (filename || '').split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  return (
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${isImage ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
      {isImage ? <Image size={16} /> : <FileText size={15} />}
    </div>
  );
};

const ExpertQueue = ({ user, onViewDocument }) => {
  const [queue,     setQueue]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [lastFetch, setLastFetch] = useState(null);

  const isExpert =
    user?.is_forensic_expert ||
    user?.is_staff ||
    (user?.username?.toLowerCase().includes('expert') || false);

  useEffect(() => {
    if (isExpert) fetchQueue();
    else setLoading(false);
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/detector/api/expert-queue/`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
        setLastFetch(new Date().toLocaleTimeString());
      } else {
        setError(data.message || 'Failed to load review queue.');
      }
    } catch {
      setError('Network error — could not load the queue.');
    } finally {
      setLoading(false);
    }
  };

  if (!isExpert) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
          <ShieldOff size={48} className="text-red-400 mx-auto" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-500 max-w-sm">
            The Expert Review Queue is restricted to users with the{' '}
            <strong className="text-[#7F77DD]">Forensic Expert</strong> role.
            Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield size={28} className="text-[#7F77DD]" />
            Expert Review Queue
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Cases assigned to you for forensic review — {queue.length} pending
            {lastFetch && <span className="text-slate-600"> · Last refreshed {lastFetch}</span>}
          </p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#534AB7]/15 hover:bg-[#534AB7]/25 border border-[#534AB7]/30 text-[#7F77DD] rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Info banner */}
      <div className="p-4 bg-[#534AB7]/10 border border-[#534AB7]/25 rounded-xl flex items-start gap-3">
        <Shield size={16} className="text-[#7F77DD] flex-shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm leading-relaxed">
          Only documents <strong className="text-[#7F77DD]">assigned to you</strong> by the administrator appear here.
          Click <strong className="text-[#7F77DD]">Open Review</strong> to examine the full analysis and submit your verdict.
          Once a decision is submitted, the document is removed from this queue.
        </p>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                {['Document', 'Uploaded By', 'Upload Date', 'AI Verdict', 'AI Confidence', 'Action'].map(h => (
                  <th key={h} className={`text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 ${h === 'Action' ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertTriangle size={36} className="text-amber-400 mx-auto mb-3" />
                    <p className="text-amber-400 font-semibold">{error}</p>
                    <button onClick={fetchQueue} className="mt-3 text-xs text-slate-500 hover:text-white transition-colors">
                      Try again
                    </button>
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="p-5 bg-[#534AB7]/10 border border-[#534AB7]/20 rounded-2xl inline-block mb-4">
                      <CheckCircle size={40} className="text-[#7F77DD]" />
                    </div>
                    <p className="text-white font-bold text-lg mb-1">No Cases Assigned</p>
                    <p className="text-slate-500 text-sm">The administrator has not assigned any cases to you yet.</p>
                  </td>
                </tr>
              ) : (
                queue.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileIcon filename={item.filename} />
                        <div>
                          <p className="text-white font-medium truncate max-w-[180px]">{item.filename}</p>
                          <p className="text-[10px] font-mono text-slate-600">{item.document_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <User size={12} className="text-slate-600" />
                        {item.uploaded_by}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar size={12} className="text-slate-600" />
                        {item.uploaded_at}
                      </div>
                    </td>
                    <td className="px-6 py-4"><VerdictBadge verdict={item.verdict} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.score > 70 ? 'bg-red-500' : 'bg-amber-400'}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-white">{item.score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewDocument && onViewDocument(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#534AB7] hover:bg-[#4540a8] text-white rounded-lg transition-all shadow-lg shadow-[#534AB7]/20"
                      >
                        Open Review <ArrowRight size={12} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpertQueue;
