import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextInput, Label, Button, Alert } from 'flowbite-react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sun, Moon, X, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const customTheme = {
  textInput: {
    field: {
      input: {
        colors: {
          gray: "bg-[var(--bg-input)] border-[var(--border-default)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:ring-[var(--brand-glow)] transition-all duration-300",
          failure: "bg-[var(--color-error-bg)] border-[var(--color-error-bd)] text-[var(--color-error)] focus:border-[var(--color-error)] transition-all duration-300",
        },
      },
    },
  },
};

const FracturedShield = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M32 4L8 14v18c0 13.2 10.2 23 24 26 13.8-3 24-12.8 24-26V14L32 4z"
      fill="var(--bg-card)" stroke="var(--brand-light)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M38 14L43 28L36 34L41 50" stroke="var(--brand-light)"
      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const Field = ({ delay, children, focused }) => (
  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    style={{ transformOrigin: 'center left' }}>
    {children}
  </motion.div>
);

const InteractiveIcon = ({ icon: Icon, focused }) => (
  <motion.div
    animate={focused ? { scale: 1.1, color: 'var(--brand-light)' } : { scale: 1, color: 'var(--text-muted)' }}
    transition={{ type: "spring", stiffness: 300, damping: 15 }}
    style={{ position: 'absolute', left: '12px', top: '12px', zIndex: 10, pointerEvents: 'none' }}
  >
    <Icon size={18} />
  </motion.div>
);

const Login = ({ onLogin, onSwitchToRegister, theme, toggleTheme }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const passwordRef = useRef(null);
  const emailRef = useRef(null);

  const handleChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const res = await fetch(`${API_BASE}/detector/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data);
      } else {
        // Report the actual message from backend
        setFormError(data.message || 'Authentication failed. Check your credentials.');
      }
    } catch {
      setFormError('Unable to connect. Server offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'username') {
        // Use document.getElementById or refs if needed, but the current TextInput from Flowbite 
        // doesn't expose a clean ref easily without extra steps. 
        // We'll use getElementById as a reliable fallback for now.
        document.getElementById('password')?.focus();
      } else if (field === 'password') {
        handleSubmit();
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <div className="hidden lg:flex" style={{
        position: 'sticky', top: 0, height: '100vh',
        backgroundColor: 'var(--bg-panel-left)',
        borderRight: '1px solid var(--divider)',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', overflow: 'hidden',
        background: theme === 'light' ? 'linear-gradient(135deg, var(--bg-panel-left) 0%, #fff 100%)' : 'var(--bg-panel-left)'
      }}>
        <div className="absolute inset-0 falsum-grid opacity-30" />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
          <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="cursor-pointer mb-8">
            <FracturedShield size={96} />
          </motion.div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>Falsum</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '40px', maxWidth: '200px' }}>Expose the counterfeit. Verify the truth.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '240px' }}>
            {['Bank-Grade Analysis', 'Instant Verdicts'].map((pill, i) => (
              <div key={pill} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)',
                borderRadius: '12px', padding: '12px 16px',
                color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500,
                boxShadow: '0 4px 6px -1px var(--brand-glow)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-light)' }} />
                {pill}
              </div>
            ))}
          </div>
        </div>
        <p style={{ position: 'absolute', bottom: '32px', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Identity Verified • TLS 1.3
        </p>
      </div>

      <div style={{
        minHeight: '100vh', backgroundColor: 'var(--bg-panel-right)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', position: 'relative',
      }}>
        <button onClick={toggleTheme} className="theme-toggle" style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ width: '100%', maxWidth: '400px' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.01em' }}>Welcome</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>Enter credentials to access forensics.</p>
          </motion.div>

          {formError && (
             <Alert color="failure" icon={X} className="mb-6 shadow-sm" onDismiss={() => setFormError('')}>
               {formError}
             </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Field delay={0.1}>
              <Label htmlFor="email" value="Enterprise Email" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
              <div className="relative">
                <InteractiveIcon icon={Mail} focused={focusedField === 'email'} />
                <TextInput
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10"
                  required
                  value={credentials.username}
                  onChange={e => handleChange('username', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'username')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  color={fieldErrors.username ? 'failure' : 'gray'}
                  theme={customTheme.textInput}
                />
              </div>
            </Field>

            <Field delay={0.2}>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" value="Master Password" style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
                <motion.button type="button" whileHover={{ color: 'var(--text-primary)' }} className="text-[10px] text-[var(--text-muted)] font-bold tracking-wider uppercase">Recovery</motion.button>
              </div>
              <div className="relative">
                <InteractiveIcon icon={Lock} focused={focusedField === 'password'} />
                <TextInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                  value={credentials.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  color={fieldErrors.password ? 'failure' : 'gray'}
                  theme={customTheme.textInput}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-muted)', transition: 'color 0.2s' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
              style={{ backgroundColor: 'var(--brand-primary)', border: 'none' }}
            >
              {loading && <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />}
              <span>{loading ? 'Authenticating...' : 'Sign In to Falsum'}</span>
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
            New auditor? <button onClick={onSwitchToRegister} style={{ color: 'var(--brand-light)', fontWeight: 700, borderBottom: '2px solid transparent' }} className="hover:border-[var(--brand-light)] transition-all">Request Access</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
