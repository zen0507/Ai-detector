import { Bell, Sun, Moon, Shield, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

const roleLabels = {
  forensic_expert: { label: 'Forensic Expert', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  admin: { label: 'Admin', color: 'bg-purple-500/15 border-purple-500/30 text-purple-400' },
  auditor: { label: 'Auditor', color: 'bg-[#534AB7]/15 border-[#534AB7]/30 text-[#7F77DD]' },
};

const PageHeader = ({ title, user, theme, toggleTheme, unreadCount = 0 }) => {
  const role = user?.is_forensic_expert ? 'forensic_expert' : user?.is_staff ? 'admin' : 'auditor';
  const roleInfo = roleLabels[role] || roleLabels.auditor;

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-[rgba(83,74,183,0.12)] bg-[var(--navbar-bg)] backdrop-blur-xl transition-colors duration-300"
    >
      {/* Left: Page Title */}
      <h1 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">{title}</h1>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          id="header-notifications-btn"
          className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#534AB7]/40 transition-all"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-[#534AB7] text-white rounded-full ring-2 ring-[var(--bg-page)] transition-all">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <div className="w-7 h-7 rounded-full bg-[#534AB7]/30 border border-[#534AB7]/40 flex items-center justify-center">
            {role === 'forensic_expert' ? (
              <Shield size={14} className="text-emerald-400" />
            ) : (
              <UserIcon size={14} className="text-[#7F77DD]" />
            )}
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-xs font-semibold text-[var(--text-primary)]">{user?.username || 'User'}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 border ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          id="header-theme-toggle"
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </motion.header>
  );
};

export default PageHeader;
