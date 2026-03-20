import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextInput, Label, Button, Alert, Checkbox } from 'flowbite-react';
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, FileText, CheckCircle, Sun, Moon, X, Shield, Info, Lock as LockIcon } from 'lucide-react';

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
  checkbox: {
    root: {
      color: {
        primary: "text-[var(--brand-primary)] focus:ring-[var(--brand-glow)]",
      },
    },
  },
};

const FracturedShield = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M32 4L8 14v18c0 13.2 10.2 23 24 26 13.8-3 24-12.8 24-26V14L32 4z"
      fill="var(--bg-card)" stroke="var(--brand-light)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M38 14L43 28L36 34L41 50"
      stroke="var(--brand-light)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const Field = ({ delay, children }) => (
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

const Register = ({ onRegister, onSwitchToLogin, theme, toggleTheme }) => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      const res = await fetch(`${API_BASE}/detector/api/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          role: 'auditor', // Hardcoded as per security rules
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRegister(data);
      } else {
        // Specifically catch role-related rejection from backend
        if (data.message && data.message.includes('Role')) {
          setFormError('Account creation restricted. This role cannot be self-registered. Please contact an administrator.');
        } else {
          setFormError(data.message || 'Registration failed.');
        }
      }
    } catch {
      setFormError('Connection error. Server offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const fields = ['fullname', 'email', 'password', 'confirmPassword'];
      const currentIdx = fields.indexOf(field);
      if (currentIdx < fields.length - 1) {
        document.getElementById(fields[currentIdx + 1])?.focus();
      } else {
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
          <motion.div animate={{ rotateY: [0, 180, 360] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="mb-8">
            <FracturedShield size={80} />
          </motion.div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Join Falsum</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '40px' }}>Expose fraud with forensic AI.</p>

          <div style={{ width: '100%', maxWidth: '240px' }}>
            {['Create account', 'Verify identity', 'Scan evidence'].map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'var(--brand-light)', fontSize: '12px', fontWeight: 700 }}>{i+1}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 600 }}>{step}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ 
            marginTop: '40px', padding: '16px', borderRadius: '12px', 
            backgroundColor: 'var(--brand-glow)', border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '240px'
          }}>
            <Info size={16} style={{ color: 'var(--brand-light)', marginTop: '2px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'left', lineHeight: '1.4' }}>
              Need Forensic Expert access? Contact your system administrator.
            </p>
          </div>
        </div>
        <p style={{ position: 'absolute', bottom: '32px', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '3px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Identity Verified • TLS 1.3
        </p>
      </div>

      <div style={{
        minHeight: '100vh', backgroundColor: 'var(--bg-panel-right)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', overflowY: 'auto', position: 'relative',
      }}>
        <button onClick={toggleTheme} className="theme-toggle" style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div style={{ width: '100%', maxWidth: '400px', padding: '40px 0' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px' }}>Register</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '32px' }}>Request access to the forensic workspace.</p>
          </motion.div>

          {formError && (
             <Alert color="failure" icon={X} className="mb-6 shadow-sm" onDismiss={() => setFormError('')}>
               {formError}
             </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Field delay={0.1}>
              <Label htmlFor="fullname" value="Full Identity" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
              <div className="relative">
                <InteractiveIcon icon={User} focused={focusedField === 'username'} />
                <TextInput
                  id="fullname"
                  className="pl-10"
                  placeholder="Legal Name"
                  required
                  value={formData.username}
                  onChange={e => handleChange('username', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'fullname')}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  color={fieldErrors.username ? 'failure' : 'gray'}
                  theme={customTheme.textInput}
                />
              </div>
            </Field>

            <Field delay={0.15}>
              <Label htmlFor="email" value="Enterprise Email" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
              <div className="relative">
                <InteractiveIcon icon={Mail} focused={focusedField === 'email'} />
                <TextInput
                  id="email"
                  type="email"
                  className="pl-10"
                  placeholder="name@company.com"
                  required
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  color={fieldErrors.email ? 'failure' : 'gray'}
                  theme={customTheme.textInput}
                />
              </div>
            </Field>

            <Field delay={0.2}>
              <Label htmlFor="password" value="Master Password" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
              <div className="relative">
                <InteractiveIcon icon={Lock} focused={focusedField === 'password'} />
                <TextInput
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="pl-10"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  color={fieldErrors.password ? 'failure' : 'gray'}
                  theme={customTheme.textInput}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field delay={0.25}>
              <Label htmlFor="confirmPassword" value="Verification" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
              <div className="relative">
                 <InteractiveIcon icon={Shield} focused={focusedField === 'confirm'} />
                 <TextInput
                   id="confirmPassword"
                   type={showPass ? 'text' : 'password'}
                   className="pl-10"
                   placeholder="••••••••"
                   required
                   value={formData.confirmPassword}
                   onChange={e => handleChange('confirmPassword', e.target.value)}
                   onKeyDown={e => handleKeyDown(e, 'confirmPassword')}
                   onFocus={() => setFocusedField('confirm')}
                   onBlur={() => setFocusedField(null)}
                   color={fieldErrors.confirmPassword ? 'failure' : 'gray'}
                   theme={customTheme.textInput}
                 />
              </div>
            </Field>

            <Field delay={0.3}>
              <Label value="Professional Role" style={{ marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }} />
              <div style={{
                position: 'relative', padding: '16px', borderRadius: '12px', textAlign: 'left',
                backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-default)',
                opacity: 0.8, cursor: 'not-allowed'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                   <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700 }}>Auditor</span>
                   <LockIcon size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 500 }}>Standard Forensic Profile</p>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={10} /> Forensic Expert accounts are created by administrators.
              </p>
            </Field>

            <div className="flex items-center gap-3">
              <Checkbox id="agree" color="purple" theme={customTheme.checkbox} />
              <Label htmlFor="agree" className="text-xs" style={{ color: 'var(--text-secondary)' }}>Accept workspace policies</Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 shadow-lg hover:shadow-xl transition-all"
              style={{ backgroundColor: 'var(--brand-primary)', border: 'none' }}
              isProcessing={loading}
            >
              Sign Up
            </Button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '14px' }}>
            Registered? <button onClick={onSwitchToLogin} style={{ color: 'var(--brand-light)', fontWeight: 700 }} className="hover:underline">Login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
