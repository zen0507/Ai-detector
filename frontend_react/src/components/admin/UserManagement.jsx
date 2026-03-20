import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, UserPlus, Filter, MoreHorizontal, 
  Eye, Edit, Ban, CheckCircle, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:8000/detector/api/admin/users/', { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                // Map backend role to UI display role
                const mapped = data.users.map(u => ({
                    ...u,
                    name: u.username,
                    status: 'Active', // Mock status for now as Django doesn't have it explicitly
                    docs: u.doc_count,
                    lastLogin: 'Recent',
                    joined: u.date_joined,
                    displayRole: u.role === 'forensic_expert' ? 'Forensic Expert' : u.is_staff ? 'Admin' : 'Auditor'
                }));
                setUsers(mapped);
            }
        } catch (e) {
            console.error('Users fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || u.displayRole === roleFilter;
        return matchesSearch && matchesRole;
    });

    const stats = {
        total: users.length,
        auditors: users.filter(u => u.displayRole === 'Auditor').length,
        experts: users.filter(u => u.displayRole === 'Forensic Expert').length
    };

    if (loading) return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#7F77DD]/20 border-t-[#7F77DD] rounded-full animate-spin" />
      </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">User Management</h2>
                    <p className="text-[var(--text-secondary)] mt-1">Manage system access, roles, and account permissions.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="btn-falsum-ghost px-4 py-2.5 rounded-xl border-[var(--border-admin)] text-sm">
                        <Download size={16} /> Export CSV
                    </button>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="px-5 py-2.5 rounded-xl bg-[#7F77DD] hover:bg-[#6b62d1] text-white font-bold text-sm shadow-lg shadow-[#7F77DD]/20 transition-all flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Create New User
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="falsum-input pl-11 border-[var(--border-admin)] bg-[var(--bg-card)] focus:border-[#7F77DD]/50"
                    />
                </div>
                <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-admin)] self-start">
                    {['All', 'Auditor', 'Forensic Expert'].map(r => (
                        <button 
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider
                                ${roleFilter === r ? 'bg-[#7F77DD] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
                            `}
                        >
                            {r} 
                            <span className={`ml-2 opacity-60`}>
                                {r === 'All' ? stats.total : r === 'Auditor' ? stats.auditors : stats.experts}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="glass-panel border-[var(--border-admin)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-admin)] bg-white/2">
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Identity</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-center">Docs</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Last Activity</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-right px-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-admin)]">
                            {filteredUsers.map(u => (
                                <tr 
                                    key={u.id} 
                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                    className="hover:bg-white/3 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#7F77DD]/10 border border-[#7F77DD]/20 flex items-center justify-center font-bold text-[#7F77DD] text-sm">
                                                {u.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[var(--text-primary)]">{u.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-mono">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.displayRole === 'Forensic Expert' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                            {u.displayRole}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase 
                                            ${u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                                              u.status === 'Suspended' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-[var(--text-muted)]'}
                                        `}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-xs font-mono font-bold text-[var(--text-secondary)]">{u.docs}</td>
                                    <td className="px-6 py-4 text-xs text-[var(--text-muted)]">{u.lastLogin}</td>
                                    <td className="px-6 py-4 text-right px-8" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => navigate(`/admin/users/${u.id}`)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[#7F77DD] transition-all" title="View Detail"><Eye size={16} /></button>
                                            <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[#7F77DD] transition-all" title="Edit"><Edit size={16} /></button>
                                            <button className={`p-2 rounded-lg hover:bg-white/5 transition-all ${u.status === 'Suspended' ? 'text-emerald-400' : 'text-red-400'}`} title={u.status === 'Suspended' ? 'Activate' : 'Suspend'}>
                                                {u.status === 'Suspended' ? <CheckCircle size={16} /> : <Ban size={16} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            className="glass-panel p-8 max-w-lg w-full border-[#7F77DD]/30 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#7F77DD]/10 border border-[#7F77DD]/20">
                                        <UserPlus size={24} className="text-[#7F77DD]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Provision New Account</h3>
                                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Identity Access Management</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form className="space-y-5" onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target);
                                const payload = Object.fromEntries(formData.entries());
                                try {
                                    const res = await fetch('http://localhost:8000/detector/api/admin/users/create/', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            username: payload.full_name,
                                            email: payload.email,
                                            password: payload.password,
                                            role: payload.role
                                        }),
                                        credentials: 'include'
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        setShowCreateModal(false);
                                        fetchUsers(); 
                                    } else {
                                        alert(data.message);
                                    }
                                } catch (err) {
                                    console.error('Provision failed', err);
                                }
                            }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Security Identifier</label>
                                        <input required name="full_name" type="text" className="falsum-input bg-black/20 border-white/5 focus:border-[#7F77DD]/50" placeholder="e.g. j_smith" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">System Role</label>
                                        <select name="role" className="falsum-input bg-black/20 border-white/5 font-bold text-xs">
                                            <option value="auditor">Auditor (Primary)</option>
                                            <option value="forensic_expert">Forensic Expert</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Enterprise Email</label>
                                    <input required name="email" type="email" className="falsum-input bg-black/20 border-white/5 focus:border-[#7F77DD]/50" placeholder="name@falsum.legal" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Temporary Access Key (Password)</label>
                                    <input required name="password" type="password" className="falsum-input bg-black/20 border-white/5 focus:border-[#7F77DD]/50 font-mono" placeholder="••••••••" />
                                </div>

                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-start gap-3">
                                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed italic">
                                        Account creation will trigger a system-wide audit event. The user will be required to rotate this temporary access key upon first authentication.
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="submit"
                                        className="w-full h-14 rounded-2xl bg-[#7F77DD] text-white font-bold shadow-2xl shadow-[#7F77DD]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <UserPlus size={18} /> Provision Identity Account
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserManagement;
