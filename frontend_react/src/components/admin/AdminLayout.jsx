import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, FileText, ClipboardCheck, 
  BarChart3, Activity, ShieldAlert, LogOut, 
  ChevronRight, Menu, X, Bell, Sun, Moon, ArrowLeft, Shield
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const FracturedShield = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2L4 7v9c0 6.6 5.1 11.5 12 13 6.9-1.5 12-6.4 12-13V7L16 2z" 
      stroke="#7F77DD" strokeWidth="1.5" fill="rgba(127,119,221,0.12)" />
    <path d="M19 5L14 13L17 14L12 22" stroke="#7F77DD" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const AdminLayout = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect non-admins
  useEffect(() => {
    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;
    if (!isAdmin) {
      // In a real app we'd use a toast here, assuming a global toast system exists
      navigate('/dashboard'); 
    }
  }, [user, navigate]);

  const navItems = [
    { icon: LayoutDashboard,  label: 'Overview',        path: '/admin' },
    { icon: Users,            label: 'User Management',  path: '/admin/users' },
    { icon: FileText,         label: 'All Documents',    path: '/admin/documents' },
    { icon: ClipboardCheck,   label: 'Forensic Queue',   path: '/admin/forensic-queue' },
    { icon: BarChart3,        label: 'Analytics',        path: '/admin/analytics' },
    { icon: Activity,         label: 'System Health',    path: '/admin/system' },
    { icon: ShieldAlert,      label: 'Audit Log',        path: '/admin/audit-log' },
  ];

  const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Admin Sidebar */}
      <aside className={`flex flex-col h-screen w-[280px] fixed md:sticky top-0 z-40 transition-all duration-300 border-r border-[var(--border-admin)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ backgroundColor: 'var(--bg-admin-sidebar)' }}>
        
        {/* Logo & Admin Badge */}
        <div className="p-6 border-b border-[var(--border-admin)]">
          <div className="flex items-center gap-3 mb-4">
            <FracturedShield size={28} />
            <span className="text-xl font-bold tracking-tight">Falsum</span>
          </div>
          <div className="inline-flex items-center px-2 py-1 rounded bg-[#7F77DD]/10 border border-[#7F77DD]/30">
            <span className="text-[10px] font-bold text-[#7F77DD] uppercase tracking-[0.2em] font-mono">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-[#7F77DD]/15 text-[#7F77DD] border border-[#7F77DD]/30 shadow-[0_0_15px_rgba(127,119,221,0.1)]' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}
              `}
            >
              <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
              <span className="flex-1">{item.label}</span>
              {location.pathname === item.path && <ChevronRight size={14} className="opacity-50" />}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Bottom */}
        <div className="p-4 border-t border-[var(--border-admin)] space-y-1">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[var(--navbar-bg)] backdrop-blur-xl border-b border-[var(--border-admin)] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {navItems.find(n => n.path === location.pathname)?.label || 'System Admin'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             {/* Admin Status Badge */}
             <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Administrator</span>
             </div>

             <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-secondary)] transition-all relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#7F77DD] rounded-full border-2 border-[var(--bg-page)]" />
             </button>

             <button onClick={toggleTheme} className="theme-toggle">
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
             </button>

             <div className="h-8 w-[1px] bg-[var(--border-admin)] mx-1" />

             <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{user?.username}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Master Admin</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#7F77DD]/10 border border-[#7F77DD]/20 flex items-center justify-center">
                  <span className="text-[#7F77DD] font-bold">{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                </div>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
           {/* Background Orbs for distinct admin feel */}
           <div className="orb orb-purple w-96 h-96 -top-20 -left-20 opacity-20" />
           <div className="orb orb-violet w-96 h-96 top-1/2 -right-20 opacity-10" />

           <div className="relative z-10 max-w-[1600px] mx-auto">
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
    </div>
  );
};

export default AdminLayout;
