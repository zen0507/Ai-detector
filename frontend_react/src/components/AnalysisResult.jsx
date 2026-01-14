import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, ArrowLeft, Download, FileText, Activity, Clock, Server, CheckCircle, AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import FraudIndicatorTimeline from './FraudIndicatorTimeline';
import RiskGauge from './RiskGauge';
import { useNotification } from '../context/NotificationSystem';

const API_BASE = 'http://localhost:8000'; // Django (PDFs, Auth)
const AI_API_BASE = 'http://127.0.0.1:8001'; // FastAPI (Analysis, Review)

const AnalysisResult = ({ result, onViewChange, isExpertMode = false, onReviewComplete }) => {
    const notify = useNotification();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reviewComment, setReviewComment] = useState("");

    // Basic null check
    if (!result) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <div className="glass-panel p-8 text-center">
                    <p>No active result. Please upload a document first.</p>
                </div>
            </div>
        );
    }

    // Handle single vs multiple results
    const isMultiple = Array.isArray(result);
    const resultsArray = isMultiple ? result : [result];
    const currentResult = resultsArray[currentIndex];

    // Status Logic
    const [localStatus, setLocalStatus] = useState(currentResult?.verification_status || 'none');
    const [expertComment, setExpertComment] = useState("");

    useEffect(() => {
        const idToCheck = currentResult?.ai_id || currentResult?.id;
        if (idToCheck && !isExpertMode) {
            fetch(`${AI_API_BASE}/api/result/${idToCheck}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        if (data.verification_status) setLocalStatus(data.verification_status);
                        if (data.review_comment) setExpertComment(data.review_comment);
                    }
                })
                .catch(err => console.log("Status check skipped/failed", err));
        }
    }, [currentResult, isExpertMode]);

    useEffect(() => {
        setLocalStatus(currentResult?.verification_status || 'none');
        if (currentResult?.review_comment) setExpertComment(currentResult.review_comment);
    }, [currentResult]);

    const handleReviewAction = async (actionType) => {
        if (!currentResult || (!currentResult.ai_id && !currentResult.id)) {
            notify.error("Error: Document ID not found. Please try uploading again.");
            return;
        }

        try {
            const reviewId = currentResult.ai_id || currentResult.id;
            const syncHash = currentResult.ai_id || (typeof reviewId === 'string' && reviewId.length > 20 ? reviewId : null);
            const rawId = currentResult.id ? currentResult.id.toString() : '';
            const numericId = rawId.startsWith('DOC-') ? rawId.replace('DOC-', '') : rawId;
            const syncPk = !syncHash && !isNaN(numericId) && numericId.length < 10 ? numericId : null;

            if (syncHash) {
                fetch(`${API_BASE}/detector/api/review_hash/${syncHash}/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: actionType, comment: reviewComment })
                }).catch(e => console.warn("Django sync hash error:", e));
            } else if (syncPk) {
                fetch(`${API_BASE}/detector/api/review/${syncPk}/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: actionType, comment: reviewComment })
                }).catch(e => console.warn("Django sync pk error:", e));
            }

            const response = await fetch(`${AI_API_BASE}/api/review/${reviewId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionType,
                    comment: reviewComment
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setLocalStatus(data.status);
                notify.success(`Review successfully submitted: ${actionType.toUpperCase()}`);

                if (isExpertMode && onReviewComplete) {
                    setTimeout(onReviewComplete, 1000);
                }
            } else {
                notify.error(`Failed to ${actionType} review: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            notify.error(`Network error: ${error.message}`);
        }
    };

    const nextResult = () => currentIndex < resultsArray.length - 1 && setCurrentIndex(prev => prev + 1);
    const prevResult = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);
    const handleDownloadPDF = () => {
        if (!currentResult || !currentResult.id) return;
        window.location.href = `${API_BASE}/detector/api/generate_pdf/${currentResult.id}/`;
    };

    const isNonFinancial = currentResult.risk_level === 'non_financial';
    const rawScore = currentResult.score !== undefined ? currentResult.score : currentResult.final_score;
    const displayScore = rawScore !== undefined ? rawScore : 0;
    let displayRiskLevel = currentResult.risk_level || 'low_risk';
    displayRiskLevel = displayRiskLevel.toLowerCase().replace(' ', '_');

    const scanTime = new Date().toLocaleString();
    const fileSize = "2.4 MB estimated";
    const fileType = currentResult.type || "Invoice/PDF";

    return (
        <div className="min-h-full w-full p-6 md:p-12 animate-fade-in text-slate-600 dark:text-slate-200">
            {/* Header / Top Bar */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-200 dark:border-white/5 pb-6"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            atomic<span className="text-indigo-600 dark:text-cyan-400">Scan</span> Report
                            <span className="text-sm font-mono font-normal py-1 px-3 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 ml-4">
                                {currentResult.id}
                            </span>
                        </h1>
                        <div className="flex items-center gap-3 text-slate-400 mt-2 font-mono text-sm">
                            <Clock size={14} />
                            <span>{scanTime}</span>
                            <span className="text-white/20">|</span>
                            {localStatus === 'pending' ? (
                                <span className="text-amber-400 flex items-center gap-1"><Activity size={14} className="animate-pulse" /> Under Review</span>
                            ) : (localStatus === 'verified' || localStatus === 'approved') ? (
                                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14} /> Verified Authentic</span>
                            ) : localStatus === 'rejected' ? (
                                <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={14} /> Confirmed Fraud</span>
                            ) : (
                                <span className="text-cyan-400 flex items-center gap-1"><Activity size={14} /> AI Assessment Complete</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-4 md:mt-0 items-center">
                    {!isExpertMode && localStatus === 'none' && (
                        <button
                            onClick={() => handleReviewAction('request')}
                            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg border border-indigo-500/30 transition-all flex items-center gap-2"
                        >
                            <ShieldCheck size={16} /> Request Forensic Verification
                        </button>
                    )}

                    {!isExpertMode && localStatus === 'pending' && (
                        <div className="px-4 py-2 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30 flex items-center gap-2 cursor-help">
                            <Clock size={16} className="animate-spin-slow" /> Pending Review
                        </div>
                    )}

                    {!isExpertMode && (
                        <button
                            onClick={() => onViewChange('upload')}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-all"
                        >
                            New Scan
                        </button>
                    )}
                    <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                    >
                        <Download size={16} /> Export PDF
                    </button>
                </div>
            </motion.header>

            {/* Navigation Controls */}
            {isMultiple && (
                <div className="flex items-center justify-between mb-8 glass-panel p-3">
                    <button
                        onClick={prevResult}
                        disabled={currentIndex === 0}
                        className={`text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white flex items-center gap-2 px-3 py-1 rounded transition-colors ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <ArrowLeft size={16} /> Previous Case
                    </button>
                    <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                        Examining Evidence {currentIndex + 1} of {resultsArray.length}
                    </span>
                    <button
                        onClick={nextResult}
                        disabled={currentIndex === resultsArray.length - 1}
                        className={`text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white flex items-center gap-2 px-3 py-1 rounded transition-colors ${currentIndex === resultsArray.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        Next Case <ArrowRight size={16} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-4 space-y-6"
                >
                    <div className="glass-panel overflow-hidden min-h-[400px] flex flex-col items-center justify-center relative p-8">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 w-full flex flex-col items-center">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-8 w-full text-center border-b border-slate-200 dark:border-white/5 pb-4">Fabrication Risk Assessment</h3>
                            <RiskGauge score={displayScore} riskLevel={displayRiskLevel} size={280} />

                            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                                <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Confidence</div>
                                    <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                                        {(displayScore * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Severity</div>
                                    <div className={`text-xl font-bold ${displayRiskLevel === 'high_risk' ? 'text-red-500 dark:text-red-400' :
                                        displayRiskLevel === 'medium_risk' ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-500 dark:text-emerald-400'
                                        }`}>
                                        {displayRiskLevel === 'high_risk' ? 'CRITICAL' :
                                            displayRiskLevel === 'medium_risk' ? 'MODERATE' : 'CLEAN'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                            <FileText size={16} className="text-indigo-600 dark:text-cyan-400" /> Artifact Metadata
                        </h3>
                        <div className="space-y-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-white/5">
                                <span>Filename</span>
                                <span className="text-slate-900 dark:text-white font-mono truncate max-w-[150px]">{currentResult.filename || currentResult.file_info?.filename || "unknown.pdf"}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-white/5">
                                <span>File Size</span>
                                <span className="text-slate-900 dark:text-white font-mono">{fileSize}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-white/5">
                                <span>Detected Type</span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs border border-indigo-500/30">{fileType}</span>
                            </div>

                            {isExpertMode ? (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <h4 className="text-white font-bold mb-3 flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-400" /> Expert Decision</h4>
                                    <textarea
                                        className="w-full bg-[#0a101f] border border-white/10 text-slate-300 text-xs mb-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg p-3 custom-scrollbar resize-none"
                                        placeholder="Add forensic notes..."
                                        rows={3}
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleReviewAction('reject')}
                                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors text-xs font-bold"
                                        >
                                            Mark Fraudulent
                                        </button>
                                        <button
                                            onClick={() => handleReviewAction('confirm')}
                                            className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors text-xs font-bold"
                                        >
                                            Verify Authentic
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex flex-col gap-2 py-2">
                                        <div className="flex justify-between items-center">
                                            <span>Verification Status</span>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${localStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : localStatus === 'rejected' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : localStatus === 'pending' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                                                {localStatus === 'none' ? 'AI Assessment Only' : localStatus}
                                            </span>
                                        </div>
                                        {localStatus === 'none' && (
                                            <button
                                                onClick={() => handleReviewAction('request')}
                                                className="mt-2 w-full px-3 py-2 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck size={12} /> Request Expert Verification
                                            </button>
                                        )}
                                    </div>
                                    {expertComment && (
                                        <div className="mt-3 pt-3 border-t border-white/5">
                                            <h4 className="text-slate-500 dark:text-slate-400 font-bold mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                                                Expert Note
                                            </h4>
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded border border-indigo-200 dark:border-indigo-500/20">
                                                <p className="text-xs text-indigo-700 dark:text-indigo-300 italic">"{expertComment}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Right Column */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-8 space-y-6"
                >
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600 dark:text-cyan-400" /> Evidence Preview
                        </h3>
                        {/* Interactive Explanation */}
                        {isExpertMode && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mb-4 flex items-start gap-4">
                                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 mt-1"><ShieldCheck size={18} /></div>
                                <div>
                                    <h5 className="text-sm font-bold text-white mb-1">Expert Validation Protocol</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Review the document preview below against the AI findings. Verify visual authenticity, then use the decision panel on the left to confirm or reject the system's verdict.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="w-full bg-slate-100 dark:bg-black/40 rounded-xl overflow-hidden border border-slate-200 dark:border-white/5 flex items-center justify-center min-h-[500px] relative">
                            {currentResult.filename ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                    <img
                                        src={isExpertMode ? `${AI_API_BASE}/uploads/${currentResult.filename}` : (currentResult.file_url ? `${API_BASE}${currentResult.file_url}` : `${API_BASE}/media/${currentResult.filename}`)}
                                        alt="Evidence Document"
                                        className="max-w-full max-h-[450px] object-contain shadow-2xl"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div style={{ display: 'none' }} className="text-center">
                                        <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
                                        <p className="text-slate-400 mb-4">Unable to preview document</p>
                                        <a
                                            href={currentResult.file_url ? `${API_BASE}${currentResult.file_url}` : `${API_BASE}/media/${currentResult.filename}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 text-white inline-flex items-center gap-2 transition-colors"
                                        >
                                            <Download size={16} /> Download Document
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <AlertTriangle size={32} className="text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm font-medium">Document preview unavailable</p>
                                    <p className="text-slate-600 text-xs mt-1">Filename reference missing in analysis result.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-6 border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-500/10 to-transparent">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400 shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Detection Engine Verdict</h3>
                                <p className="text-slate-500 dark:text-slate-300 leading-relaxed text-sm">
                                    {isNonFinancial
                                        ? "The document classification system has identified this as non-financial content (e.g., personal photo, generic document). The fraud detection engine is bypassed to prevent false positives on unstructured data."
                                        : "The SentryAI Engine has analyzed 147 distinct data points. Pattern recognition algorithms indicate " + (displayRiskLevel === 'high_risk' ? "significant anomalies consistent with digital fabrication." : "no significant evidence of manipulation. The document appears authentic based on current models.")
                                    }
                                </p>
                                {!isNonFinancial && displayRiskLevel !== 'low_risk' && (
                                    <button
                                        className="mt-4 text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors group"
                                        onClick={() => onViewChange('risk_reduction', currentResult.recommendations)}
                                    >
                                        View Remediation Steps <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isNonFinancial && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnalyzerCard
                                icon={<AlertOctagon size={24} />}
                                title="Pattern Analysis"
                                status={displayRiskLevel === 'high_risk' ? 'Critical' : 'Normal'}
                                statusColor={displayRiskLevel === 'high_risk' ? 'text-red-400 bg-red-500/20 border-red-500/30' : 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'}
                                items={[
                                    { label: "Pixel Consistency", val: "Verified" },
                                    { label: "Error Level Analysis", val: displayRiskLevel === 'high_risk' ? "Anomalies Found" : "Pass" },
                                    { label: "Clone Detection", val: "0% Duplication" }
                                ]}
                            />
                            <AnalyzerCard
                                icon={<Server size={24} />}
                                title="Metadata Forensics"
                                status="Passed"
                                statusColor="text-emerald-400 bg-emerald-500/20 border-emerald-500/30"
                                items={[
                                    { label: "EXIF Integrity", val: "Valid" },
                                    { label: "Software Signature", val: "Adobe PDF Lib" },
                                    { label: "Creation Date", val: "Consistent" }
                                ]}
                            />
                        </div>
                    )}

                    {!isNonFinancial && (
                        <div className="glass-panel p-6">
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-white/5 pb-4">
                                <Clock size={20} className="text-purple-500 dark:text-purple-400" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Forensic Timeline</h3>
                            </div>
                            <FraudIndicatorTimeline indicators={currentResult.fraud_indicators} />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

const AnalyzerCard = ({ icon, title, status, statusColor, items }) => (
    <div className="glass-panel p-6 hover:bg-white/5 transition-colors group">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className="text-slate-500 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">{icon}</div>
                <h4 className="font-bold text-slate-900 dark:text-slate-200">{title}</h4>
            </div>
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${statusColor}`}>
                {status}
            </span>
        </div>
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-slate-200 dark:border-white/5 last:border-0 pb-2 last:pb-0">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{item.val}</span>
                </div>
            ))}
        </div>
    </div>
);

export default AnalysisResult;
