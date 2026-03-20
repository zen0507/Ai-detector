import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ClipboardCheck, CheckSquare, 
  BarChart3, User, LogOut, Bell, Sun, Moon, 
  Menu, X, ChevronRight, ShieldCheck, Search
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ExpertLayout = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending count for the badge
    const fetchCount = async () => {
      try {
        const res = await fetch('http://localhost:8000/detector/api/expert-queue/', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setPendingCount(data.queue.length);
        }
      } catch (e) { console.error('Count fetch failed', e); }
    };
    fetchCount();
  }, [location.pathname]);

  const navItems = [
    { icon: LayoutDashboard,  label: 'Home',              path: '/expert' },
    { icon: ClipboardCheck,   label: 'Review Queue',      path: '/expert/queue', badge: pendingCount },
    { icon: CheckSquare,      label: 'Completed Reviews', path: '/expert/completed' },
    { icon: BarChart3,        label: 'My Analytics',      path: '/expert/analytics' },
    { icon: User,             label: 'Profile & Settings',path: '/expert/profile' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`flex flex-col h-screen w-[260px] fixed md:sticky top-0 z-40 transition-all duration-300 border-r border-[var(--border-expert)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ backgroundColor: 'var(--bg-expert-sidebar)' }}>
        
        {/* Logo & Role Badge */}
        <div className="p-6 border-b border-[var(--border-expert)]">
          <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => navigate('/expert')}>
            <ShieldCheck size={28} className="text-[var(--expert-teal)]" />
            <span className="text-xl font-bold tracking-tight">Falsum</span>
          </div>
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--expert-teal)]/10 border border-[var(--expert-teal)]/30">
            <span className="text-[9px] font-bold text-[var(--expert-teal)] uppercase tracking-wider font-mono">Forensic Expert</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/expert'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                ${isActive 
                  ? 'bg-[var(--expert-teal)]/15 text-[var(--expert-teal)] border border-[var(--expert-teal)]/30' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}
              `}
            >
              <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md bg-[var(--expert-teal)] text-white text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-[var(--border-expert)] space-y-1">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--border-expert)] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ?  <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden lg:flex items-center relative max-w-xs group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="text" 
                placeholder="Search audit files..." 
                className="pl-9 pr-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs w-64 focus:border-[var(--expert-teal)]/50 focus:bg-white/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowNotifications(!showNotifications)}
               className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-all relative"
             >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--expert-teal)] rounded-full border-2 border-[var(--bg-page)]" />
             </button>

             <button onClick={toggleTheme} className="theme-toggle">
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
             </button>

             <div className="h-8 w-[1px] bg-[var(--border-expert)] mx-1" />

             <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col items-end hidden sm:flex">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{user?.full_name || user?.username}</span>
                    <span className="px-1.5 py-0.5 rounded border border-[var(--expert-teal)]/30 text-[9px] font-bold text-[var(--expert-teal)] uppercase tracking-tighter">Forensic Expert</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--expert-teal)]/10 border border-[var(--expert-teal)]/20 flex items-center justify-center">
                  <span className="text-[var(--expert-teal)] font-bold">{user?.username?.[0]?.toUpperCase() || 'E'}</span>
                </div>
             </div>
          </div>
        </header>

        {/* Global Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
           {/* Teal Glow Orbs restricted to Expert Context */}
           <div className="orb orb-expert w-96 h-96 -top-20 -left-20 opacity-20 pointer-events-none" 
                style={{ background: 'radial-gradient(circle, var(--expert-teal-glow) 0%, transparent 70%)' }} />
           
           <div className="relative z-10 max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
           </div>
        </main>
      </div>

      {/* Notification Slide Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--bg-panel-right)] border-l border-[var(--border-expert)] z-[101] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[var(--expert-teal)]/30 transition-all cursor-pointer">
                    <p className="text-xs font-bold text-[var(--expert-teal)] mb-1 uppercase tracking-widest">New Assignment</p>
                    <p className="text-sm font-medium mb-2">Invoice #INV-928 requires review</p>
                    <p className="text-[10px] text-slate-500">24 minutes ago</p>
                 </div>
                 <div className="text-center py-12 text-slate-500 text-xs italic">
                    All notifications captured
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpertLayout;
