import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertCircle, FileText, CheckCircle, 
  Clock, TrendingUp, ArrowRight, User, 
  Calendar, AlertTriangle, ChevronRight, History
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, 
  Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

const API_BASE = 'http://localhost:8000';

const ExpertHome = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/detector/api/expert/stats/`, { credentials: 'include' });
        const d = await res.json();
        if (d.success) setData(d);
      } catch (e) {
        console.error('Failed to fetch expert stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-10 h-10 border-4 border-[var(--expert-teal)]/20 border-t-[var(--expert-teal)] rounded-full animate-spin" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] animate-pulse">Syncing Forensic Data...</span>
    </div>
  );

  const stats = data?.stats || {};
  const urgentCount = data?.urgent_count || 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20 text-[var(--text-secondary)]"
    >
      {/* Welcome & System Status */}
      <div className="md:flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Welcome back, {user?.full_name || user?.username}</h1>
            <span className="px-3 py-1 rounded-full bg-[var(--expert-teal)]/10 border border-[var(--expert-teal)]/30 text-[10px] font-bold text-[var(--expert-teal)] uppercase tracking-widest">Forensic Expert</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Financial Fraud Examination Platform · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {urgentCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden shadow-lg shadow-amber-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-amber-600 dark:text-amber-200">Urgent Attention Required</h3>
                <p className="text-sm text-amber-700/80 dark:text-amber-500/80">You have {urgentCount} documents awaiting review for more than 48 hours. These require immediate legal attention.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href='/expert/queue'}
              className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              Examine Queue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Pending Review" 
          value={stats.pending_count || 0} 
          subValue={`${stats.unassigned_count || 0} unassigned docs`}
          icon={FileText} color="blue" 
          delay={0}
        />
        <StatCard 
          label="Reviewed Today" 
          value={stats.reviewed_today || 0} 
          subValue="Documents examined today"
          icon={CheckCircle} color="teal" 
          delay={0.1}
        />
        <StatCard 
          label="This Week Total" 
          value={stats.reviewed_this_week || 0} 
          trend={stats.throughput_trend}
          subValue="Cumulative weekly reviews"
          icon={Calendar} color="violet" 
          delay={0.2}
        />
        <StatCard 
          label="Accuracy Rate" 
          value={`${stats.accuracy_rate || 0}%`} 
          trend={stats.accuracy_trend}
          subValue="Match rate with AI verdicts"
          icon={TrendingUp} color="emerald" 
          delay={0.3}
        />
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Review Volume */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col h-[400px]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
            <TrendingUp size={14} className="text-[var(--expert-teal)]" /> Daily Review Volume
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="99%" height="100%" debounce={100}>
              <BarChart data={data?.daily_reviews || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 11}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'var(--divider)', opacity: 0.5}}
                  contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--expert-teal)', borderRadius: '12px', fontSize: '11px'}}
                  itemStyle={{color: 'var(--expert-teal)', fontWeight: 'bold'}}
                />
                <Bar dataKey="count" fill="var(--expert-teal)" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Verdict Breakdown */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col h-[400px]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
            <Shield size={14} className="text-[var(--expert-teal)]" /> Verdict Breakdown
          </h3>
          <div className="flex-1 relative w-full min-h-0">
            <ResponsiveContainer width="99%" height="100%" debounce={100}>
              <PieChart>
                <Pie
                  data={data?.verdict_breakdown || []}
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {data?.verdict_breakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '12px', fontSize: '11px'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
              <span className="text-3xl font-bold text-[var(--text-primary)]">{stats.reviewed_this_week || 0}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">Total Reviewed</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
             {data?.verdict_breakdown?.map(v => (
               <div key={v.name} className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: v.color}} />
                 <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">{v.name}</span>
               </div>
             ))}
          </div>
        </motion.div>

        {/* Efficiency Trend */}
        <motion.div variants={itemVariants} className="glass-panel p-6 flex flex-col h-[400px]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
            <Clock size={14} className="text-[var(--expert-teal)]" /> Efficiency Cycle (Min/Review)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="99%" height="100%" debounce={100}>
              <AreaChart data={data?.avg_time_data || []}>
                <defs>
                   <linearGradient id="colorTealExpert" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--expert-teal)" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="var(--expert-teal)" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                <YAxis unit="m" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--expert-teal)', borderRadius: '12px', fontSize: '11px'}}
                  itemStyle={{color: 'var(--expert-teal)', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="minutes" stroke="var(--expert-teal)" fillOpacity={1} fill="url(#colorTealExpert)" strokeWidth={3} />
                <Line type="monotone" dataKey={() => 10} stroke="var(--text-muted)" strokeDasharray="5 5" strokeWidth={1} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Task Queue & Session History */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Priority Queue Preview */}
        <motion.div variants={itemVariants} className="glass-panel overflow-hidden">
           <div className="p-6 pb-2 flex items-center justify-between border-b border-[var(--divider)] mb-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Priority Queue</h3>
              <button 
                onClick={() => window.location.href='/expert/queue'}
                className="text-[10px] uppercase font-bold text-[var(--expert-teal)] hover:underline flex items-center gap-1.5"
              >
                View Full Queue <ArrowRight size={12} />
              </button>
           </div>
           <div className="divide-y divide-[var(--divider)]">
              {data?.priority_queue?.length > 0 ? (
                data.priority_queue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 hover:bg-[var(--expert-teal)]/5 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[var(--bg-input)] border border-[var(--divider)] flex items-center justify-center text-[var(--text-muted)] group-hover:border-[var(--expert-teal)] group-hover:text-[var(--expert-teal)] transition-all">
                        <FileText size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5 truncate max-w-[200px]">{item.name}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 uppercase tracking-tighter">{item.type}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">Wait: {item.waiting}d · AI Peak: <span className="text-red-400 font-bold">{item.confidence}%</span></span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href=`/expert/document/${item.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--expert-teal)]/10 text-[var(--expert-teal)] text-[11px] font-bold border border-[var(--expert-teal)]/20 hover:bg-[var(--expert-teal)] hover:text-white transition-all shadow-lg shadow-transparent hover:shadow-[var(--expert-teal)]/20"
                    >
                      Examine <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-[var(--text-muted)] italic text-sm">No pending priority documents.</div>
              )}
           </div>
        </motion.div>

        {/* Recently Finished */}
        <motion.div variants={itemVariants} className="glass-panel overflow-hidden">
           <div className="p-6 pb-2 flex items-center justify-between border-b border-[var(--divider)] mb-2">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History size={18} className="text-[var(--text-muted)]" /> Recent Completions
              </h3>
           </div>
           <div className="divide-y divide-[var(--divider)]">
              {data?.recent_completions?.length > 0 ? (
                data.recent_completions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 hover:bg-[var(--bg-input)] transition-all border-b border-[var(--divider)] last:border-0">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.verdict === 'FAKE' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                        <Shield size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--text-primary)] mb-0.5 truncate max-w-[200px]">{item.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                          Verdict: <span className={`font-bold ${item.verdict === 'FAKE' ? 'text-red-500' : 'text-emerald-500'}`}>{item.verdict} CONFIRMED</span> · {item.date} {item.completed}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--divider)] bg-[var(--bg-input)] text-[var(--text-muted)] text-[10px] font-mono font-bold">
                      <Clock size={12} /> {item.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-[var(--text-muted)] italic text-sm">No completed reviews in this session.</div>
              )}
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ label, value, subValue, icon: Icon, color, delay, trend }) => {
  const colorMap = {
    teal:    'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    blue:    'text-blue-500    bg-blue-500/10    border-blue-500/20    shadow-blue-500/5',
    violet:  'text-violet-500  bg-violet-500/10  border-violet-500/20  shadow-violet-500/5',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    amber:   'text-amber-500   bg-amber-500/10   border-amber-500/20   shadow-amber-500/5',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="glass-panel p-6 transition-all hover:border-[var(--expert-teal)]/30 group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${colorMap[color] || colorMap.blue}`}>
           <Icon size={24} />
        </div>
        {trend && (
           <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
             {trend}
           </span>
        )}
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{label}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--expert-teal)] animate-pulse" />
      </div>
      <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1 opacity-80">{subValue}</p>
    </motion.div>
  );
};

export default ExpertHome;
