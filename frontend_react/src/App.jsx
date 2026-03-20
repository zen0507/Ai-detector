import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTheme } from './hooks/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, FileText, Upload, LogOut, Menu, X, 
  ClipboardCheck, User as UserIcon, Database, ChevronRight, ShieldCheck 
} from 'lucide-react'

// pages
import UploadEvidence   from './components/UploadEvidence'
import Dashboard        from './components/Dashboard'
import CaseReports      from './components/CaseReports'
import DashboardHome    from './components/DashboardHome'
import DocumentDetail   from './components/DocumentDetail'
import ExpertQueue      from './components/ExpertQueue'
import Profile          from './components/Profile'
import Login            from './components/Login'
import Register         from './components/Register'
import Landing          from './components/Landing'
import RiskReduction    from './components/RiskReduction'
import AnalysisResult   from './components/AnalysisResult'
import PageHeader       from './components/PageHeader'
import { NotificationProvider } from './context/NotificationSystem'

// Admin Pages
import AdminLayout          from './components/admin/AdminLayout'
import AdminOverview        from './components/admin/AdminOverview'
import UserManagement       from './components/admin/UserManagement'
import UserDetail           from './components/admin/UserDetail'
import AllDocuments         from './components/admin/AllDocuments'
import ForensicQueue        from './components/admin/ForensicQueue'
import Analytics            from './components/admin/Analytics'
import SystemHealth         from './components/admin/SystemHealth'
import AuditLog             from './components/admin/AuditLog'

/* ── Fractured Shield (Sidebar logo) ── */
const FracturedShield = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2L4 7v9c0 6.6 5.1 11.5 12 13 6.9-1.5 12-6.4 12-13V7L16 2z" 
      stroke="#7F77DD" strokeWidth="1.5" fill="rgba(83,74,183,0.12)" />
    <path d="M19 5L14 13L17 14L12 22" stroke="#7F77DD" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

/* ── Page title mapping ── */
const PAGE_TITLES = {
  '/':              'Dashboard',
  '/analytics':     'Live Analytics',
  '/upload':        'Upload Evidence',
  '/reports':       'Audit History',
  '/document/':     'Document Detail',
  '/expert-queue':  'Expert Review Queue',
  '/profile':       'Profile & Settings',
  '/result':        'Analysis Result',
  '/risk-reduction': 'Risk Reduction',
}

const ProtectedAdminRoute = ({ user, children }) => {
  const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
};

import ExpertLayout      from './components/expert/ExpertLayout'
import ExpertHome        from './components/expert/ExpertHome'
import ReviewQueue       from './components/expert/ReviewQueue'
import DocumentExaminationRoom from './components/expert/DocumentExaminationRoom'
import CompletedReviews  from './components/expert/CompletedReviews'
import ExpertAnalytics   from './components/expert/ExpertAnalytics'
import ExpertProfile     from './components/expert/ExpertProfile'


const ProtectedExpertRoute = ({ user, children }) => {
  const isExpert = user?.is_forensic_expert || user?.role === 'forensic_expert' || user?.is_staff || (user?.username && user.username.toLowerCase().includes('expert'));
  if (!isExpert) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [authStatus, setAuthStatus] = useState('landing')
  const [viewData, setViewData] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Session check on mount
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:8000/detector/api/me/', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setUser(data);
          setAuthStatus('app');
          // If already at '/', check if they should be at '/expert'
          if (location.pathname === '/' || location.pathname === '') {
             if (data.role === 'forensic_expert' || data.is_forensic_expert) {
                navigate('/expert');
             } else if (data.is_staff || data.is_superuser) {
                navigate('/admin');
             }
          }
        }
      } catch (e) { console.error('Session check failed', e); }
    };
    checkSession();
  }, []);

  // Session timeout implementation for admins (30 min logout, 25 min warning)
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.is_staff) {
      const interval = setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        if (inactiveTime > 30 * 60 * 1000) { // 30 mins
          handleLogout();
        } else if (inactiveTime > 25 * 60 * 1000) { // 25 mins
          setShowTimeoutWarning(true);
        }
      }, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [lastActivity, user]);

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData)
    setAuthStatus('app')
    const isAdmin = userData.role === 'admin' || userData.is_staff || userData.is_superuser;
    const isExpert = userData.is_forensic_expert || userData.role === 'forensic_expert' || (userData.username && userData.username.toLowerCase().includes('expert'));
    
    if (isExpert && !isAdmin) {
      navigate('/expert')
    } else if (isAdmin) {
      navigate('/admin')
    } else {
      navigate('/')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setAuthStatus('landing')
    navigate('/')
  }

  /* ── Pre-auth screens ── */
  if (authStatus === 'landing') {
    return (
      <NotificationProvider>
        <Landing 
          onGoToLogin={() => setAuthStatus('login')} 
          onGoToRegister={() => setAuthStatus('register')} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
      </NotificationProvider>
    )
  }

  if (authStatus === 'login') {
    return (
      <NotificationProvider>
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setAuthStatus('register')} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
      </NotificationProvider>
    )
  }

  if (authStatus === 'register') {
    return (
      <NotificationProvider>
        <Register 
          onRegister={(userData) => {
            setUser(userData)
            setAuthStatus('app')
            navigate('/')
          }}
          onSwitchToLogin={() => setAuthStatus('login')}
          theme={theme}
          toggleTheme={toggleTheme} 
        />
      </NotificationProvider>
    )
  }

  /* ── App shell ── */
  const isExpert = user?.is_forensic_expert || user?.role === 'forensic_expert' || user?.is_staff || (user?.username && user.username.toLowerCase().includes('expert'))
  const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;

  const getPageTitle = () => {
    const path = '/' + location.pathname.split('/')[1];
    return PAGE_TITLES[path] || 'Dashboard';
  }

  // Sidebar nav items — role-based
  const navItems = isExpert ? [
    { icon: LayoutDashboard,  label: 'Dashboard',       path: '/' },
    { icon: LayoutDashboard,  label: 'Live Analytics',  path: '/analytics' },
    { icon: Upload,           label: 'Upload Evidence', path: '/upload' },
    { icon: FileText,         label: 'Audit History',   path: '/reports' },
    { icon: ClipboardCheck,   label: 'Expert Review Queue', path: '/expert-queue', highlight: true },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard',       path: '/' },
    { icon: Upload,          label: 'Upload Evidence', path: '/upload' },
    { icon: FileText,        label: 'Audit History',   path: '/reports' },
  ];

  if (location.pathname.startsWith('/admin')) {
    return (
      <NotificationProvider>
        <Routes>
          <Route path="/admin" element={<AdminLayout user={user} onLogout={handleLogout} />}>
             <Route index element={<AdminOverview />} />
             <Route path="users" element={<UserManagement />} />
             <Route path="users/:id" element={<UserDetail />} />
             <Route path="documents" element={<AllDocuments />} />
             <Route path="documents/:id" element={<DocumentDetailWrapper onBack={() => navigate('/admin/documents')} user={user} />} />
             <Route path="forensic-queue" element={<ForensicQueue />} />
             <Route path="analytics" element={<Analytics />} />
             <Route path="system" element={<SystemHealth />} />
             <Route path="audit-log" element={<AuditLog />} />
          </Route>
        </Routes>

        {/* Inactivity Warning Modal */}
        <AnimatePresence>
          {showTimeoutWarning && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 max-w-sm w-full text-center border-red-500/30">
                <ShieldCheck className="mx-auto mb-4 text-red-500" size={48} />
                <h3 className="text-xl font-bold mb-2">Session Expiring</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">Your admin session will expire in 5 minutes due to inactivity. Security policy requires re-authentication.</p>
                <div className="flex gap-4">
                  <button onClick={handleLogout} className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-xs font-bold text-[var(--text-muted)]">LOG OUT</button>
                  <button onClick={resetActivity} className="flex-1 px-4 py-2 rounded-lg bg-[#7F77DD] text-white text-xs font-bold shadow-lg shadow-[#7F77DD]/20">STAY LOGGED IN</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </NotificationProvider>
    );
  }

  // --- EXPERT ROUTES ---
  if (location.pathname.startsWith('/expert')) {
    return (
      <NotificationProvider>
        <Routes>
          <Route path="/expert" element={<ExpertLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<ExpertHome user={user} />} />
            <Route path="queue" element={<ReviewQueue user={user}  onViewDocument={(id) => navigate('/expert/queue/'+id)}/>} />
            <Route path="queue/:id" element={<DocumentExaminationRoomWrapper user={user} onBack={() => navigate('/expert/queue')} />} />
            <Route path="completed" element={<CompletedReviews user={user} />} />
            <Route path="analytics" element={<ExpertAnalytics user={user} />} />
            <Route path="profile" element={<ExpertProfile user={user} onLogout={handleLogout} />} />
          </Route>
        </Routes>
      </NotificationProvider>
    )
  }

  return (
    <NotificationProvider>
      <div onMouseMove={resetActivity} onKeyDown={resetActivity} className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans selection:bg-[rgba(83,74,183,0.3)] flex h-screen overflow-hidden transition-colors duration-300">
        <aside className={`fixed md:sticky top-0 h-screen w-64 border-r border-[rgba(83,74,183,0.15)] z-40 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          bg-[var(--bg-panel-left)] backdrop-blur-xl flex flex-col`}>

          <div className="flex items-center gap-3 px-5 py-5 cursor-pointer border-b border-[rgba(83,74,183,0.1)]" onClick={() => navigate('/')}>
            <FracturedShield size={26} />
            <span className="font-semibold text-[var(--text-primary)] text-lg tracking-tight">Falsum</span>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(({ icon: Icon, label, path, highlight }) => (
              <NavItem 
                key={path + label} 
                icon={Icon} 
                label={label} 
                active={location.pathname === path} 
                highlight={highlight} 
                onClick={() => navigate(path)} 
              />
            ))}
            {isAdmin && (
              <NavItem icon={Database} label="Admin Console" onClick={() => navigate('/admin')} highlight />
            )}
          </nav>

          <div className="p-3 border-t border-[rgba(83,74,183,0.1)] space-y-1">
            <NavItem icon={UserIcon} label="Profile & Settings" active={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
            <NavItem icon={LogOut} label="Sign Out" danger onClick={handleLogout} />
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <PageHeader title={getPageTitle()} user={user} theme={theme} toggleTheme={toggleTheme} unreadCount={0} />

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                transition={{ duration: 0.22 }}
                className="w-full h-full p-6 md:p-8 max-w-7xl mx-auto"
              >
                <Routes>
                  <Route path="/" element={<DashboardHome user={user} onNavigate={(view) => navigate(view === 'home' ? '/' : '/'+view)} />} />
                  <Route path="/analytics" element={<Dashboard user={user} />} />
                  <Route path="/upload" element={<UploadEvidence onViewChange={(v,d) => navigate('/result', {state: d})} />} />
                  <Route path="/reports" element={<CaseReports onViewChange={(v,id) => navigate('/document/'+id)} />} />
                  <Route path="/document/:id" element={<DocumentDetailWrapper user={user} onBack={() => navigate('/reports')} />} />
                  <Route path="/result" element={<AnalysisResult result={viewData} onViewChange={(v) => navigate('/')} />} />
                  <Route path="/expert-queue" element={<ExpertQueue user={user} onViewDocument={(id) => navigate('/document/'+id)} />} />
                  <Route path="/risk-reduction" element={<RiskReduction recommendations={viewData} />} />
                  <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}

const DocumentDetailWrapper = ({ user, onBack }) => {
  const { id } = useParams();
  const isExpert = user?.is_forensic_expert || user?.role === 'forensic_expert' || user?.is_staff || (user?.username && user.username.toLowerCase().includes('expert'))
  return <DocumentDetail documentId={id} user={user} onBack={onBack} isExpertMode={!!isExpert} />;
};

const DocumentExaminationRoomWrapper = ({ user, onBack }) => {
  const { id } = useParams();
  return <DocumentDetail documentId={id} user={user} onBack={onBack} isExpertMode={true} />;
};

const NavItem = ({ icon: Icon, label, active, onClick, danger, highlight }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
      ${active ? 'bg-[rgba(83,74,183,0.18)] text-white border border-[rgba(83,74,183,0.35)]' : 
        danger ? 'text-slate-500 hover:text-red-400 hover:bg-[rgba(163,45,45,0.08)]' : 
        highlight ? 'text-emerald-500 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20' : 
        'text-slate-500 hover:text-white hover:bg-[rgba(83,74,183,0.08)]'}`}>
    <Icon size={17} />
    <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
    {active && <ChevronRight size={14} className="text-[#7F77DD]" />}
  </button>
)

export default App
