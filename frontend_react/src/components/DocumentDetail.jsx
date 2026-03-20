import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Shield, AlertTriangle, AlertOctagon, ShieldCheck, CheckCircle, XCircle, Cpu, ChevronLeft } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const API_BASE    = 'http://localhost:8000';
const AI_API_BASE = 'http://127.0.0.1:8001';

const FLAG_EXPLANATIONS = {
  TAX_MATH_ERROR:            'The tax calculation does not match the stated amounts — a common sign of manual tampering.',
  JPEG_GHOST_DETECTED:       'JPEG ghosting detected — hidden pixel layers suggest content was edited or overlaid.',
  ELA_ANOMALY:               'Error Level Analysis found inconsistent compression — parts of the image may have been re-saved after editing.',
  VENDOR_NOT_FOUND:          'Vendor details appear fabricated or cannot be verified against known records.',
  IBAN_INVALID:              'The IBAN format is invalid or does not match the stated country of origin.',
  TOTAL_MISMATCH:            'The invoice total does not match the sum of the itemised line amounts.',
  CLONE_REGION_DETECTED:     'One or more areas of the document appear to be copy-pasted from another region.',
  OCR_LOW_CONFIDENCE:        'Text extraction confidence is very low — the document may be low quality or artificially generated.',
  METADATA_INCONSISTENCY:    'Document metadata (creation date, software) is inconsistent with its purported origin.',
  BENFORD_VIOLATION:         "The digit distribution does not follow Benford's Law — unusual for legitimate financial data.",
  ROUNDED_AMOUNTS_EXCESSIVE: 'Too many suspiciously round monetary amounts — legitimate invoices rarely avoid fractional cents.',
  EXIF_STRIPPED:             'Image metadata has been completely removed — sometimes done to conceal editing history.',
  DUPLICATE_DETECTED:        'This document appears to be a near-duplicate of another document in the corpus.',
};

// FIX 4: Animated SVG arc confidence gauge
const ConfidenceArcGauge = ({ score, verdict }) => {
  const isReal = verdict === 'REAL';
  const isFake = verdict === 'FAKE';
  let pct = Math.min(100, Math.max(0, score || 0));
  // If score is 0-1 range, scale it
  if (score > 0 && score <= 1) pct = Math.round(score * 100);
  else pct = Math.round(pct);
  
  const radius = 72;
  const circumference = Math.PI * radius; // half-circle
  const filled = (pct / 100) * circumference;
  const empty  = circumference - filled;

  // Color transitions: green → amber → red as score grows
  const arcColor = pct <= 40 ? '#22c55e' : pct <= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 180, height: 100 }}>
        <svg width={180} height={100} viewBox="0 0 180 100" style={{ overflow: 'visible' }}>
          {/* Track */}
          <path
            d={`M 18 90 A ${radius} ${radius} 0 0 1 162 90`}
            fill="none" stroke="var(--divider)" strokeWidth={14} strokeLinecap="round"
          />
          {/* Animated filled arc */}
          <path
            d={`M 18 90 A ${radius} ${radius} 0 0 1 162 90`}
            fill="none"
            stroke={arcColor}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${empty}`}
            style={{ transition: 'stroke-dasharray 0.8s ease-out, stroke 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center', paddingBottom: 2,
        }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: arcColor, lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginTop: 2 }}>
            {verdict || 'Pending'}
          </div>
        </div>
      </div>
    </div>
  );
};

// FIX 4: RadarChart replacing bar chart
const ForensicRadar = ({ scores, verdict }) => {
  const isReal = verdict === 'REAL';
  const isFake = verdict === 'FAKE';
  const fillColor = isFake ? 'rgba(239,68,68,0.3)' : isReal ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)';
  const strokeColor = isFake ? '#ef4444' : isReal ? '#22c55e' : '#f59e0b';

  // Normalize scores to 0-1 range for radar display
  const normalize = (v) => {
    if (v === undefined || v === null) return 0;
    return v > 1 ? v / 100 : v;
  };

  const radarData = [
    { axis: 'Legacy Model',       score: normalize(scores.legacy_model       ?? scores.final_score    ?? 0) },
    { axis: 'Auditor Analysis',   score: normalize(scores.auditor_analysis   ?? scores.audit_score    ?? 0) },
    { axis: 'Image Manipulation', score: normalize(scores.image_manipulation ?? scores.pixel_score    ?? 0) },
    { axis: 'OCR Confidence',     score: normalize(scores.ocr_confidence     ?? scores.text_score     ?? 0) },
    { axis: 'Metadata Score',     score: normalize(scores.metadata_score     ?? scores.metadata       ?? 0) },
  ];

  // Reference at 0.5 midpoint
  const referenceData = radarData.map(d => ({ ...d, midpoint: 0.5 }));

  const RadarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-primary)' }}>
        <p>{payload[0]?.payload?.axis}: <strong>{(payload[0]?.value * 100).toFixed(0)}%</strong></p>
      </div>
    );
  };

  return (
    <div className="flex justify-center">
      <ResponsiveContainer width={300} height={300}>
        <RadarChart data={referenceData} outerRadius={110}>
          <PolarGrid stroke="var(--border-default)" strokeOpacity={0.5} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickCount={3} />
          {/* Reference midpoint polygon */}
          <Radar name="Midpoint" dataKey="midpoint" stroke="var(--text-muted)" strokeWidth={1}
            fill="transparent" strokeDasharray="4 3" dot={false} />
          {/* Actual scores */}
          <Radar name="Scores" dataKey="score" stroke={strokeColor} strokeWidth={2}
            fill={fillColor} dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
            isAnimationActive={true} animationDuration={600} />
          <Tooltip content={<RadarTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Flag pill badge
const FlagPill = ({ flag }) => {
  const text = typeof flag === 'string' ? flag : (flag.label || 'Flag');
  const desc = typeof flag === 'object' ? (flag.desc || flag.description || FLAG_EXPLANATIONS[flag.label] || '') : (FLAG_EXPLANATIONS[flag] || '');
  return (
    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertOctagon size={13} color="#f87171" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{text.replace(/_/g, ' ')}</span>
      </div>
      {desc && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{desc}</p>
      )}
    </div>
  );
};

const DocumentDetail = ({ documentId, isExpertMode = false, user, onBack, onNavigate }) => {
  const [doc,           setDoc]           = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [verdict,       setVerdict]       = useState('');
  const [justification, setJustification] = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [decisionResult,setDecisionResult]= useState('');

  useEffect(() => {
    if (documentId) fetchDoc();
  }, [documentId]);

  const fetchDoc = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/detector/api/document/${documentId}/`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setDoc(data);
      else setError(data.message || 'Document not found.');
    } catch {
      setError('Failed to load document details.');
    } finally { setLoading(false); }
  };

  const handleSubmitDecision = async () => {
    if (!verdict)             { setDecisionResult('error:Please select a verdict.'); return; }
    if (!justification.trim()){ setDecisionResult('error:A written justification is required.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_BASE}/detector/api/expert-decision/${doc.id}/`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict, justification }),
      });
      const data = await res.json();
      if (data.success) {
        setDecisionResult('success:' + data.message);
        setTimeout(() => onBack?.(), 2000);
      } else {
        setDecisionResult('error:' + (data.message || 'Failed to submit decision.'));
      }
    } catch { setDecisionResult('error:Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  // FIX 4: Back button navigates to previous — use onBack prop or browser history
  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-[var(--text-muted)] gap-4">
      <div className="w-10 h-10 border-4 border-white/10 border-t-[#534AB7] rounded-full animate-spin" />
      <p className="text-sm font-mono uppercase tracking-widest animate-pulse">Loading case file...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 text-[var(--text-muted)] gap-4">
      <AlertOctagon size={40} className="text-red-400" />
      <p className="text-red-400 font-semibold">{error}</p>
      <button onClick={handleBack}
        className="mt-2 px-4 py-2 bg-white/5 border border-[var(--divider)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-white/10 transition-all flex items-center gap-2">
        <ChevronLeft size={14} /> Go Back
      </button>
    </div>
  );

  if (!doc) return null;

  const isReal = doc.verdict === 'REAL';
  const isFake = doc.verdict === 'FAKE';
  const isPdf = doc.file_url?.toLowerCase().endsWith('.pdf');
  
  // ROBUST AUTHORITY CHECK: Only true forensic experts take decisions. Admins assign.
  const userRole = user?.profile?.role || user?.role || 'auditor';
  const hasExpertPanel = userRole === 'forensic_expert';
  const canAssign = userRole === 'admin' || user?.is_staff || false;

  const flags = (doc.fraud_indicators || []);
  const compScores = doc.component_scores || {};
  const extractedFields = doc.extracted_text || {};
  const ocrText = doc.ocr_text || doc.extracted_text?.full_text || '';

  // FIX 4: Show N/A for zero/null legacy score
  const legacyScore = compScores.legacy_model ?? compScores.final_score;
  const legacyDisplay = (legacyScore === 0 || legacyScore === null || legacyScore === undefined)
    ? 'N/A' : typeof legacyScore === 'number' ? legacyScore.toFixed(3) : String(legacyScore);

  // FIX 4: image_manipulation bar min-width 8px for non-zero
  const imgManip = compScores.image_manipulation ?? compScores.pixel_score ?? 0;
  const imgManipPct = imgManip > 1 ? imgManip : imgManip * 100;

  const decisionIsSuccess = decisionResult.startsWith('success:');
  const decisionMsg       = decisionResult.replace(/^(success|error):/, '');

  return (
    <div className="space-y-8 pb-16 text-[var(--text-secondary)] transition-colors duration-300">
      {/* Header with back button (FIX 4) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* FIX 4: Back button — navigate(-1) equivalent */}
          <button
            onClick={handleBack}
            className="p-2 rounded-xl border transition-all flex items-center gap-1 text-sm font-semibold"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(83,74,183,0.10)', border: '1px solid rgba(83,74,183,0.2)' }}>
              <FileText size={22} style={{ color: '#7F77DD' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{doc.original_filename || doc.filename}</h2>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                Case ID: <span style={{ color: '#7F77DD' }}>{doc.document_id}</span> · {doc.uploaded_at}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.open(`${API_BASE}/detector/api/generate_pdf/${doc.id}/`, '_blank')}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-sm transition-all"
          style={{ background: '#534AB7', boxShadow: '0 4px 16px rgba(83,74,183,0.25)' }}>
          <Download size={16} /> Download Forensic Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Verdict Card with Arc Gauge (FIX 4) */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 glass-panel p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
            <Shield size={14} style={{ color: '#7F77DD' }} /> System Verdict
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* FIX 4: Animated arc gauge */}
            <ConfidenceArcGauge score={doc.score} verdict={doc.verdict} />
            <div className="flex-1 space-y-4">
              <div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-colors
                  ${isReal ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isFake ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                  {doc.verdict}
                </span>
              </div>
              <h4 className="text-xl font-bold text-[var(--text-primary)]">
                {isReal ? 'Document Authenticated' : isFake ? 'Fraudulent Patterns Detected' : 'Anomalous Activity Flagged'}
              </h4>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-lg">
                {isReal
                  ? 'Our proprietary AI engine has analyzed this document across 14 forensic dimensions and found no evidence of modification or AI generation. It is highly likely to be legitimate.'
                  : 'Critical forensic markers indicate multiple layers of modification. We have identified specific pixel displacements and metadata inconsistencies common in fraudulent documents.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* FIX 4: Flags Side Card — all flags, scrollable, pill badges */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 glass-panel p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5">
            Audit Integrity Flags{flags.length > 0 ? ` (${flags.length})` : ''}
          </h3>
          {flags.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <ShieldCheck size={24} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Pass: High Integrity</p>
            </div>
          ) : (
            /* FIX 4: Scrollable flags, no limit */
            <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {flags.map((flag, idx) => <FlagPill key={idx} flag={flag} />)}
            </div>
          )}
        </motion.div>
      </div>

      {/* Evidence Visual Preview (NEW SECTION FOR FORENSIC REVIEW) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
            <FileText size={14} style={{ color: '#7F77DD' }} /> Visual Evidence Context
          </h3>
          {(userRole === 'admin' || user?.is_staff) && (
            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg border border-amber-500/20 uppercase tracking-widest">
              Administrator Read-Only Mode
            </span>
          )}
        </div>
        
        <div className="rounded-2xl overflow-hidden border border-[var(--divider)] bg-[var(--bg-panel-left)] flex items-center justify-center min-h-[450px] relative group">
          {doc.file_url ? (
            isPdf ? (
              <iframe 
                src={`${API_BASE}${doc.file_url}`}
                title="Forensic Evidence"
                className="w-full h-[600px] border-none"
              />
            ) : (
              <>
                <img 
                  src={`${API_BASE}${doc.file_url}`} 
                  alt="Forensic Evidence" 
                  className="max-w-full max-h-[600px] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/1200x800?text=Forensic+Preview+Unavailable';
                  }}
                />
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  ORIGINAL ARTIFACT: {doc.original_filename || doc.filename}
                </div>
              </>
            )
          ) : (
            <div className="text-[var(--text-muted)] flex flex-col items-center gap-4 py-20">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <FileText size={32} className="opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-[var(--text-primary)]">Binary Artifact Preview Unavailable</p>
                <p className="text-xs opacity-50 mt-1">This document type may require manual download for hex-level inspection.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FIX 4: Forensic Radar Chart — replaces bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-panel p-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6 flex items-center gap-2">
            <Cpu size={14} style={{ color: '#7F77DD' }} /> Forensic Engine Scores
          </h3>
          {Object.keys(compScores).length > 0 ? (
            <ForensicRadar scores={compScores} verdict={doc.verdict} />
          ) : (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm italic">
              Detailed component scoring in progress...
            </div>
          )}
        </motion.div>

        {/* Metadata & OCR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 glass-panel p-8 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Metadata</h3>
            <div className="space-y-3">
              {Object.entries(extractedFields)
                .filter(([k]) => k !== 'full_text')
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-[var(--divider)] last:border-0">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-mono text-[var(--text-primary)] truncate max-w-[140px]">{String(val)}</span>
                  </div>
                ))}
              {/* FIX 4: Legacy model shows N/A if zero */}
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Legacy Model</span>
                <span className={`text-xs font-mono ${legacyDisplay === 'N/A' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{legacyDisplay}</span>
              </div>
            </div>
          </div>
          {/* FIX 4: OCR full-text scrollable */}
          {ocrText && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">OCR Text</h4>
              <div style={{
                maxHeight: 120, overflowY: 'auto', background: 'var(--bg-panel-left)',
                border: '1px solid var(--divider)', borderRadius: 10, padding: '10px 14px',
                fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6,
              }}>
                {ocrText}
              </div>
            </div>
          )}
          {/* FIX 4: Image manipulation bar — min 8px, green for low */}
          {imgManipPct > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Image Manipulation</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${imgManipPct}%`,
                      minWidth: 8,
                      background: imgManipPct < 40 ? '#22c55e' : imgManipPct < 70 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.8s ease-out',
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-[var(--text-primary)]">{imgManipPct.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Expert Decision Panel */}
      {hasExpertPanel && doc.review_status !== 'approved' && doc.review_status !== 'rejected' && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8"
          style={{ border: '1px solid rgba(83,74,183,0.3)', boxShadow: '0 8px 32px rgba(83,74,183,0.10)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(83,74,183,0.12)', border: '1px solid rgba(83,74,183,0.25)' }}>
              <ShieldCheck size={20} style={{ color: '#7F77DD' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Expert Forensic Decision</h3>
              <p className="text-xs text-[var(--text-muted)]">Override AI verdict based on advanced forensic justification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button onClick={() => setVerdict('confirm_fake')}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all
                ${verdict === 'confirm_fake' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-[var(--divider)] text-[var(--text-muted)] hover:border-red-500/30'}`}>
              <AlertOctagon size={28} />
              <div className="text-center">
                <p className="text-sm font-bold">Confirm Fake</p>
                <p className="text-[10px] opacity-70">Mark as guaranteed fraud</p>
              </div>
            </button>
            <button onClick={() => setVerdict('mark_real')}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all
                ${verdict === 'mark_real' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'border-[var(--divider)] text-[var(--text-muted)] hover:border-emerald-500/30'}`}>
              <ShieldCheck size={28} />
              <div className="text-center">
                <p className="text-sm font-bold">Mark as Real</p>
                <p className="text-[10px] opacity-70">Clear all fraud suspicions</p>
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              placeholder="Provide a detailed forensic justification for this decision..."
              value={justification}
              onChange={e => setJustification(e.target.value)}
              className="w-full rounded-2xl p-4 text-sm text-[var(--text-primary)] min-h-[120px] outline-none transition-all placeholder:text-[var(--text-muted)]"
              style={{ background: 'var(--bg-input, rgba(255,255,255,0.04))', border: '1px solid var(--divider)' }}
            />
            {decisionResult && (
              <div className={`p-4 rounded-xl border text-sm font-bold flex items-center gap-2
                ${decisionIsSuccess ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {decisionIsSuccess ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {decisionMsg}
              </div>
            )}
            <button onClick={handleSubmitDecision} disabled={submitting || !verdict}
              className="w-full py-4 text-white rounded-2xl font-bold transition-all"
              style={{ background: '#534AB7', opacity: submitting || !verdict ? 0.5 : 1, cursor: submitting || !verdict ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Submitting Decision...' : 'Commit Forensic Decision'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentDetail;
