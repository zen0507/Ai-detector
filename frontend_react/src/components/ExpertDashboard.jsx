import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, Search, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import AnalysisResult from './AnalysisResult';

const API_BASE = 'http://127.0.0.1:8001';

const ExpertDashboard = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/reviews/pending`);
            const data = await response.json();
            setPendingReviews(data);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectReview = async (id) => {
        try {
            // Fetch full result details
            const response = await fetch(`${API_BASE}/api/result/${id}`);
            if (!response.ok) throw new Error("Failed to load details");
            const data = await response.json();
            setSelectedReview(data);
        } catch (error) {
            console.error("Error loading review details:", error);
        }
    };

    const handleReviewComplete = () => {
        setSelectedReview(null);
        fetchReviews(); // Refresh list
    };

    if (selectedReview) {
        return (
            <div className="relative min-h-screen">
                <button
                    onClick={() => setSelectedReview(null)}
                    className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
                >
                    <ArrowLeft size={16} /> Back to Queue
                </button>
                <div className="pt-12">
                    <AnalysisResult
                        result={selectedReview}
                        onViewChange={() => { }}
                        isExpertMode={true}
                        onReviewComplete={handleReviewComplete}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen animate-fade-in text-slate-600 dark:text-slate-200">
            <header className="mb-10 flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                            <Shield size={32} />
                        </div>
                        Forensic Review Configuration
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 text-sm">
                        Authorized Personnel Only
                        <span className="text-slate-400 dark:text-white/20">•</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
                            {pendingReviews.length} Cases Pending
                        </span>
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                    <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
                    <span className="font-mono text-sm tracking-widest uppercase">Loading case files...</span>
                </div>
            ) : pendingReviews.length === 0 ? (
                <div className="flex justify-center py-20">
                    <div className="glass-panel p-8 text-center max-w-xl w-full flex flex-col items-center">
                        <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <CheckCircle size={48} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Clear!</h3>
                        <p className="text-slate-400">No pending forensic reviews at this time. The queue is empty.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingReviews.map((review) => (
                        <motion.div
                            key={review.id}
                            layoutId={review.id}
                            onClick={() => handleSelectReview(review.id)}
                            className="cursor-pointer group"
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                        >
                            <div className="glass-panel p-6 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 border border-slate-200 dark:border-white/5 hover:border-indigo-500/30 shadow-md hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`p-4 rounded-xl shadow-lg border border-white/5 ${review.risk_level === 'High Risk' ? 'bg-red-500/20 text-red-500 shadow-red-500/20' :
                                            review.risk_level === 'Medium Risk' ? 'bg-amber-500/20 text-amber-500 shadow-amber-500/20' :
                                                'bg-emerald-500/20 text-emerald-500 shadow-emerald-500/20'
                                            }`}>
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">{review.filename}</h4>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">ID: {review.id.substring(0, 8)}...</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={14} /> {review.uploaded_at || 'Recently'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">AI Verdict</div>
                                            <div className={`px-3 py-1 rounded text-sm font-bold border ${review.risk_level === 'High Risk' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                review.risk_level === 'Medium Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                }`}>
                                                {review.risk_level} ({(review.score * 100).toFixed(1)}%)
                                            </div>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-full text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/20 transition-all border border-white/5 group-hover:border-cyan-500/30">
                                            <Search size={20} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExpertDashboard;
