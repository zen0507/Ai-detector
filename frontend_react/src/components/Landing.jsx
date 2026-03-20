import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  CheckCircle, AlertTriangle, XCircle, ArrowRight,
  Search, Layers, Zap, Eye, FileText, Shield,
  Twitter, Github, Linkedin, ChevronRight, Upload, FileCheck,
  Sun, Moon,
} from 'lucide-react';

/* ── Fractured Shield SVG ── */
const FracturedShield = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <path d="M32 4L8 14v18c0 13.2 10.2 23 24 26 13.8-3 24-12.8 24-26V14L32 4z"
      fill="var(--bg-card)" stroke="var(--brand-light)" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M38 14L43 28L36 34L41 50"
      stroke="var(--brand-light)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* ── Wordmark ── */
const FalsumLogo = ({ size = 28 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <FracturedShield size={size} />
    <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
      Falsum
    </span>
  </div>
);

/* ── Section reveal ── */
const Section = ({ children, className = '', delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
};

/* ── Feature card ── */
const FeatureCard = ({ icon: Icon, title, desc, delay }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      style={{
        borderRadius: '12px', padding: '24px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-default)',
        cursor: 'default',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-active)';
        e.currentTarget.style.boxShadow = '0 0 24px var(--brand-glow)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <Icon size={20} style={{ color: 'var(--brand-light)' }} />
      </div>
      <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px', fontSize: '0.95rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  );
};

/* ── Verdict card ── */
const VerdictCard = ({ type, confidence, label, desc, flags, delay }) => {
  const iconMap = { REAL: CheckCircle, SUSPICIOUS: AlertTriangle, FAKE: XCircle };
  const Icon = iconMap[type];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const badgeClass = { REAL: 'verdict-real-badge', SUSPICIOUS: 'verdict-sus-badge', FAKE: 'verdict-fake-badge' }[type];
  const thumbnailGlow = { REAL: 'rgba(59,109,17,0.08)', SUSPICIOUS: 'rgba(186,117,23,0.08)', FAKE: 'rgba(163,45,45,0.08)' }[type];

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="scan-line-wrapper"
      style={{ borderRadius: '12px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-card)', overflow: 'hidden' }}
    >
      {/* Mini doc thumbnail */}
      <div style={{ height: '140px', background: `radial-gradient(circle at 50% 50%, ${thumbnailGlow} 0%, transparent 70%), var(--bg-page)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-default)', position: 'relative' }}>
        <div style={{ width: '90px', height: '108px', borderRadius: '6px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '8px', opacity: 0.7 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ height: '4px', width: '50%', borderRadius: '2px', backgroundColor: 'var(--border-focus)', opacity: 0.4 }} />
            <div style={{ height: '4px', width: '65%', borderRadius: '2px', backgroundColor: 'var(--border-default)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[1, 0.75, 1].map((w, i) => (
              <div key={i} style={{ height: '3px', width: `${w * 100}%`, borderRadius: '2px', backgroundColor: 'var(--border-default)' }} />
            ))}
          </div>
        </div>
        <Icon size={22} style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.75, color: type === 'REAL' ? 'var(--verdict-real-text)' : type === 'SUSPICIOUS' ? 'var(--verdict-sus-text)' : 'var(--verdict-fake-text)' }} />
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className={`font-data ${badgeClass}`} style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px' }}>{label}</span>
          <span className="font-data" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{confidence}</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{desc}</p>
        {flags && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {flags.map(f => (
              <span key={f} className="font-data verdict-fake-badge" style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px' }}>{f}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════ */
const Landing = ({ onGoToLogin, onGoToRegister, theme, toggleTheme }) => {
  const headline = 'Expose the counterfeit.'.split(' ');

  const features = [
    { icon: Eye, title: 'Error Level Analysis', desc: 'Pixel-level manipulation detection using JPEG compression artifact divergence maps.' },
    { icon: Search, title: 'JPEG Ghost Detection', desc: 'Reveals pasted or edited regions by detecting double-compression signatures.' },
    { icon: FileText, title: 'EXIF Metadata Forensics', desc: 'Catches editing software traces, timestamps, and GPS coordinate mismatches.' },
    { icon: Layers, title: 'Dual OCR Engines', desc: 'EasyOCR + Tesseract run in parallel for maximum text extraction accuracy.' },
    { icon: Shield, title: 'Auditor Rule Engine', desc: 'Validates tax math correctness, IBAN geography, date logic, and identity checks.' },
    { icon: Zap, title: 'Grad-CAM Heatmaps', desc: 'Visual explanation of exactly which regions triggered the fraud verdict.' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* ── NAVBAR ── */}
      <header className="navbar-blur" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <FalsumLogo />
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
            {['Features', 'How it works', 'Pricing'].map(link => (
              <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                {link}
              </a>
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme toggle in navbar */}
            <button onClick={toggleTheme} className="theme-toggle">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={onGoToLogin}
              style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
              Login
            </button>
            <button onClick={onGoToRegister} className="btn-falsum-primary"
              style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.875rem' }}>
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="falsum-grid" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', padding: '80px 24px 40px', overflow: 'hidden', position: 'relative' }}>
        <div className="orb orb-purple" style={{ width: '500px', height: '500px', top: '-150px', left: '-150px', opacity: 0.5 }} />
        <div className="orb orb-violet" style={{ width: '400px', height: '400px', bottom: '-80px', right: '-80px', opacity: 0.35 }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', border: '1px solid var(--border-focus)', backgroundColor: 'var(--brand-glow)', color: 'var(--brand-light)', fontSize: '12px', fontWeight: 500, marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand-light)' }} className="animate-pulse" />
            AI-Powered Fraud Detection
          </motion.div>

          {/* Word-by-word headline */}
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '24px', lineHeight: 1.1 }}>
            {headline.map((word, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                style={{ display: 'inline-block', marginRight: '0.3em' }}>
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Falsum uses AI forensics, OCR, and deep image analysis to detect fraudulent invoices,
            receipts, and bank statements in seconds.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <button onClick={onGoToRegister} className="btn-falsum-primary shadow-neon"
              style={{ padding: '12px 28px', borderRadius: '8px', fontSize: '0.95rem' }}>
              Start Detecting <ArrowRight size={16} />
            </button>
            <a href="#how-it-works" className="btn-falsum-ghost"
              style={{ padding: '12px 28px', borderRadius: '8px', fontSize: '0.95rem', textDecoration: 'none' }}>
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* Stat cards */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.15 }}
          style={{ position: 'relative', zIndex: 1, marginTop: '64px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%', maxWidth: '560px', padding: '0 16px' }}>
          {[
            { value: '99.2%', label: 'Detection Accuracy' },
            { value: '3', label: 'Analysis Engines' },
            { value: '< 4s', label: 'Average Scan Time' },
          ].map(stat => (
            <div key={stat.label} className="falsum-card falsum-card-glow"
              style={{ textAlign: 'center', padding: '20px 16px' }}>
              <div className="font-data" style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 600, marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '112px 24px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <Section className="text-center" style={{ marginBottom: '64px' }}>
            <p style={{ color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Process</p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 600 }}>Three steps to the truth</h2>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', position: 'relative' }}>
            {[
              { num: '01', icon: Upload, title: 'Upload Document', desc: 'Drag and drop your invoice, receipt, or bank statement. Supports PDF, PNG, and JPG.' },
              { num: '02', icon: Layers, title: 'AI Analysis', desc: 'OCR extraction, image forensics, and our auditor rule engine run simultaneously in parallel.' },
              { num: '03', icon: FileCheck, title: 'Instant Verdict', desc: 'Receive REAL, SUSPICIOUS, or FAKE with a full explanation of every flag raised.' },
            ].map((step, i) => (
              <Section key={step.num} delay={i * 0.15} style={{ position: 'relative' }}>
                {i < 2 && (
                  <div style={{ display: 'none' }} className="md:flex absolute top-10 -right-4 z-10 items-center">
                    <ChevronRight size={20} style={{ color: 'var(--border-focus)', opacity: 0.5 }} />
                  </div>
                )}
                <div className="falsum-card" style={{ padding: '32px', position: 'relative', height: '100%' }}>
                  <span className="font-data" style={{ position: 'absolute', top: '16px', right: '24px', fontSize: '5rem', fontWeight: 700, color: 'var(--brand-glow)', lineHeight: 1, userSelect: 'none' }}>
                    {step.num}
                  </span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <step.icon size={20} style={{ color: 'var(--brand-light)' }} />
                  </div>
                  <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '12px' }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '96px 24px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Section style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Capabilities</p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 600 }}>Forensic-grade detection</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0', lineHeight: 1.7 }}>
              Every analysis method used by professional fraud examiners, automated and accelerated by AI.
            </p>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* ── VERDICT DEMO ── */}
      <section id="pricing" style={{ padding: '112px 24px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <Section style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p style={{ color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 500, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Verdict System</p>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 600 }}>See the verdict system</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0', lineHeight: 1.7 }}>
              Three clear verdicts. No ambiguity. Every result backed by evidence.
            </p>
          </Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <VerdictCard type="REAL" label="REAL" confidence="97.3% CONFIDENCE"
              desc="All mathematical checks passed. Tax system matches geography. Seller identity verified." delay={0.1} />
            <VerdictCard type="SUSPICIOUS" label="SUSPICIOUS" confidence="61.8% CONFIDENCE"
              desc="Document structure is plausible, but metadata anomalies and unusual rounding detected." delay={0.2} />
            <VerdictCard type="FAKE" label="FAKE" confidence="94.1% CONFIDENCE"
              desc="Hard invalidity detected. Document contains structural forgery signatures."
              flags={['TAX_MATH_ERROR', 'JPEG_GHOST_DETECTED']} delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-default)', padding: '64px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px', marginBottom: '48px' }}>
            <div>
              <FalsumLogo size={24} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '12px', lineHeight: 1.6 }}>The truth in every document.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <button key={i} style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    <Icon size={15} />
                  </button>
                ))}
              </div>
            </div>
            {[
              { title: 'Product', links: ['Features', 'Pricing', 'API Docs', 'Changelog'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem', marginBottom: '16px' }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {col.links.map(link => (
                    <li key={link}><a href="#" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
                      onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>© 2025 Falsum. Built to expose fraud.</p>
            <p className="font-data" style={{ color: 'var(--brand-primary)', fontSize: '11px' }}>FORENSIC ENGINE v2.1.0 • ACTIVE</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
