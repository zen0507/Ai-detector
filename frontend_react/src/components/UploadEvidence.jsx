import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, X, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { Progress, Spinner } from 'flowbite-react';
import { useNotification } from '../context/NotificationSystem';

const API_BASE = 'http://localhost:8000';

const ParameterRow = ({ label, status }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500 animate-pulse' : status === 'Standby' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{status}</span>
        </div>
    </div>
);

const UploadEvidence = ({ onViewChange }) => {
    const notify = useNotification();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusText, setStatusText] = useState('Initializing scan...');

    const onDrop = useCallback(acceptedFiles => {
        setFiles(prev => {
            const newFiles = acceptedFiles.filter(file => !prev.some(p => p.name === file.name));
            return [...prev, ...newFiles];
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
            'application/pdf': ['.pdf']
        },
        maxSize: 10485760 // 10MB
    });

    const removeFile = (name) => {
        setFiles(files.filter(f => f.name !== name));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setUploadProgress(10);
        setStatusText('Encrypting payload...');

        const formData = new FormData();
        files.forEach(file => {
            formData.append('file', file);
        });

        try {
            // Simulate progress stages
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            setStatusText('Transmitting to neural core...');

            const response = await fetch(`${API_BASE}/detector/api/upload/`, {
                method: 'POST',
                credentials: 'include',
                body: formData
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

            await new Promise(r => setTimeout(r, 800)); // Brief pause to show 100%

            if (data.success) {
                notify.success("Document analysis complete.");
                onViewChange('result', data);
            } else {
                notify.error(data.message || 'Analysis failed. corrupted data stream.');
                setUploading(false);
            }
        } catch (err) {
            console.error(err);
            notify.error('Network uplink failure. Check connection.');
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">

            {/* Background elements specific to upload page */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-violet/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm">
                        <Shield className="w-8 h-8 text-indigo-600 dark:text-neon-cyan" />
                    </div>
                </div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">New Evidence Analysis</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                    Secure channel for forensic document verification.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Zone */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.99 }}
                        {...getRootProps()}
                        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-16 transition-all duration-300 ease-out overflow-hidden flex flex-col items-center justify-center text-center glass-panel ${isDragActive
                            ? 'border-indigo-500 dark:border-neon-cyan bg-indigo-50 dark:bg-cyan-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)] dark:shadow-[0_0_30px_rgba(34,211,238,0.2)]'
                            : 'border-slate-300 dark:border-white/10 hover:border-indigo-400 dark:hover:border-white/30 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                    >
                        <input {...getInputProps()} />

                        {/* Animated Grid Background */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-500 ${isDragActive ? 'bg-indigo-500 dark:bg-cyan-500 shadow-lg shadow-indigo-500/50 dark:shadow-cyan-500/50 text-white dark:text-black scale-110' : 'bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white group-hover:border-indigo-300 dark:group-hover:border-white/30'
                                }`}>
                                <Upload size={40} className={`transition-transform duration-500 ${isDragActive || 'group-hover:-translate-y-1'}`} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {isDragActive ? "Drop verification files now" : "Drag & Drop Evidence"}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    or <span className="text-indigo-600 dark:text-neon-cyan font-semibold hover:underline underline-offset-4 decoration-indigo-500/50 dark:decoration-neon-cyan/50">browse local files</span> from secure storage
                                </p>
                            </div>

                            <div className="flex gap-4 text-xs font-mono text-slate-500 uppercase tracking-widest pt-4">
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> PDF Reports</span>
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> High-Res Images</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* File List */}
                    <AnimatePresence>
                        {files.length > 0 && (
                            <div className="space-y-3">
                                {files.map((file, idx) => (
                                    <motion.div
                                        key={`${file.name}-${idx}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="glass-panel p-4 flex items-center justify-between group border-l-4 border-l-indigo-500 dark:border-l-neon-violet"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-neon-violet">
                                                <FileText size={24} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-slate-900 dark:text-white truncate max-w-[250px]">{file.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFile(file.name); }}
                                            className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Status & Actions */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-8 h-full flex flex-col justify-between sticky top-6">
                        <div className="space-y-8">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3 text-lg">
                                    <Shield size={20} className="text-indigo-600 dark:text-neon-cyan" />
                                    Analysis Vector
                                </h3>
                                <div className="space-y-3">
                                    <ParameterRow label="Pixel Analysis" status="Active" />
                                    <ParameterRow label="Metadata Scan" status="Active" />
                                    <ParameterRow label="Compression Logic" status="Ready" />
                                    <ParameterRow label="Neural Match" status="Standby" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8">
                            {uploading && (
                                <div className="mb-6 space-y-3">
                                    <div className="flex justify-between text-xs font-mono text-neon-cyan font-bold">
                                        <span className="animate-pulse">{statusText}</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ ease: "linear" }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={uploading || files.length === 0}
                                className={`w-full h-14 uppercase tracking-widest text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${files.length > 0 && !uploading
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-600 dark:to-cyan-600 hover:from-indigo-500 hover:to-violet-500 dark:hover:from-indigo-500 dark:hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/20 dark:shadow-neon-cyan hover:scale-[1.02]'
                                    : 'bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
                            >
                                {uploading ? (
                                    <>
                                        <Spinner size="sm" light={true} className="mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Start Analysis
                                        <ArrowRight size={18} />
                                    </>
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
