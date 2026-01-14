import { useState } from 'react';
import { motion } from 'framer-motion';
import { Label } from "flowbite-react";
import { UserPlus, Mail, Lock, ArrowRight, Shield, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const Register = ({ onRegister, onSwitchToLogin, darkMode, toggleTheme }) => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/detector/api/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    email: formData.email
                })
            });

            const data = await response.json();
            if (data.success) {
                onRegister(data);
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 relative w-full h-full bg-grid-pattern">
            {/* Theme Toggle Override if needed */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-slate-300 hover:bg-white/10 transition-all hover:scale-110"
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[450px] relative z-10"
            >
                <div className="glass-panel p-8 md:p-10 border-t border-white/40 dark:border-white/20">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                            <UserPlus className="text-indigo-600 dark:text-cyan-400 w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tighter">System Registry</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Create authorized access profile</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1 group">
                            <Label htmlFor="reg-username" value="Define AGENT ID" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors" />
                            <div className="relative group/input">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-slate-200 dark:border-white/10 group-focus-within/input:border-indigo-500/50 dark:group-focus-within/input:border-neon-violet/50 transition-colors">
                                    <Shield className="text-slate-400 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-cyan-400 transition-colors duration-300" size={18} />
                                </div>
                                <input
                                    id="reg-username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="e.g. Agent_47"
                                    required
                                    className="glass-input peer !pl-16"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 group">
                            <Label htmlFor="reg-email" value="Secure Link" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors" />
                            <div className="relative group/input">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-slate-200 dark:border-white/10 group-focus-within/input:border-indigo-500/50 dark:group-focus-within/input:border-neon-violet/50 transition-colors">
                                    <Mail className="text-slate-400 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-cyan-400 transition-colors duration-300" size={18} />
                                </div>
                                <input
                                    id="reg-email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="secure-mail@unit.com"
                                    required
                                    className="glass-input peer !pl-16"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 relative group">
                                <Label htmlFor="reg-pass" value="Passcode" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors" />
                                <div className="relative group/input">
                                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-slate-200 dark:border-white/10 group-focus-within/input:border-indigo-500/50 dark:group-focus-within/input:border-neon-violet/50 transition-colors">
                                        <Lock className="text-slate-400 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-cyan-400 transition-colors duration-300" size={16} />
                                    </div>
                                    <input
                                        id="reg-pass"
                                        type={showPass ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••"
                                        required
                                        className="glass-input peer !pl-14 pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors z-10"
                                    >
                                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1 relative group">
                                <Label htmlFor="reg-confirm" value="Confirm" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors" />
                                <div className="relative group/input">
                                    <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center border-r border-slate-200 dark:border-white/10 group-focus-within/input:border-indigo-500/50 dark:group-focus-within/input:border-neon-violet/50 transition-colors">
                                        <Lock className="text-slate-400 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-cyan-400 transition-colors duration-300" size={16} />
                                    </div>
                                    <input
                                        id="reg-confirm"
                                        type={showConfirm ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••"
                                        required
                                        className="glass-input peer !pl-14 pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors z-10"
                                    >
                                        {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-200 text-xs p-3 rounded-xl text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-14 mt-4 group flex items-center justify-center gap-2 shadow-neon-cyan"
                        >
                            {loading ? "Initializing..." : (
                                <>
                                    Establish Profile
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center bg-white/40 dark:bg-white/5 rounded-xl py-2 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 transition-colors" onClick={onSwitchToLogin}>
                        <button className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                            Already credentialed? <span className="text-indigo-600 dark:text-cyan-400 font-bold">Log in</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
