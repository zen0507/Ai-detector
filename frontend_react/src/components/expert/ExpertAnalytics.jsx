import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Clock, FileText, CheckCircle, 
  BarChart3, PieChart as PieChartIcon, 
  Activity, Zap, Info, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, 
  Cell, LineChart, Line, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const API_BASE = 'http://localhost:8000';

const ExpertAnalytics = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/detector/api/expert/stats/`, { credentials: 'include' });
        const d = await res.json();
        if (d.success) setData(d);
      } catch (e) { 
        console.error('Failed to fetch analytics', e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-10 h-10 border-4 border-[var(--expert-teal)]/20 border-t-[var(--expert-teal)] rounded-full animate-spin" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Calculating Forensic Performance...</span>
    </div>
  );

  const stats = data?.stats || {};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20 text-[var(--text-secondary)]"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-2">Performance Analytics</h1>
        <p className="text-[var(--text-muted)] text-sm">Deep-dive into your forensic throughput, accuracy metrics, and decision-making efficiency.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Cumulative Accuracy" value={`${stats.accuracy_rate}%`} icon={Zap} trend={stats.accuracy_trend} status="up" />
        <KPICard label="Avg. Verdict Speed" value={`${data?.avg_time_data?.[0]?.minutes || 10}m`} icon={Clock} trend={stats.speed_trend} status="up" />
        <KPICard label="Throughput Today" value={stats.reviewed_today} icon={Activity} trend={stats.throughput_trend} status="up" />
        <KPICard label="Weekly Progress" value={`${Math.round((stats.reviewed_this_week / 50) * 100)}%`} icon={CheckCircle} trend="Goal: 50" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Productivity Line Chart */}
        <div className="xl:col-span-8 glass-panel p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                 <TrendingUp size={16} className="text-[var(--expert-teal)]" /> Productivity Heatmap (Last 14 Days)
              </h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] text-[var(--expert-teal)] font-bold"><div className="w-2 h-2 rounded-full bg-[var(--expert-teal)]" /> Completed</div>
                 <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold"><div className="w-2 h-2 rounded-full bg-[var(--divider)]" /> Target</div>
              </div>
           </div>
           <div className="h-[350px] w-full min-h-0">
             <ResponsiveContainer width="99%" height="100%" debounce={100}>
               <AreaChart data={data?.daily_reviews || []}>
                 <defs>
                   <linearGradient id="colorProdExpert" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--expert-teal)" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="var(--expert-teal)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 11}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 11}} />
                 <Tooltip 
                   contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--expert-teal)', borderRadius: '16px', fontSize: '12px'}}
                   itemStyle={{color: 'var(--expert-teal)', fontWeight: 'bold'}}
                 />
                 <Area type="monotone" dataKey="count" stroke="var(--expert-teal)" strokeWidth={4} fill="url(#colorProdExpert)" animationDuration={1500} />
                 <Line type="monotone" dataKey={() => 10} stroke="var(--divider)" strokeDasharray="5 5" strokeWidth={1} dot={false} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Verdict Distribution */}
        <div className="xl:col-span-4 glass-panel p-8 flex flex-col">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-8 flex items-center gap-2">
              <PieChartIcon size={16} className="text-[var(--expert-teal)]" /> Verdict Tiers
           </h3>
           <div className="flex-1 flex flex-col justify-center">
              <div className="h-[250px] w-full relative min-h-0">
                <ResponsiveContainer width="99%" height="100%" debounce={100}>
                  <PieChart>
                    <Pie
                      data={data?.verdict_breakdown || []}
                      innerRadius={70}
                      outerRadius={95}
                      labelLine={false}
                      dataKey="value"
                      animationDuration={1500}
                    >
                      {data?.verdict_breakdown?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--divider)', borderRadius: '12px', fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                  <span className="text-3xl font-bold text-[var(--text-primary)]">{Math.round((data?.verdict_breakdown?.[0]?.value / (data?.verdict_breakdown?.[0]?.value + data?.verdict_breakdown?.[1]?.value)) * 100) || 0}%</span>
                  <span className="text-[10px] text-red-500 uppercase tracking-widest font-bold">Fake Match</span>
                </div>
              </div>
              <div className="space-y-3 mt-8">
                 {data?.verdict_breakdown?.map(v => (
                   <div key={v.name} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--divider)]">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: v.color}} />
                         <span className="text-xs font-bold text-[var(--text-primary)]">{v.name}</span>
                      </div>
                      <span className="text-xs font-mono text-[var(--text-muted)]">{v.value} Docs</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Radar: Specialist Balance */}
        <div className="glass-panel p-8">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
                 <Zap size={16} className="text-[var(--expert-teal)]" /> Specialist Skill Matrix
              </h3>
              <Info size={16} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-help transition-colors" />
           </div>
           <div className="h-[350px] w-full min-h-0">
             <ResponsiveContainer width="99%" height="100%" debounce={100}>
               <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data?.skill_matrix || []}>
                 <PolarGrid stroke="var(--divider)" />
                 <PolarAngleAxis dataKey="subject" tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                 <PolarRadiusAxis hide />
                 <Radar name="My Skills" dataKey="A" stroke="var(--expert-teal)" fill="var(--expert-teal)" fillOpacity={0.5} strokeWidth={3} />
                 <Radar name="Expert Avg" dataKey="B" stroke="var(--text-muted)" fill="var(--divider)" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                 <Tooltip contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--expert-teal)', borderRadius: '12px', fontSize: '11px'}} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Speed Analysis Line Chart */}
        <div className="glass-panel p-8">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-8 flex items-center gap-2">
              <Clock size={16} className="text-[var(--expert-teal)]" /> Decision Latency Threshold (Min/Case)
           </h3>
           <div className="h-[350px] w-full min-h-0">
             <ResponsiveContainer width="99%" height="100%" debounce={100}>
               <LineChart data={data?.avg_time_data || []}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                 <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 10}} />
                 <Tooltip 
                   contentStyle={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--expert-teal)', borderRadius: '16px', fontSize: '12px'}}
                   itemStyle={{color: 'var(--expert-teal)', fontWeight: 'bold'}}
                 />
                 <Line type="monotone" dataKey="minutes" stroke="var(--expert-teal)" strokeWidth={5} dot={{fill: 'var(--bg-card)', stroke: 'var(--expert-teal)', strokeWidth: 3, r: 5}} activeDot={{r: 8, strokeWidth: 0}} animationDuration={1500} />
                 <Line type="monotone" dataKey={() => 10} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} dot={false} />
               </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

const KPICard = ({ label, value, icon: Icon, trend, status }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-6 group transition-all hover:bg-[var(--bg-input)]"
    >
       <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-2xl bg-[var(--expert-teal)]/10 text-[var(--expert-teal)] group-hover:scale-110 transition-transform shadow-lg shadow-[var(--expert-teal)]/5">
             <Icon size={20} />
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${status === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-[var(--text-muted)] bg-[var(--divider)]'}`}>
            {trend}
          </span>
       </div>
       <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-1">{label}</p>
       <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
    </motion.div>
  );
}

export default ExpertAnalytics;
