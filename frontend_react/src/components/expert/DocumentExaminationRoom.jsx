import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, AlertCircle, FileText, CheckCircle, 
  X, ChevronLeft, ZoomIn, ZoomOut, Maximize2, 
  Layers, Database, Landmark, Receipt, 
  Check, Info, Clock, AlertTriangle, 
  MoreVertical, Share2, Timer, Send, ShieldAlert,
  Edit2, Eye, Calculator
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const DocumentExaminationRoom = ({ user, onBack }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  // Timer state
  const [seconds, setSeconds] = useState(0);
  
  // Decision state
  const [verdict, setVerdict] = useState(null);
  const [justification, setJustification] = useState('');
  const [confidence, setConfidence] = useState('Medium');
  const [flagSecondOpinion, setFlagSecondOpinion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${API_BASE}/detector/api/document/${id}/`, { credentials: 'include' });
        const d = await res.json();
        if (d.success) setDoc(d.document);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDoc();
    
    // Start timer
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!verdict || justification.length < 50) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/detector/api/expert-decision/${id}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          verdict, 
          justification, 
          confidence, 
          flag_second_opinion: flagSecondOpinion,
          review_time_seconds: seconds
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/expert/queue'), 3000);
      }
    } catch (e) {
      console.error('Submission failed', e);
    } finally {
      setSubmitting(false);
    }
  }, [id, verdict, justification, confidence, flagSecondOpinion, seconds, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key.toLowerCase() === 'f') setVerdict('FAKE');
      if (e.key.toLowerCase() === 'r') setVerdict('REAL');
      if (e.key === 'Enter' && verdict && justification.length >= 50 && !submitting) handleSubmit();
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [verdict, justification, submitting, handleSubmit]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a18]">
      <div className="w-12 h-12 border-4 border-[var(--expert-teal)]/20 border-t-[var(--expert-teal)] rounded-full animate-spin" />
    </div>
  );

  if (success) return (
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8">
      <motion.div 
        initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
        className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-8"
      >
        <CheckCircle size={48} />
      </motion.div>
      <h2 className="text-3xl font-bold mb-4">Verdict Submitted</h2>
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl max-w-sm w-full mb-8">
         <div className="flex justify-between mb-2">
            <span className="text-slate-500 text-xs">Verdict:</span>
            <span className={`text-xs font-bold ${verdict === 'FAKE' ? 'text-red-400' : 'text-emerald-400'}`}>{verdict}</span>
         </div>
         <div className="flex justify-between mb-2">
            <span className="text-slate-500 text-xs">Time Taken:</span>
            <span className="text-xs font-bold text-white">{formatTime(seconds)}</span>
         </div>
         <div className="flex justify-between">
            <span className="text-slate-500 text-xs">Confidence:</span>
            <span className="text-xs font-bold text-white">{confidence}</span>
         </div>
      </div>
      <div className="flex gap-4">
        <button onClick={() => navigate('/expert/queue')} className="px-6 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-bold">Return to Queue</button>
        <button className="px-6 py-2.5 bg-[var(--expert-teal)] text-white text-sm font-bold rounded-xl">Next Document</button>
      </div>
      <p className="mt-8 text-xs text-slate-500 animate-pulse">Navigating to queue in 3 seconds...</p>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col pt-2 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/expert/queue')} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight">{doc?.filename}</h2>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${doc?.document_type === 'receipt' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'}`}>
                {doc?.document_type?.toUpperCase() || 'INVOICE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-2 uppercase tracking-tighter">
              Submitted by <span className="text-slate-300">{doc?.uploaded_by}</span> · {doc?.uploaded_at}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-red-500/20 text-red-400 font-mono shadow-inner">
              <Timer size={16} />
              <span className="text-sm font-bold">{formatTime(seconds)}</span>
           </div>
           <div className="h-10 w-[1px] bg-white/5 mx-2" />
           <button className="p-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-white transition-all"><Share2 size={18} /></button>
           <button className="p-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-white transition-all"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[800px]">
        
        {/* Left Column (Evidence) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="rounded-3xl bg-white/5 border border-white/10 overflow-hidden flex flex-col flex-1 shadow-2xl">
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Document Evidence</h3>
                 <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all"><ZoomOut size={14} /></button>
                    <span className="text-[10px] font-mono text-slate-500">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all"><ZoomIn size={14} /></button>
                    <button onClick={() => setShowHeatmap(!showHeatmap)} className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${showHeatmap ? 'bg-[var(--expert-teal)] border-[var(--expert-teal)] text-white' : 'border-white/10 text-slate-400 hover:text-white'}`}>
                      <Layers size={14} /> <span className="text-[10px] font-bold">HEATMAP</span>
                    </button>
                 </div>
              </div>
              <div className="flex-1 bg-black/40 overflow-auto relative p-8 flex items-center justify-center min-h-[400px]">
                 <motion.div 
                   animate={{ scale: zoom }}
                   className="relative shadow-2xl shadow-black/80 ring-1 ring-white/10 rounded-lg overflow-hidden max-w-full"
                 >
                    <img src={doc?.file_url} alt="Document" className="max-w-none w-auto" style={{ maxHeight: 'calc(100vh - 400px)' }} />
                    <AnimatePresence>
                      {showHeatmap && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-red-500/40 mix-blend-overlay pointer-events-none"
                          style={{ filter: 'blur(10px) contrast(150%)' }}
                        />
                      )}
                    </AnimatePresence>
                 </motion.div>
              </div>
              <div className="p-5 border-t border-white/5 bg-black/10">
                 <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    <div>
                       <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Filename</p>
                       <p className="text-xs text-white truncate">{doc?.filename}</p>
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Format</p>
                       <p className="text-xs text-white">IMAGE/PNG</p>
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">File Size</p>
                       <p className="text-xs text-white">1.2 MB</p>
                    </div>
                    <div>
                       <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">MD5 Hash</p>
                       <p className="text-xs text-slate-400 font-mono truncate">e89a1e0f0f1a1e0f0f1a...</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Center Column (AI Findings) */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto max-h-[85vh] pr-2 scrollbar-none">
           {/* Summary Tooltip */}
           <div className="p-6 rounded-3xl bg-[var(--expert-teal)]/5 border border-[var(--expert-teal)]/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--expert-teal)]/10 blur-3xl rounded-full -mr-10 -mt-10" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                 <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <ShieldAlert size={16} className="text-[var(--expert-teal)]" /> 
                   AI Forensic Summary
                 </h3>
                 <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-500 text-[10px] font-bold">SUSPICIOUS (RISK: {doc?.final_score}%)</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed relative z-10">AI detected multiple high-risk indicators in the mathematical structure and provider registration. Immediate human verification of VAT ID and subtotal logic is recommended.</p>
           </div>

           {/* OCR Findings */}
           <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center justify-between">
                Financial Data Extracted
                <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded tracking-tighter">Donut-OCR-v1</span>
              </h3>
              <div className="space-y-4">
                 {Object.entries(doc?.extracted_text || {}).slice(0, 8).map(([key, val]) => (
                   <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/2 hover:bg-white/5 transition-all border border-white/5">
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white">{typeof val === 'object' ? JSON.stringify(val) : val}</span>
                        <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-500">92%</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Audit Flags */}
           <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 font-mono">Flagged Anomalies</h3>
              <div className="space-y-4">
                 {(doc?.fraud_indicators || []).map((flag, idx) => (
                   <div key={idx} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle size={14} className="text-red-500" />
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{flag}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">This flag triggers when the tax identifier does not correspond to the legal address of the vendor provided in the invoice header.</p>
                   </div>
                 ))}
              </div>
           </div>

           {/* Math Cross-Check */}
           <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                <Calculator size={14} /> Mathematical Cross-Check
              </h3>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                    <span className="text-xs text-slate-400">VAT Calculation (15%)</span>
                    <div className="flex items-center gap-3">
                       <span className="text-xs line-through text-slate-600">$420.00</span>
                       <span className="text-xs font-bold text-red-500">$480.00</span>
                       <X size={14} className="text-red-500" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <span className="text-xs text-slate-400">Total Sum Check</span>
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-bold text-emerald-500">$3,280.00</span>
                       <Check size={14} className="text-emerald-500" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column (Decision) */}
        <div className="lg:col-span-3">
           <div className="sticky top-24 space-y-6">
              <div className="p-8 rounded-[40px] bg-[#0a0a18] border border-white/10 shadow-2xl relative overflow-hidden">
                 {/* Accents */}
                 <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--expert-teal)]/5 blur-3xl opacity-50" />
                 
                 <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-10 border-b border-white/5 pb-4">Specialist Verdict</h3>
                 
                 <div className="space-y-8">
                    {/* Toggle Buttons */}
                    <div className="grid grid-cols-1 gap-4">
                       <button 
                         onClick={() => setVerdict('FAKE')}
                         className={`px-6 py-4 rounded-3xl border text-sm font-bold transition-all flex items-center justify-center gap-3 ${verdict === 'FAKE' ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:border-red-500/30'}`}
                       >
                          <ShieldAlert size={18} /> CONFIRM FAKE
                       </button>
                       <button 
                         onClick={() => setVerdict('REAL')}
                         className={`px-6 py-4 rounded-3xl border text-sm font-bold transition-all flex items-center justify-center gap-3 ${verdict === 'REAL' ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-500 hover:border-emerald-500/30'}`}
                       >
                          <CheckCircle size={18} /> CLEAR AS REAL
                       </button>
                    </div>

                    {/* Justification */}
                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Forensic Reasoning (Min 50 Chars)</label>
                       <div className="relative">
                          <textarea 
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            rows={6}
                            placeholder="Identify specific anomalies or verify document authenticity..."
                            className="w-full rounded-2xl bg-black border border-white/10 p-4 text-sm text-white resize-none outline-none focus:border-[var(--expert-teal)]/50 transition-all font-mono placeholder:text-slate-800"
                          />
                          <div className={`absolute bottom-4 right-4 text-[10px] font-mono ${justification.length >= 50 ? 'text-emerald-500' : 'text-slate-700'}`}>
                             {justification.length}/50
                          </div>
                       </div>
                    </div>

                    {/* Confidence Dropdown */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Assertion Confidence</label>
                       <div className="grid grid-cols-5 gap-2">
                          {['Very Low', 'Low', 'Medium', 'High', 'Very High'].map(lvl => (
                            <button 
                              key={lvl}
                              onClick={() => setConfidence(lvl)}
                              className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${confidence === lvl ? 'bg-[var(--expert-teal)]/20 border-[var(--expert-teal)] text-[var(--expert-teal)]' : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-400'}`}
                            >
                               {lvl.split(' ')[0]}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Second Opinion */}
                    <label className="flex items-center gap-3 p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all cursor-pointer group">
                       <input 
                         type="checkbox" 
                         checked={flagSecondOpinion} 
                         onChange={(e) => setFlagSecondOpinion(e.target.checked)}
                         className="w-4 h-4 accent-[var(--expert-teal)] bg-black border-white/20 rounded"
                       />
                       <div className="flex-1">
                          <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">Flag for Peer Review</p>
                          <p className="text-[9px] text-slate-600 italic">Adds a second examiner to this doc</p>
                       </div>
                    </label>

                    {/* Submit */}
                    <div className="pt-4 space-y-3">
                       <button 
                         onClick={handleSubmit}
                         disabled={!verdict || justification.length < 50 || submitting}
                         className="w-full py-4 rounded-3xl bg-[var(--expert-teal)] text-white text-sm font-bold hover:bg-[#0c5945] transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl shadow-[var(--expert-teal)]/30"
                       >
                          {submitting ? 'PROCESSING...' : (
                            <>
                              SUBMIT VERDICT <Send size={16} />
                            </>
                          )}
                       </button>
                       <p className="text-[9px] text-slate-700 text-center uppercase tracking-tighter italic">This operation irreversibly overrides AI risk scoring.</p>
                    </div>
                 </div>
              </div>

              {/* Shortcut Hints */}
              <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-slate-700 uppercase tracking-widest px-6">
                 <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">[F]</span> Fake</div>
                 <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">[R]</span> Real</div>
                 <div className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">[ENTER]</span> Submit</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentExaminationRoom;
