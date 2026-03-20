import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Mail, Lock, Key, Settings, LogOut, Edit2, Check, X, Eye, EyeOff, Bell, Download, Calendar } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full border transition-all duration-300 flex-shrink-0 ${
      checked ? 'bg-[#534AB7] border-[#534AB7]' : 'bg-white/10 border-white/20'
    }`}
    role="switch"
    aria-checked={checked}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${
        checked ? 'left-[22px]' : 'left-0.5'
      }`}
    />
  </button>
);

const InlineEditField = ({ label, value, fieldKey, onSave, type = 'text' }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { setVal(value); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(fieldKey, val);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex justify-between items-center py-3.5 border-b border-[var(--divider)] gap-4">
      <span className="text-[var(--text-muted)] text-sm font-medium flex-shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <input
            type={type}
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            className="bg-white/5 border border-[#534AB7] rounded-lg px-3 py-1 text-sm text-[var(--text-primary)] outline-none w-48 transition-all"
          />
          <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg bg-[#534AB7]/20 border border-[#534AB7]/30 text-[#7F77DD] hover:bg-[#534AB7]/30 transition-all">
            <Check size={13} />
          </button>
          <button onClick={() => { setEditing(false); setVal(value); }} className="p-1.5 rounded-lg bg-white/5 border border-[var(--divider)] text-[var(--text-muted)] hover:text-red-400 transition-all">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-primary)] font-semibold text-sm text-right transition-colors">{val || '—'}</span>
          <button onClick={() => setEditing(true)} className="p-1 text-[var(--text-muted)] hover:text-[#7F77DD] transition-colors" title={`Edit ${label}`}>
            <Edit2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

const PasswordModal = ({ onClose }) => {
  const [form,  setForm]    = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [show,  setShow]    = useState({ cur: false, new: false, con: false });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API_BASE}/detector/api/me/change-password/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setSuccess(data.message); setTimeout(onClose, 1800); }
      else setError(data.message || 'Failed to update password.');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const PasswordField = ({ label, fieldKey, showKey }) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[fieldKey]}
          onChange={e => setForm(p => ({ ...p, [fieldKey]: e.target.value }))}
          className="w-full bg-white/5 border border-[var(--divider)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[#534AB7] outline-none transition-all placeholder:text-[var(--text-muted)]"
          required
        />
        <button type="button" onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          {show[showKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#534AB7]/15 border border-[#534AB7]/30">
              <Key size={18} className="text-[#7F77DD]" />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg">Reset Password</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-white/5 transition-all">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm text-center font-bold">{success}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField label="Current Password"  fieldKey="current_password"  showKey="cur" />
            <PasswordField label="New Password"      fieldKey="new_password"      showKey="new" />
            <PasswordField label="Confirm New Password" fieldKey="confirm_password" showKey="con" />

            {error && (
              <div className="p-3.5 bg-red-400/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold">{error}</div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 bg-white/5 border border-[var(--divider)] rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:bg-white/10 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#534AB7] hover:bg-[#4540a8] rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 shadow-lg shadow-[#534AB7]/20">
                {saving ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

const Profile = ({ user: propUser, onLogout }) => {
  const [profile,       setProfile]       = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [autoDownload,  setAutoDownload]  = useState(false);
  const [showPwModal,   setShowPwModal]   = useState(false);
  const [saveMsg,       setSaveMsg]       = useState('');
  const [loading,       setLoading]       = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res  = await fetch(`${API_BASE}/detector/api/me/`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProfile(data);
        setNotifications(data.notifications ?? true);
        setAutoDownload(data.auto_download ?? false);
      }
    } catch (e) {
      console.error('Profile fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInlineSave = async (field, value) => {
    try {
      const res  = await fetch(`${API_BASE}/detector/api/me/update/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, [field]: value }));
        setSaveMsg('Saved ✓');
        setTimeout(() => setSaveMsg(''), 2000);
      }
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const handleToggle = async (key, val) => {
    if (key === 'notifications') setNotifications(val);
    if (key === 'auto_download') setAutoDownload(val);

    try {
      await fetch(`${API_BASE}/detector/api/me/preferences/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: key === 'notifications' ? val : notifications, auto_download: key === 'auto_download' ? val : autoDownload }),
      });
    } catch (e) {
      console.error('Preferences save failed', e);
    }
  };

  const user = profile || propUser;
  if (!user && loading) return <div className="p-12 text-center text-[var(--text-muted)] animate-pulse">Loading profile...</div>;
  if (!user) return null;

  const role = user.role || (user.is_forensic_expert ? 'forensic_expert' : 'auditor');
  const roleLabel = role === 'forensic_expert' ? 'Forensic Expert' : role === 'admin' ? 'Admin' : 'Auditor';
  const roleColor = role === 'forensic_expert' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-[#7F77DD] border-[#534AB7]/30 bg-[#534AB7]/10';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-[var(--text-secondary)] transition-colors duration-300">
      {showPwModal && <PasswordModal onClose={() => setShowPwModal(false)} />}

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#534AB7]/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#534AB7]/20 bg-[#534AB7]/10 flex items-center justify-center shadow-[0_0_30px_rgba(83,74,183,0.15)]">
              {role === 'forensic_expert' ? <Shield size={44} className="text-emerald-400" /> : <User size={44} className="text-[#7F77DD]" />}
            </div>
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-[var(--bg-page)] rounded-full border border-[var(--divider)] p-1">
              <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] transition-colors">{user.full_name || user.username}</h1>
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${roleColor}`}>{roleLabel}</span>
            </div>
            <p className="text-[var(--text-muted)] flex items-center justify-center md:justify-start gap-2 text-sm transition-colors">
              <Mail size={13} /> {user.email || 'No email on file'}
            </p>
            {saveMsg && <p className="mt-2 text-xs text-emerald-400 font-bold transition-all">{saveMsg}</p>}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2 transition-colors">
            <User size={18} className="text-[#7F77DD]" /> Account Settings
          </h3>
          <div className="space-y-1">
            <InlineEditField label="Full Name" value={user.full_name || user.username} fieldKey="full_name" onSave={handleInlineSave} />
            <InlineEditField label="Email Address" value={user.email || ''} fieldKey="email" onSave={handleInlineSave} type="email" />
            
            <div className="flex justify-between items-center py-3.5 border-b border-[var(--divider)]">
              <span className="text-[var(--text-muted)] text-sm">Username</span>
              <span className="text-[var(--text-primary)] font-mono text-sm transition-colors">{user.username}</span>
            </div>
            <div className="flex justify-between items-center py-3.5 border-b border-[var(--divider)]">
              <span className="text-[var(--text-muted)] text-sm">Security Role</span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-current ${roleColor.split(' ')[0]} ${roleColor.split(' ')[1]}`}>{roleLabel}</span>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[var(--text-muted)] text-sm">Member Since</span>
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-mono text-xs transition-colors">
                <Calendar size={12} className="text-[var(--text-muted)]" /> {profile?.date_joined || 'Recently Joined'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preferences & Password */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-6 flex flex-col">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2 transition-colors">
            <Settings size={18} className="text-[#7F77DD]" /> System Preferences
          </h3>
          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between p-4 bg-white/3 border border-[var(--divider)] rounded-2xl transition-all hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#534AB7]/10 text-[#7F77DD]"><Bell size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Audit Notifications</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Receive analysis completion alerts</p>
                </div>
              </div>
              <Toggle checked={notifications} onChange={v => handleToggle('notifications', v)} />
            </div>

            <div className="flex items-center justify-between p-4 bg-white/3 border border-[var(--divider)] rounded-2xl transition-all hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#534AB7]/10 text-[#7F77DD]"><Download size={16} /></div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Auto-Download PDFs</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Save reports automatically after audit</p>
                </div>
              </div>
              <Toggle checked={autoDownload} onChange={v => handleToggle('auto_download', v)} />
            </div>

            <div className="pt-4 mt-auto">
              <button
                onClick={() => setShowPwModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#534AB7]/10 hover:bg-[#534AB7]/20 border border-[#534AB7]/30 text-[#7F77DD] rounded-2xl font-bold text-sm transition-all shadow-sm"
              >
                <Key size={18} /> Reset Security Password
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Global Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center pt-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-8 py-3.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-bold text-sm transition-all"
        >
          <LogOut size={18} /> End Dashboard Session
        </button>
      </motion.div>
    </div>
  );
};

export default Profile;
