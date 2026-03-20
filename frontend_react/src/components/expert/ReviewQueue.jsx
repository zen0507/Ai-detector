import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ArrowUpDown, Clock, 
  User, CheckCircle, AlertTriangle, 
  FileText, Receipt, Landmark, Image,
  ChevronRight, SkipForward, Info, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const API_BASE = 'http://localhost:8000';

const ReviewQueue = ({ user, onViewDocument }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest First');

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch(`${API_BASE}/detector/api/expert-queue/`, { credentials: 'include' });
        const d = await res.json();
        if (d.success) setQueue(d.queue);
      } catch (e) {
        console.error('Failed to fetch expert queue', e);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  // Filtered and sorted queue
  const filteredQueue = queue
    .filter(item => {
      const matchSearch = item.filename.toLowerCase().includes(search.toLowerCase()) || 
                          item.uploaded_by.toLowerCase().includes(search.toLowerCase());
      const matchType = docTypeFilter === 'All' || item.type?.toLowerCase() === docTypeFilter.toLowerCase();
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'Oldest First') return new Date(a.uploaded_at) - new Date(b.uploaded_at);
      if (sortBy === 'Newest First') return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      if (sortBy === 'Highest AI Risk') return b.score - a.score;
      if (sortBy === 'Lowest AI Risk') return a.score - b.score;
      return 0;
    });

  // Summary stats
  const typeCounts = {
    invoice: queue.filter(i => i.type === 'invoice').length,
    receipt: queue.filter(i => i.type === 'receipt').length,
    bank_statement: queue.filter(i => i.type === 'bank_statement').length,
  };

  const chartData = [
    { name: 'Invoices', count: typeCounts.invoice },
    { name: 'Receipts', count: typeCounts.receipt },
    { name: 'Bank St.', count: typeCounts.bank_statement },
  ];

  const getUrgencyColor = (uploadedAt) => {
    const diffHours = (new Date() - new Date(uploadedAt)) / (1000 * 60 * 60);
    if (diffHours > 48) return 'bg-red-500';
    if (diffHours > 24) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Review Queue</h1>
          <p className="text-slate-500 text-sm">You have {filteredQueue.length} pending assignments under the {docTypeFilter} filter.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               placeholder="Search by filename or auditor..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm w-full md:w-64 focus:border-[var(--expert-teal)] outline-none transition-all"
             />
           </div>
           
           <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              {['Oldest First', 'Newest First', 'Highest AI Risk'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${sortBy === opt ? 'bg-[var(--expert-teal)] text-white' : 'text-slate-500 hover:text-slate-200'}`}
                >
                  {opt}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Queue Summary Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pending', value: queue.length, icon: FileText },
          { label: 'Average Wait Time', value: '32h', icon: Clock },
          { label: 'Oldest Document', value: '5.2d', icon: AlertTriangle },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
            <stat.icon className="text-slate-600" size={24} />
          </div>
        ))}
        {/* Mini Chart */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Volume by Type</p>
           <div className="h-10">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <Bar dataKey="count" fill="var(--expert-teal)" radius={2} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        {['All', 'Invoice', 'Receipt', 'Bank_Statement'].map(type => (
          <button
            key={type}
            onClick={() => setDocTypeFilter(type)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              docTypeFilter === type 
                ? 'bg-[var(--expert-teal)]/15 border-[var(--expert-teal)] text-[var(--expert-teal)]' 
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-200 hover:bg-white/8'
            }`}
          >
            {type === 'All' && <Filter size={14} />}
            {type.replace('_', ' ')}
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${docTypeFilter === type ? 'bg-[var(--expert-teal)] text-white' : 'bg-white/10 text-slate-500'}`}>
              {type === 'All' ? queue.length : queue.filter(i => i.type?.toLowerCase() === type.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredQueue.length > 0 ? (
            filteredQueue.map((item, idx) => (
              <QueueCard 
                key={item.id} 
                item={item} 
                urgencyColor={getUrgencyColor(item.uploaded_at)} 
                onExamine={() => onViewDocument(item.id)}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-32 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-xl font-bold mb-2">Queue Clear!</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8">All financial documents have been reviewed. Great work on maintaining the forensic standards.</p>
              <a href="/expert/completed" className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold transition-all inline-flex items-center gap-2">
                <FileText size={16} /> View Completed Reviews
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const QueueCard = ({ item, urgencyColor, onExamine }) => {
  const getIcon = (type) => {
    if (type === 'receipt') return <Receipt size={20} />;
    if (type === 'bank_statement') return <Landmark size={20} />;
    return <FileText size={20} />;
  };

  const getTypeStyle = (type) => {
    if (type === 'receipt') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (type === 'bank_statement') return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
    return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
  };

  // Extract dummy flags if none exist
  const flags = item.flags || ['tax_geography_mismatch', 'signature_deviation', 'line_item_math_error'];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-[var(--expert-teal)]/40 transition-all hover:bg-white/8 flex flex-col h-full"
    >
      {/* Urgency Strip */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${urgencyColor}`} />

      <div className="p-6 pb-0 flex items-start justify-between">
         <div className={`p-2.5 rounded-xl ${getTypeStyle(item.type)}`}>
            {getIcon(item.type)}
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">AI Confidence</span>
            <div className="flex items-center gap-2">
               <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${item.score}%` }} />
               </div>
               <span className="text-xs font-mono font-bold text-red-500">{item.score}%</span>
            </div>
         </div>
      </div>

      <div className="p-6 py-4 flex-1">
         <h3 className="text-lg font-bold text-white mb-1 truncate" title={item.filename}>{item.filename}</h3>
         <div className="flex items-center gap-2 mb-4">
            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${getTypeStyle(item.type)}`}>
               {item.type?.replace('_', ' ') || 'INVOICE'}
            </span>
            <span className="text-slate-600 text-[10px] uppercase font-bold tracking-tighter">SUSPICIOUS VERDICT</span>
         </div>

         <div className="flex flex-wrap gap-1.5 mb-6">
            {flags.slice(0, 3).map(flag => (
               <span key={flag} className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-bold text-red-400 capitalize">
                  {flag.replace(/_/g, ' ')}
               </span>
            ))}
         </div>

         <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/5">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <User size={14} />
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Auditor</p>
                  <p className="text-xs font-bold text-white truncate">{item.uploaded_by}</p>
               </div>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <Clock size={14} />
               </div>
               <div className="min-w-0">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Time Waiting</p>
                  <p className="text-xs font-bold text-white truncate">14h ago</p>
               </div>
            </div>
         </div>
      </div>

      <div className="p-4 bg-white/3 flex items-center gap-3">
         <button className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--expert-teal)] text-white text-xs font-bold shadow-lg shadow-[var(--expert-teal)]/10 hover:shadow-[var(--expert-teal)]/25 transition-all flex items-center justify-center gap-2" onClick={onExamine}>
            Examine Document <ChevronRight size={14} />
         </button>
         <button className="p-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-all" title="Skip for now">
            <SkipForward size={16} />
         </button>
      </div>
    </motion.div>
  );
};

export default ReviewQueue;
