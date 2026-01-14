import { useState, useEffect } from 'react'
import { Sidebar, SidebarItem, SidebarItems, SidebarItemGroup } from "flowbite-react"
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, LayoutDashboard, FileText, Upload, LogOut, Menu, X, ShieldCheck, ClipboardCheck, Moon, Sun, User as UserIcon, Database } from 'lucide-react'
import UploadEvidence from './components/UploadEvidence'
import Dashboard from './components/Dashboard'
import CaseReports from './components/CaseReports'
import Login from './components/Login'
import Register from './components/Register'
import RiskReduction from './components/RiskReduction'
import AnalysisResult from './components/AnalysisResult'
import ExpertDashboard from './components/ExpertDashboard'
import Profile from './components/Profile'
import { NotificationProvider } from './context/NotificationSystem'

function App() {
  const [authStatus, setAuthStatus] = useState('login')
  const [currentView, setCurrentView] = useState('menu')
  const [viewData, setViewData] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Theme State - Default to Dark
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') !== 'light';
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const handleViewChange = (view, data = null) => {
    setCurrentView(view)
    if (data) setViewData(data)
  }

  const handleLogin = (userData) => {
    setUser(userData)
    setAuthStatus('authenticated')
    if (userData.is_forensic_expert) {
      setCurrentView('expert_review')
    } else {
      setCurrentView('menu')
    }
  }

  // Render logic based on auth status
  const getPageContent = () => {
    if (authStatus === 'login') {
      return (
        <Login
          key="login"
          onLogin={handleLogin}
          onSwitchToRegister={() => setAuthStatus('register')}
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
        />
      );
    }
    if (authStatus === 'register') {
      return (
        <Register
          key="register"
          onRegister={(userData) => {
            setUser(userData);
            setAuthStatus('authenticated');
          }}
          onSwitchToLogin={() => setAuthStatus('login')}
          darkMode={darkMode}
          toggleTheme={() => setDarkMode(!darkMode)}
        />
      );
    }

    const renderContent = () => {
      switch (currentView) {
        case 'menu':
          return <MenuGrid setCurrentView={setCurrentView} isStaff={user?.is_staff || user?.is_superuser} user={user} />;
        case 'dashboard':
          return <Dashboard />;
        case 'upload':
          return <UploadEvidence onViewChange={handleViewChange} />;
        case 'report': // Fallback for typo
        case 'reports':
          return <CaseReports onViewChange={(view, data) => handleViewChange(view, data)} />;
        case 'result':
          return <AnalysisResult result={viewData} onViewChange={handleViewChange} />;
        case 'expert_review':
          return <ExpertDashboard />;
        case 'risk_reduction':
          return <RiskReduction recommendations={viewData} />;
        case 'profile':
          return <Profile user={user} onLogout={() => setAuthStatus('login')} />;
        case 'verification_requests':
          // Fallback for verification requests if needed, but ExpertDashboard should handle it?
          // Actually sidebar has 'Expert Requests' pointing to 'verification_requests'.
          // Wait, ExpertDashboard IS the review queue.
          // Let's check ExpertDashboard again. It fetches "pending reviews".
          // Use ExpertDashboard for verification_requests if user is expert.
          // But what if regular user clicks 'Expert Requests'? That's hidden for regular user in sidebar.
          return <ExpertDashboard />;
        default:
          return <MenuGrid setCurrentView={setCurrentView} isStaff={user?.is_staff || user?.is_superuser} user={user} />;
      }
    }

    return (
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Toggle */}
        <div className="md:hidden fixed top-4 right-4 z-50">
          <button onClick={toggleSidebar} className="p-2 glass-panel text-white">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          aria-label="Sidebar with logo branding"
          className={`fixed md:sticky top-0 h-screen w-20 md:w-64 border-r border-slate-200 dark:border-white/5 border-y-0 border-l-0 rounded-none z-40 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} bg-white/80 dark:bg-black/20 backdrop-blur-xl`}
        >
          <div className="flex items-center gap-3 px-2 mb-12 mt-4 cursor-pointer" onClick={() => setCurrentView('menu')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-neon-violet flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Shield className="text-white" size={24} />
            </div>
            <div className="hidden md:block">
              <h1 className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">Sentry<span className="text-indigo-600 dark:text-neon-violet">AI</span></h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Forensics Unit</p>
            </div>
          </div>

          <SidebarItems>
            <SidebarItemGroup>
              <SidebarItem
                icon={Menu}
                active={currentView === 'menu'}
                onClick={() => setCurrentView('menu')}
                className={currentView === 'menu' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors'}
              >
                Main Menu
              </SidebarItem>

              {!user?.is_forensic_expert && (
                <>
                  <SidebarItem
                    icon={LayoutDashboard}
                    active={currentView === 'dashboard'}
                    onClick={() => setCurrentView('dashboard')}
                    className={currentView === 'dashboard' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors'}
                  >
                    Dashboard
                  </SidebarItem>
                  <SidebarItem
                    icon={Upload}
                    active={currentView === 'upload'}
                    onClick={() => setCurrentView('upload')}
                    className={currentView === 'upload' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors'}
                  >
                    Upload Evidence
                  </SidebarItem>
                  <SidebarItem
                    icon={FileText}
                    active={currentView === 'reports'}
                    onClick={() => setCurrentView('reports')}
                    className={currentView === 'reports' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors'}
                  >
                    Audit History
                  </SidebarItem>
                </>
              )}
              {user?.is_forensic_expert && (
                <SidebarItem
                  icon={ClipboardCheck}
                  active={currentView === 'expert_review'}
                  onClick={() => setCurrentView('expert_review')}
                  className={currentView === 'expert_review' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors'}
                >
                  Expert Queue
                </SidebarItem>
              )}
              {user?.is_staff && (
                <SidebarItem
                  icon={Database}
                  onClick={() => window.open('http://127.0.0.1:8000/admin/', '_blank')}
                  className="text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Admin Panel
                </SidebarItem>
              )}
            </SidebarItemGroup>

            <SidebarItemGroup className="border-t border-white/10 pt-4 mt-4">
              <SidebarItem
                icon={UserIcon}
                active={currentView === 'profile'}
                onClick={() => setCurrentView('profile')}
                className={currentView === 'profile' ? 'bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-cyan-400 font-medium' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors'}
              >
                Profile & Settings
              </SidebarItem>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex w-full items-center p-2 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white group transition-colors mb-2"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="ml-3 text-sm font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <SidebarItem
                icon={LogOut}
                onClick={() => setAuthStatus('login')}
                className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                Disconnect
              </SidebarItem>
            </SidebarItemGroup>
          </SidebarItems>
        </Sidebar>

        {/* Main Content Area */}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto h-full relative ${currentView === 'result' ? 'p-0 md:p-0' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.3 }}
              className={`w-full h-full ${currentView === 'result' ? '' : 'max-w-7xl mx-auto'}`}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  };

  return (
    <NotificationProvider>
      <div className="min-h-screen text-slate-200 font-sans selection:bg-neon-violet/30 relative">
        {/* --- Global Aurora Background --- */}
        <div className="aurora-bg">
          <div className="aurora-light light-1"></div>
          <div className="aurora-light light-2"></div>
          <div className="aurora-light light-3"></div>
        </div>

        {/* --- Main Content Switcher --- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={authStatus}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {getPageContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </NotificationProvider>
  )
}

const MenuGrid = ({ setCurrentView, isStaff, user }) => (
  <div className="h-full flex flex-col justify-center items-center">
    <div className="text-center mb-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 mb-4 tracking-tight"
      >
        Welcome back, Officer.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto"
      >
        Select a module to begin your forensic analysis. System status is nominal.
      </motion.p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      {!user?.is_forensic_expert && (
        <>
          <MenuCard
            title="New Analysis"
            desc="Upload documents for fabrication detection"
            icon={<Upload size={32} />}
            color="from-indigo-500 to-violet-500"
            onClick={() => setCurrentView('upload')}
            delay={0.1}
          />
          <MenuCard
            title="Live Dashboard"
            desc="Real-time monitoring and analytics"
            icon={<LayoutDashboard size={32} />}
            color="from-cyan-500 to-blue-500"
            onClick={() => setCurrentView('dashboard')}
            delay={0.2}
          />
          <MenuCard
            title="Audit History"
            desc="Review reports and expert statuses"
            icon={<FileText size={32} />}
            color="from-fuchsia-500 to-pink-500"
            onClick={() => setCurrentView('reports')}
            delay={0.3}
          />
        </>
      )}

      {(user?.is_forensic_expert || isStaff) && (
        <MenuCard
          title="Forensic Queue"
          desc="Review pending verification requests"
          icon={<ShieldCheck size={32} />}
          color="from-emerald-500 to-green-500"
          onClick={() => setCurrentView('expert_review')}
          delay={0.1}
        />
      )}

      {isStaff && (
        <MenuCard
          title="Admin Console"
          desc="Manage users and system configuration"
          icon={<Database size={32} />}
          color="from-slate-500 to-slate-700"
          onClick={() => window.open('http://127.0.0.1:8000/admin/', '_blank')}
          delay={0.2}
        />
      )}
    </div>
  </div>
)

const MenuCard = ({ title, desc, icon, color, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="glass-panel p-8 text-left group relative overflow-hidden h-64 flex flex-col justify-between"
  >
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} p-0.5 mb-4 shadow-lg shrink-0`}>
      <div className="w-full h-full bg-white/90 dark:bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-800 dark:text-white group-hover:bg-transparent group-hover:text-white transition-all duration-300">
        {icon}
      </div>
    </div>

    <div className="relative z-10">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-100/90 leading-relaxed transition-colors">{desc}</p>
    </div>

    {/* Hover Gradient Effect */}
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-90 dark:group-hover:opacity-80 transition-opacity duration-500 pointer-events-none`}></div>
  </motion.button>
)

export default App
