import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, Label, TextInput, Button } from "flowbite-react";
import { User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const Login = ({ onLogin, onSwitchToRegister, darkMode, toggleTheme }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');



        try {
            const response = await fetch(`${API_BASE}/detector/api/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });

            const data = await response.json();
            if (data.success) {
                onLogin(data);
            } else {
                if (response.status === 401) {
                    setError('Invalid Access ID or Passcode. Please register if you are new.');
                } else {
                    setError(data.message || 'Verification Failed');
                }
            }
        } catch {
            setError('Connection refused.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 relative w-full h-full bg-grid-pattern">
            {/* Theme Toggle (Optional override if needed, but App likely handles this if layout was shared. 
                However, since App renders Login *instead* of Layout content, we keep the toggle here or move it to App level.
                Given current App structure, Login is a direct child of the main Background wrapper, so we keep absolute positioning relative to screen) 
            */}

            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/20 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/30 dark:hover:bg-white/10 transition-all hover:scale-110 shadow-lg"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[400px] relative z-10"
            >
                <div className="glass-panel p-8 md:p-12 border-t border-white/40 dark:border-white/20">
                    <div className="text-center mb-10">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 group cursor-pointer"
                        >
                            <ShieldCheck className="text-white w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                        </motion.div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tighter">Sentry<span className="text-indigo-600 dark:text-neon-violet">AI</span></h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Identity Verification Required</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 group">
                            <Label htmlFor="username" value="ACCESS ID" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-neon-violet transition-colors" />
                            <div className="relative group/input">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-slate-200 dark:border-white/10 group-focus-within/input:border-indigo-500/50 dark:group-focus-within/input:border-neon-violet/50 transition-colors">
                                    <User className="text-slate-400 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-neon-violet transition-colors duration-300" size={20} />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                    placeholder="Enter Agent ID"
                                    required
                                    className="glass-input peer !pl-16"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" value="passcode" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-neon-violet transition-colors" />
                            </div>
                            <div className="relative group/input">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-slate-200 dark:border-white/10 group-focus-within/input:border-indigo-500/50 dark:group-focus-within/input:border-neon-violet/50 transition-colors">
                                    <Lock className="text-slate-400 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-neon-violet transition-colors duration-300" size={18} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    className="glass-input peer !pl-16 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 text-sm font-medium p-3 rounded-xl flex items-center justify-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                {error}
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full h-12 text-base shadow-neon"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Verifying...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span>Authenticate Access</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center bg-white/40 dark:bg-white/5 rounded-xl py-3 border border-slate-200 dark:border-white/5 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors" onClick={onSwitchToRegister}>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">New Personnel?</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white hover:text-indigo-600 dark:hover:text-neon-violet transition-colors">Initialize Portfolio</div>
                    </div>
                </div>

                {/* Footer decorations */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-600 font-mono">SECURE CONNECTION ESTABLISHED • TLS 1.3</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
