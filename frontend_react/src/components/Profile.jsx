import { motion } from 'framer-motion';
import { User, Shield, Mail, Lock, Activity, Award, LogOut, Settings, Key } from 'lucide-react';

const Profile = ({ user, onLogout }) => {
    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 md:p-12 relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-white/5 bg-slate-900 flex items-center justify-center relative z-10 shadow-2xl">
                            <User size={64} className="text-slate-400" />
                        </div>
                        <div className={`absolute -bottom-2 -right-2 p-2.5 rounded-full border-4 border-white dark:border-[#0a101f] shadow-lg ${user.is_forensic_expert ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'} z-20`}>
                            {user.is_forensic_expert ? <Shield size={18} /> : <User size={18} />}
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user.username}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${user.is_forensic_expert
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                }`}>
                                {user.is_forensic_expert ? 'Level 4 Clearance' : 'Analyst Access'}
                            </span>
                        </div>
                        <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 mb-4">
                            <Mail size={16} /> {user.email || 'agent@sentry.ai'}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 font-bold font-mono flex items-center gap-2 shadow-sm">
                                <Activity size={14} className="text-cyan-600 dark:text-cyan-400" />
                                Active Session
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 dark:bg-white/5 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 font-bold font-mono flex items-center gap-2 shadow-sm">
                                <Shield size={14} className="text-purple-600 dark:text-purple-400" />
                                2FA Enabled
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <User size={20} className="text-indigo-600 dark:text-cyan-400" /> Account Details
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Full Name</span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold text-base">Agent {user.username}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Department</span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold text-base">Digital Forensics</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Clearance Level</span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold text-base">{user.is_forensic_expert ? 'Expert (L4)' : 'Standard (L2)'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-white/5">
                            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">Joined</span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold text-base">Dec 2024</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-6"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Settings size={20} className="text-purple-500 dark:text-purple-400" /> System Preferences
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h4 className="text-slate-800 dark:text-slate-200 font-medium text-sm">Notifications</h4>
                                <p className="text-xs text-slate-500">Receive analysis alerts</p>
                            </div>
                            <div className="w-10 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h4 className="text-slate-800 dark:text-slate-200 font-medium text-sm">Auto-Download Reports</h4>
                                <p className="text-xs text-slate-500">Save PDFs automatically</p>
                            </div>
                            <div className="w-10 h-6 bg-slate-200 dark:bg-white/10 rounded-full relative cursor-pointer border border-slate-300 dark:border-white/10">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full"></div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                            <button className="w-full py-2.5 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-semibold text-indigo-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                                <Key size={16} /> Reset Password
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center pt-8"
            >
                <button
                    onClick={onLogout}
                    className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all flex items-center gap-2 font-bold"
                >
                    <LogOut size={18} /> Sign Out Session
                </button>
            </motion.div>
        </div>
    );
};

export default Profile;
