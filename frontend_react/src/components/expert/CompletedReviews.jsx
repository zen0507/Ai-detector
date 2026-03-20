import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, FileText, CheckCircle, XCircle, 
  ExternalLink, Calendar, Clock, Filter,
  ShieldCheck, ShieldAlert, ChevronRight
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const CompletedReviews = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/detector/api/expert/completed/`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setReviews(data.reviews);
      } catch (e) {
        console.error('Failed to fetch review history', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = reviews.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.summary.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-[var(--expert-teal)]/20 border-t-[var(--expert-teal)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Completed Reviews</h1>
          <p className="text-slate-500 text-sm">Historical archive of all forensic conclusions signed by your account.</p>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search history..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm w-full md:w-80 focus:border-[var(--expert-teal)] outline-none transition-all"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/2 border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Document</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Forensic Verdict</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Review Summary</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date / Time</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length > 0 ? (
              filtered.map((r) => (
                <motion.tr 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  key={r.id} 
                  className="hover:bg-white/3 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[var(--expert-teal)]/10 group-hover:text-[var(--expert-teal)] transition-all">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5 truncate max-w-[200px]">{r.name}</p>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{r.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${r.verdict === 'FAKE' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {r.verdict === 'FAKE' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                        {r.verdict} CONFIRMED
                      </div>
                      <span className="text-[9px] text-slate-600">CONFIDENCE: {r.confidence.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell">
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed italic">"{r.summary}"</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-white">
                        <Calendar size={12} className="text-slate-500" /> {r.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock size={12} /> {r.time}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-[var(--expert-teal)] hover:border-[var(--expert-teal)]/30 hover:bg-[var(--expert-teal)]/5 transition-all">
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-24 text-center">
                   <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-700 mx-auto mb-4">
                      <Search size={32} />
                   </div>
                   <p className="text-sm text-slate-500 italic">No historical reviews found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompletedReviews;
