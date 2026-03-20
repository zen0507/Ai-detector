import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Lock, Bell, LogOut, 
  MapPin, Mail, Calendar, CheckCircle, 
  Settings, Key, Smartphone, FileText,
  ShieldCheck, ShieldAlert, Award,
  ChevronRight, Save, Trash2, Info
} from 'lucide-react';

const ExpertProfile = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    new_assignment: true,
    urgent_reminder: true,
    weekly_digest: false,
    security_alerts: true,
  });

  const toggleNotification = (id) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-500 text-sm">Manage your forensic identity, security credentials, and platform preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-1">
           <ProfileNavItem icon={User} label="Forensic Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
           <ProfileNavItem icon={Lock} label="Security & Access" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
           <ProfileNavItem icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
           <ProfileNavItem icon={Settings} label="System Preferences" active={activeTab === 'system'} onClick={() => setActiveTab('system')} />
           <div className="pt-8 px-4">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
              >
                <LogOut size={18} /> Sign Out
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
           <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Identity Card */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--expert-teal)]/5 blur-3xl -mr-20 -mt-20 group-hover:bg-[var(--expert-teal)]/10 transition-colors" />
                     <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="relative">
                           <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-[var(--expert-teal)] to-black flex items-center justify-center text-4xl font-bold border-4 border-white/5 overflow-hidden">
                              {user?.username?.charAt(0).toUpperCase()}
                           </div>
                           <div className="absolute -bottom-2 -right-2 p-2 bg-[var(--expert-teal)] rounded-2xl border-4 border-[#0a0a18] text-white">
                              <ShieldCheck size={20} />
                           </div>
                        </div>
                        <div className="text-center md:text-left">
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                             <h2 className="text-3xl font-bold">{user?.full_name || user?.username}</h2>
                             <span className="px-2.5 py-0.5 rounded-lg bg-[var(--expert-teal)]/10 border border-[var(--expert-teal)]/30 text-[10px] font-bold text-[var(--expert-teal)] uppercase tracking-widest">Official Forensic Expert</span>
                           </div>
                           <p className="text-slate-500 text-sm mb-6 max-w-md">Senior Forensic Examiner specializing in financial document verification and adversarial AI detection.</p>
                           <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">
                             <div className="flex items-center gap-2"><Mail size={14} className="text-[var(--expert-teal)]" /> {user?.email || 'expert@falsum.ai'}</div>
                             <div className="flex items-center gap-2"><MapPin size={14} className="text-[var(--expert-teal)]" /> Internal Station 04</div>
                             <div className="flex items-center gap-2"><Calendar size={14} className="text-[var(--expert-teal)]" /> Joined Q2 2024</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Accreditations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Accreditations & Badges</h3>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                              <div className="flex items-center gap-3">
                                 <Award size={20} className="text-amber-500" />
                                 <span className="text-xs font-bold">Fast-Track Examiner</span>
                              </div>
                              <CheckCircle size={14} className="text-emerald-500" />
                           </div>
                           <div className="flex items-center justify-between p-3 rounded-xl bg-white/3">
                              <div className="flex items-center gap-3">
                                 <Shield size={20} className="text-sky-500" />
                                 <span className="text-xs font-bold">Verified Professional</span>
                              </div>
                              <CheckCircle size={14} className="text-emerald-500" />
                           </div>
                        </div>
                     </div>
                     <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Forensic Specialty</h3>
                        <div className="flex flex-wrap gap-2">
                           {['Invoice Verification', 'Bank Statement Audit', 'EXIF Metadata Analysis', 'ELA Forensic', 'Optical Character Recognition'].map(s => (
                             <span key={s} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold">{s}</span>
                           ))}
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                   className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-8"
                >
                   <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 rounded-2xl bg-[var(--expert-teal)]/10 text-[var(--expert-teal)]">
                         <Bell size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-bold">Notification Protocols</h3>
                         <p className="text-xs text-slate-500">Configure how you receive critical case alerts.</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <NotificationToggle 
                        id="new_assignment" label="New Case Assignments" 
                        description="Get notified immediately when a new document is pended for your review." 
                        active={notifications.new_assignment} toggle={() => toggleNotification('new_assignment')} 
                      />
                      <NotificationToggle 
                        id="urgent_reminder" label="Urgent SLA Reminders" 
                        description="Alerts for documents approaching the 48-hour examination deadline." 
                        active={notifications.urgent_reminder} toggle={() => toggleNotification('urgent_reminder')} 
                      />
                      <NotificationToggle 
                        id="weekly_digest" label="Performance Weekly Recap" 
                        description="A summary of your accuracy rate and throughput metrics sent every Monday." 
                        active={notifications.weekly_digest} toggle={() => toggleNotification('weekly_digest')} 
                      />
                      <NotificationToggle 
                        id="security_alerts" label="Account Security Logs" 
                        description="Alert symbols for new login attempts from unrecognized forensic terminals." 
                        active={notifications.security_alerts} toggle={() => toggleNotification('security_alerts')} 
                      />
                   </div>
                   
                   <div className="pt-6 border-t border-white/5 flex justify-end">
                      <button className="px-6 py-2.5 bg-[var(--expert-teal)] text-white text-xs font-bold rounded-xl shadow-lg shadow-[var(--expert-teal)]/20 hover:scale-105 transition-all flex items-center gap-2">
                        <Save size={16} /> SAVE PROTOCOLS
                      </button>
                   </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="space-y-6"
                >
                   <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500">
                            <Key size={24} />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold">Authentication Security</h3>
                            <p className="text-xs text-slate-500">Update your credentials for the secure forensic node.</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Current Cipher</label>
                            <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--expert-teal)] outline-none text-sm transition-all" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">New Forensic Cipher</label>
                            <input type="password" placeholder="Enter new password" className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--expert-teal)] outline-none text-sm transition-all" />
                         </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                         <Info size={20} className="text-amber-500 shrink-0" />
                         <div>
                            <h4 className="text-xs font-bold text-amber-500 mb-1">Secure Protocol Reminder</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">System policy mandates password rotation every 90 days for forensic accounts. Avoid re-using patterns from external auditing stations.</p>
                         </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                         <button className="px-6 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 hover:scale-105 transition-all">
                            UPDATE CIPHER
                         </button>
                      </div>
                   </div>

                   <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
                            <Smartphone size={24} />
                         </div>
                         <div>
                            <h3 className="text-sm font-bold">Two-Factor Authentication</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Status: <span className="text-emerald-500 font-bold">ENCRYPTED & ACTIVE</span></p>
                         </div>
                      </div>
                      <button className="px-4 py-2 rounded-xl text-[10px] font-bold border border-white/10 hover:bg-white/5 uppercase tracking-widest text-slate-500">RECONFIGURE</button>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ProfileNavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
      active 
        ? 'bg-[var(--expert-teal)]/15 border border-[var(--expert-teal)]/30 text-[var(--expert-teal)] shadow-lg shadow-[var(--expert-teal)]/5' 
        : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
    }`}
  >
    <div className="flex items-center gap-3">
       <Icon size={18} className={active ? 'text-[var(--expert-teal)]' : 'text-slate-600 group-hover:text-slate-400'} />
       {label}
    </div>
    {active && <ChevronRight size={14} />}
  </button>
);

const NotificationToggle = ({ label, description, active, toggle }) => (
  <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/2 transition-colors border-b border-white/2 last:border-0 border-transparent hover:border-white/5">
     <div className="flex-1">
        <h4 className="text-sm font-bold text-white mb-0.5">{label}</h4>
        <p className="text-[11px] text-slate-600 max-w-md">{description}</p>
     </div>
     <button 
       onClick={toggle}
       className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-[var(--expert-teal)] shadow-lg shadow-[var(--expert-teal)]/20' : 'bg-slate-800'}`}
     >
        <motion.div 
          animate={{ x: active ? 24 : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-4 h-4 bg-white rounded-full absolute top-1"
        />
     </button>
  </div>
);

export default ExpertProfile;
