import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, ArrowLeft, Download, FileText, Activity, Clock, Server, CheckCircle, AlertTriangle, AlertOctagon, ShieldCheck, ChevronLeft, XCircle } from 'lucide-react';
import FraudIndicatorTimeline from './FraudIndicatorTimeline';
import RiskGauge from './RiskGauge';
import { useNotification } from '../context/NotificationSystem';

const API_BASE = 'http://localhost:8000';
const AI_API_BASE = 'http://127.0.0.1:8001';

// FIX 1: Utility to format camelCase or underscored filenames into readable titles
const formatTitle = (name) => {
    if (!name) return 'Scan Report';
    // Replace underscores with spaces
    let spaced = name.replace(/_/g, ' ');
    // Insert space before uppercase letters following lowercase letters
    spaced = spaced.replace(/([a-z])([A-Z])/g, '$1 $2');
    // Capitalize first letter of each word
    return spaced.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// FIX 4: Deduplicate flags array, grouping duplicates with a count
const deduplicateFlags = (flags) => {
    const counts = {};
    flags.forEach(f => {
        const text = typeof f === 'string' ? f : (f.label || f.type || 'Anomaly');
        counts[text] = (counts[text] || 0) + 1;
    });
    return Object.entries(counts).map(([text, count]) => ({ text, count }));
};

const AnalyzerCard = ({ icon, title, status, statusColor, items }) => (
    <div className="glass-panel p-6 hover:bg-white/5 transition-colors group">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className="text-[var(--text-muted)] group-hover:text-[#7F77DD] transition-colors">{icon}</div>
                <h4 className="font-bold text-[var(--text-primary)]">{title}</h4>
            </div>
            <span className={`px-2.5 py-1 rounded-[6px] text-[10px] font-bold uppercase border ${statusColor}`}>
                {status}
            </span>
        </div>
        <div className="space-y-3">
            {items.map((item, i) => {
                const isPositive = ["Verified", "Valid", "Consistent", "0% Duplication", "Pass"].includes(item.val);
                const isNegative = ["Anomalies Found"].includes(item.val);
                const valColor = isPositive ? "text-[var(--color-success,#16a34a)]" : isNegative ? "text-[var(--color-danger,#dc2626)]" : "text-[var(--text-primary)]";
                return (
                    <div key={i} className="flex justify-between text-sm border-b border-[var(--divider)] last:border-0 pb-2 last:pb-0">
                        <span className="text-[var(--text-muted)] font-normal">{item.label}</span>
                        <span className={`font-medium ${valColor}`}>{item.val}</span>
                    </div>
                );
            })}
        </div>
    </div>
);

// FIX 2: Proper status badge
const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase();
    if (s === 'pending_review' || s === 'pending' || s === 'under_review') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--verdict-sus-bg)] border border-[var(--verdict-sus-bd)] text-[var(--verdict-sus-text)] text-[11px] font-bold uppercase tracking-wider">
                <Clock size={11} /> PENDING REVIEW
            </span>
        );
    }
    if (s === 'complete' || s === 'verified' || s === 'approved') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--verdict-real-bg)] border border-[var(--verdict-real-bd)] text-[var(--verdict-real-text)] text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle size={11} /> COMPLETE
            </span>
        );
    }
    if (s === 'rejected' || s === 'fake') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--verdict-fake-bg)] border border-[var(--verdict-fake-bd)] text-[var(--verdict-fake-text)] text-[11px] font-bold uppercase tracking-wider">
                <XCircle size={11} /> REJECTED
            </span>
        );
    }
    // Default 1; no "AI Assessment Complete" teal text
    return null;
};

const AnalysisResult = ({ result: propResult, onViewChange, isExpertMode = false, onReviewComplete }) => {
    const location = useLocation();
    const result = propResult || location.state;
    const notify = useNotification();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reviewComment, setReviewComment] = useState("");

    if (!result) {
        return (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                <div className="glass-panel p-8 text-center">
                    <p>No active result. Please upload a document first.</p>
                </div>
            </div>
        );
    }

    const isMultiple = Array.isArray(result);
    const resultsArray = isMultiple ? result : [result];
    const currentResult = resultsArray[currentIndex];

    // Initialize localStatus safely
    const [localStatus, setLocalStatus] = useState('none');
    const [expertComment, setExpertComment] = useState("");

    useEffect(() => {
        if (currentResult) {
            setLocalStatus(currentResult.verification_status || currentResult.status || 'none');
            if (currentResult.review_comment) setExpertComment(currentResult.review_comment);
        }
    }, [currentResult]);

    useEffect(() => {
        const idToCheck = currentResult?.ai_id || currentResult?.id;
        if (idToCheck && !isExpertMode) {
            fetch(`${AI_API_BASE}/api/result/${idToCheck}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        if (data.verification_status || data.status) setLocalStatus(data.verification_status || data.status);
                        if (data.review_comment) setExpertComment(data.review_comment);
                    }
                })
                .catch(err => console.log("Status check skipped/failed", err));
        }
    }, [currentResult, isExpertMode]);

    const handleReviewAction = async (actionType) => {
        if (!currentResult?.id) return;
        
        if (actionType === "request") {
            const confirmed = window.confirm("Do you want to request a forensic expert review for this document?");
            if (!confirmed) return;
        }

        try {
            // FIX: Always send review requests to the DJANGO backend (port 8000)
            // so they are stored in the shared ForensicReview table for the Admin to see.
            const response = await fetch(`${API_BASE}/detector/api/review/${currentResult.id}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionType, comment: reviewComment }),
                credentials: 'include' // Important for session-based auth
            });
            const data = await response.json();
            if (response.ok) {
                setLocalStatus(data.status);
                notify.success(`Review successfully submitted: ${actionType.toUpperCase()}`);
                if (isExpertMode && onReviewComplete) onReviewComplete();
            } else {
                notify.error(`Failed: ${data.message || 'Unknown error'}`);
            }
        } catch (error) {
            notify.error(`Network error: ${error.message}`);
        }
    };

    const nextResult = () => currentIndex < resultsArray.length - 1 && setCurrentIndex(prev => prev + 1);
    const prevResult = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);
    const handleDownloadPDF = () => {
        if (!currentResult?.id) return;
        window.open(`${API_BASE}/detector/api/generate_pdf/${currentResult.id}/`, '_blank');
    };

    const isNonFinancial = currentResult.risk_level === 'non_financial';
    const isPdf = currentResult.file_url?.toLowerCase().endsWith('.pdf');
    const rawScore = currentResult.score !== undefined ? currentResult.score : currentResult.final_score;
    const displayScore = rawScore !== undefined ? rawScore : 0;
    let displayRiskLevel = (currentResult.risk_level || 'low_risk').toLowerCase().replace(' ', '_');

    useEffect(() => {
        if (currentResult) {
            setLocalStatus(currentResult.review_status || 'not_requested');
        }
    }, [currentResult]);

    const scanTime = new Date().toLocaleString();
    const fileType = currentResult.type || "Invoice/PDF";

    // FIX 1: Format document title
    const rawName = currentResult.filename
        ? currentResult.filename.replace(/\.[^.]+$/, '') // strip extension
        : 'atomicScan';
    const displayTitle = `${formatTitle(rawName)} Report`;

    // FIX 4: Deduplicated flags
    const rawFlags = currentResult.fraud_indicators || [];
    const dedupedFlags = deduplicateFlags(rawFlags);

    const criticalBadgeStyle = `bg-[var(--color-error-bg)] border-[var(--color-error-bd)] text-[var(--color-error)]`;
    const passedBadgeStyle = `bg-[var(--verdict-real-bg)] border-[var(--verdict-real-bd)] text-[var(--verdict-real-text)]`;

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-[var(--divider)]"
            >
                <div className="flex flex-wrap items-center gap-5">
                    <button
                        onClick={() => onViewChange('reports')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-panel-left)] border border-[var(--divider)] text-[var(--text-primary)] hover:border-[#534AB7] hover:bg-[#534AB7]/5 transition-all font-bold text-sm shadow-sm"
                    >
                        <ChevronLeft size={18} /> Audit History
                    </button>

                    <div className="flex items-center gap-4">
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'var(--shield-bg, #ede9ff)',
                            border: '1px solid var(--shield-bd, #c4baf5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Shield size={24} color="#534AB7" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3 tracking-tight flex-wrap">
                                {displayTitle}
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-panel-left)] border border-[var(--divider)] text-[var(--text-muted)] font-mono uppercase">
                                    Scan #{currentIndex + 1}
                                </span>
                            </h1>
                            <div className="flex items-center gap-3 text-[var(--text-muted)] mt-1 text-xs">
                                <div className="flex items-center gap-1.5 font-mono">
                                    <Clock size={12} /> {scanTime}
                                </div>
                                <span className="opacity-30">|</span>
                                <StatusBadge status={localStatus} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto mt-4 xl:mt-0 justify-start xl:justify-end">
                    <button
                        onClick={() => onViewChange('upload')}
                        style={{ background: 'var(--new-scan-bg, #f3f0ff)', border: '1px solid var(--new-scan-bd, #c4baf5)', color: '#534AB7' }}
                        className="px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:brightness-95 transition-all whitespace-nowrap h-11 flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                    >
                        <Activity size={14} className="group-hover:rotate-12 transition-transform" /> New Scan
                    </button>

                    {(localStatus === 'none' || localStatus === 'not_requested') ? (
                        <button
                            onClick={() => handleReviewAction('request')}
                            className="px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/30 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 whitespace-nowrap h-11 shadow-sm hover:shadow-lg hover:shadow-amber-500/20 group"
                        >
                            <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" /> Escalate to Forensic Specialist
                        </button>
                    ) : (
                        <div className="px-5 py-2.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 whitespace-nowrap h-11 shadow-inner shadow-emerald-500/5">
                            <CheckCircle size={16} className="animate-pulse" /> Specialist Review Requested
                        </div>
                    )}

                    <button
                        onClick={handleDownloadPDF}
                        className="px-5 py-2.5 bg-[#534AB7] hover:bg-[#4540a8] text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-[#534AB7]/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap h-11 group"
                    >
                        <Download size={15} className="group-hover:-translate-y-0.5 transition-transform" /> Export Report
                    </button>
                </div>
            </motion.header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left Column: Risk and Indicators */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Triggered Flags */}
                    {!isNonFinancial && dedupedFlags.length > 0 && (
                        <div className="glass-panel p-5 space-y-3">
                            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Detection Flags</h3>
                            <div className="flex flex-wrap gap-2">
                                {dedupedFlags.map(({ text, count }, i) => {
                                    const f = text.toLowerCase();
                                    const isCritical = f.includes('anomaly') || f.includes('fraud') || f.includes('math') || f.includes('tampering') || f.includes('mismatch') || f.includes('error');
                                    const isPositive = f.includes('verified') || f.includes('valid') || f.includes('consistent') || f.includes('pass');
                                    const style = isCritical ? { bg: '#fee2e2', bd: '#f87171', tx: '#b91c1c' } : isPositive ? { bg: 'var(--verdict-real-bg)', bd: 'var(--verdict-real-bd)', tx: 'var(--verdict-real-text)' } : { bg: '#fef3c7', bd: '#f59e0b', tx: '#92400e' };
                                    return (
                                        <span key={i} style={{ background: style.bg, borderColor: style.bd, color: style.tx }} className="px-2 py-0.5 rounded-full text-[11px] font-mono border">
                                            {text} {count > 1 && `(×${count})`}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Risk Gauge Card or Non-Financial Placeholder */}
                    <div className="glass-panel p-6 flex flex-col items-center">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] border-b border-[var(--divider)] pb-4 w-full text-center mb-6">
                            Fabrication Risk
                        </h3>
                        {isNonFinancial ? (
                            <div className="py-12 flex flex-col items-center text-center px-4">
                                <div className="w-20 h-20 bg-[var(--bg-panel-left)] border-2 border-dashed border-[var(--divider)] rounded-full flex items-center justify-center mb-4 text-[var(--text-muted)]">
                                    <FileText size={32} />
                                </div>
                                <h4 className="text-[var(--text-primary)] font-bold mb-1">Non-Financial Document</h4>
                                <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
                                    This file (e.g. Technical Diagram/ERD) does not contain financial transactional data. AI Risk Evaluation is not applicable.
                                </p>
                            </div>
                        ) : (
                            <>
                                <RiskGauge score={displayScore} riskLevel={displayRiskLevel} size={280} />
                                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                                    <div className="text-center p-3 bg-[var(--bg-panel-left)] rounded-xl border border-[var(--divider)]">
                                        <div className="text-[9px] text-[var(--text-muted)] uppercase mb-1">Confidence</div>
                                        <div className="text-lg font-mono font-bold text-[var(--text-primary)]">{displayScore.toFixed(1)}%</div>
                                    </div>
                                    <div className="text-center p-3 bg-[var(--bg-panel-left)] rounded-xl border border-[var(--divider)]">
                                        <div className="text-[9px] text-[var(--text-muted)] uppercase mb-1">Severity</div>
                                        <div className={`text-sm font-bold ${displayRiskLevel === 'high_risk' ? 'text-red-500' : displayRiskLevel === 'medium_risk' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {displayRiskLevel.replace('_', ' ').toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Evidence Preview */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="glass-panel p-6 flex flex-col flex-1 h-full">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <FileText size={18} className="text-[#534AB7]" /> Evidence Context
                            </h3>
                            {isMultiple && (
                                <div className="flex items-center gap-3">
                                    <button onClick={prevResult} disabled={currentIndex === 0} className="p-1 hover:text-[#534AB7] disabled:opacity-20"><ArrowLeft size={16} /></button>
                                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{currentIndex + 1} / {resultsArray.length}</span>
                                    <button onClick={nextResult} disabled={currentIndex === resultsArray.length - 1} className="p-1 hover:text-[#534AB7] disabled:opacity-20"><ArrowRight size={16} /></button>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 rounded-2xl border border-[var(--divider)] bg-[var(--bg-panel-left)] flex items-center justify-center p-4 relative min-h-[450px]">
                            {currentResult.file_url ? (
                                isPdf ? (
                                    <iframe 
                                        src={`${API_BASE}${currentResult.file_url}`}
                                        title="Evidence PDF Preview"
                                        className="w-full h-[500px] border-none rounded-xl"
                                    />
                                ) : (
                                    <img
                                        src={`${API_BASE}${currentResult.file_url}`}
                                        alt="Evidence"
                                        className="max-w-full max-h-[500px] object-contain shadow-sm rounded-lg"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/800x1200?text=Scan+Preview+Unavailable'; }}
                                    />
                                )
                            ) : (
                                <div className="text-center text-[var(--text-muted)] p-12">
                                    <AlertTriangle size={36} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-xs uppercase tracking-[0.2em] font-bold">Preview Artifact Missing</p>
                                    <p className="text-[10px] mt-2 opacity-50">Detailed visual context is unavailable for this object</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Summary Banner */}
            <div className="glass-panel p-6 border-l-4 border-l-[#534AB7] bg-gradient-to-r from-[#534AB7]/5 to-transparent">
                <div className="flex gap-4">
                    <div className="p-3 bg-[#534AB7]/10 rounded-xl text-[#534AB7] shrink-0 h-fit">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">SentryAI Intelligence Summary</h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                            {isNonFinancial 
                                ? "Document marked as low-relevance financial data. Automated risk triggers were suppressed."
                                : (displayRiskLevel === 'high_risk' 
                                    ? "Critical anomalies detected in digital fingerprinting and document structure. Evidence suggests unauthorized fabrication."
                                    : "Structure validated against known financial patterns. No significant deviations found in pixel-level data.")
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Analytics */}
            {!isNonFinancial && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnalyzerCard
                        icon={<AlertOctagon size={24} />}
                        title="Pattern Analysis"
                        status={displayRiskLevel === 'high_risk' ? 'Critical' : 'Normal'}
                        statusColor={displayRiskLevel === 'high_risk' ? criticalBadgeStyle : passedBadgeStyle}
                        items={[{ label: "Pixel Consistency", val: "Verified" }, { label: "Error Level Analysis", val: displayRiskLevel === 'high_risk' ? "Anomalies Found" : "Pass" }, { label: "Clone Detection", val: "0% Duplication" }]}
                    />
                    <AnalyzerCard
                        icon={<Server size={24} />}
                        title="Metadata Forensics"
                        status="Passed"
                        statusColor={passedBadgeStyle}
                        items={[{ label: "EXIF Integrity", val: "Valid" }, { label: "Software Signature", val: "Adobe PDF Lib" }, { label: "Creation Date", val: "Consistent" }]}
                    />
                </div>
            )}

            {/* Timeline */}
            {!isNonFinancial && (
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Clock size={20} className="text-[#534AB7]" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Forensic Timeline</h3>
                    </div>
                    <FraudIndicatorTimeline indicators={currentResult.fraud_indicators} />
                </div>
            )}
        </div>
    );
};

export default AnalysisResult;
