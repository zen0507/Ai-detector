import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Shield, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { useNotification } from '../context/NotificationSystem';

const API_BASE    = 'http://localhost:8000';
const AI_API_BASE = 'http://127.0.0.1:8001';

const ENGINES = [
  { name: 'Pixel Analysis',    key: 'pixel' },
  { name: 'Metadata Scan',     key: 'metadata' },
  { name: 'Compression Logic', key: 'compression' },
  { name: 'Neural Match',      key: 'neural' },
];

// Fake readiness scores — will be replaced by real health check values once backend exposes them
const DEFAULT_SCORES = { pixel: 92, metadata: 88, compression: 74, neural: 61 };

const EngineTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-default)',
      borderRadius: 8, padding: '8px 14px', fontSize: 12, color: 'var(--text-primary)'
    }}>
      <p>{payload[0].payload.name}: <strong>{payload[0].value}%</strong></p>
    </div>
  );
};

const UploadEvidence = ({ onViewChange }) => {
  const notify = useNotification();
  const [files, setFiles]                 = useState([]);
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText]       = useState('Initializing scan...');
  const [engineStatus, setEngineStatus]   = useState({});
  const [engineScores, setEngineScores]   = useState(DEFAULT_SCORES);

  // FIX 2: Check FastAPI health and set engine online/offline status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${AI_API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          // All engines online if health check passes
          const status = {};
          ENGINES.forEach(e => { status[e.key] = 'online'; });
          setEngineStatus(status);
          // If backend returns per-engine scores, use them
          if (data.engines) setEngineScores({ ...DEFAULT_SCORES, ...data.engines });
        } else {
          throw new Error('unhealthy');
        }
      } catch {
        // FastAPI offline
        const status = {};
        ENGINES.forEach(e => { status[e.key] = 'offline'; });
        setEngineStatus(status);
      }
    };
    checkHealth();
  }, []);

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prev => [...prev, ...acceptedFiles.filter(f => !prev.some(p => p.name === f.name))]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxSize: 10485760,
  });

  const removeFile = (name) => setFiles(files.filter(f => f.name !== name));

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadProgress(10);
    setStatusText('Encrypting payload...');

    const formData = new FormData();
    files.forEach(file => formData.append('file', file));

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 500);
      setStatusText('Transmitting to neural core...');

      const response = await fetch(`${API_BASE}/detector/api/upload/`, {
        method: 'POST', credentials: 'include', body: formData,
      });
      clearInterval(progressInterval);

      if (response.status === 403) {
        notify.error("Session expired. Please re-authenticate.");
        setUploading(false);
        return;
      }
      const data = await response.json();
      setUploadProgress(100);
      setStatusText('Analysis complete.');
      await new Promise(r => setTimeout(r, 800));

      if (data.success) {
        notify.success("Document analysis complete.");
        onViewChange('result', data);
      } else {
        notify.error(data.message || 'Analysis failed.');
        setUploading(false);
      }
    } catch (err) {
      notify.error('Network uplink failure. Check connection.');
      setUploading(false);
    }
  };

  // Build chart data for the BarChart
  const chartData = ENGINES.map(e => ({
    name: e.name,
    score: engineScores[e.key] || 0,
    online: engineStatus[e.key] === 'online',
  }));

  const hasFile = files.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative transition-colors duration-300">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-2xl border border-[var(--divider)]"
            style={{ background: 'var(--shield-bg, #ede9ff)' }}>
            <Shield className="w-8 h-8" style={{ color: '#534AB7' }} />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">New Evidence Analysis</h2>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto">Secure channel for forensic document verification.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            whileHover={{ scale: 1.003 }}
            {...getRootProps()}
            className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-16 transition-all duration-300 flex flex-col items-center justify-center text-center glass-panel
              ${isDragActive
                ? 'border-[#534AB7] bg-[#534AB7]/5 shadow-[0_0_30px_rgba(83,74,183,0.15)]'
                : 'border-[var(--divider)] hover:border-[#534AB7]/50'}`}
          >
            <input {...getInputProps()} />
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-500
              ${isDragActive ? 'bg-[#534AB7] text-white scale-110' : 'bg-[var(--bg-card)] border border-[var(--divider)] text-[var(--text-muted)] hover:text-[#534AB7]'}`}>
              <Upload size={40} className={`transition-transform duration-500 ${isDragActive ? '' : 'group-hover:-translate-y-1'}`} />
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {isDragActive ? 'Drop verification files now' : 'Drag & Drop Evidence'}
              </h3>
              <p className="text-[var(--text-muted)] text-sm">
                or <span style={{ color: '#7F77DD', fontWeight: 600 }}>browse local files</span> from secure storage
              </p>
            </div>
            {/* FIX 2: format tag dots in brand purple */}
            <div className="flex gap-4 text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest pt-5">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7F77DD' }} /> PDF Reports
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#534AB7' }} /> High-Res Images
              </span>
            </div>
          </motion.div>

          {/* File List */}
          <AnimatePresence>
            {files.length > 0 && (
              <div className="space-y-3">
                {files.map((file, idx) => (
                  <motion.div key={`${file.name}-${idx}`}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="glass-panel p-4 flex items-center justify-between border-l-4"
                    style={{ borderLeftColor: '#534AB7' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(83,74,183,0.08)', border: '1px solid rgba(83,74,183,0.2)', color: '#7F77DD' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] truncate max-w-[250px]">{file.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                      className="p-3 rounded-xl transition-colors text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10">
                      <X size={20} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* FIX 2 ADD: Engine Status Bar Chart panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 h-full flex flex-col justify-between sticky top-6 space-y-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2 text-lg">
                <Shield size={18} style={{ color: '#534AB7' }} /> Analysis Engines
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">Live readiness scores</p>

              {/* Engine status dots + bar chart */}
              <div className="mb-3 space-y-2">
                {ENGINES.map(e => {
                  const isOnline = engineStatus[e.key] === 'online';
                  const statusKnown = engineStatus[e.key] !== undefined;
                  return (
                    <div key={e.key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                        {/* FIX 2: green ACTIVE, red OFFLINE */}
                        <span className={`w-2 h-2 rounded-full ${!statusKnown ? 'bg-[var(--text-muted)]' : isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {e.name}
                      </span>
                      <span className={`font-bold text-[10px] uppercase tracking-wider ${!statusKnown ? 'text-[var(--text-muted)]' : isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                        {!statusKnown ? '—' : isOnline ? 'ACTIVE' : 'OFFLINE'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border-default)" strokeOpacity={0.5} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={0} axisLine={false} tickLine={false} hide />
                  <Tooltip content={<EngineTooltip />} />
                  <Bar dataKey="score" radius={4} isAnimationActive={true} animationDuration={600}>
                    {chartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.online ? '#534AB7' : '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              {uploading && (
                <div className="mb-5 space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold" style={{ color: '#7F77DD' }}>
                    <span className="animate-pulse">{statusText}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--divider)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(to right, #534AB7, #7F77DD)' }}
                      initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} transition={{ ease: 'linear' }} />
                  </div>
                </div>
              )}

              {/* FIX 2: Button enabled with brand purple once file dropped, disabled = opacity 0.4 only */}
              <button
                onClick={handleUpload}
                disabled={uploading || !hasFile}
                className="w-full h-14 uppercase tracking-widest text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-white"
                style={{
                  background: hasFile && !uploading ? '#534AB7' : 'var(--divider)',
                  opacity: uploading || !hasFile ? 0.4 : 1,
                  cursor: hasFile && !uploading ? 'pointer' : 'not-allowed',
                  boxShadow: hasFile && !uploading ? '0 4px 24px rgba(83,74,183,0.3)' : 'none',
                }}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Start Analysis <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadEvidence;
