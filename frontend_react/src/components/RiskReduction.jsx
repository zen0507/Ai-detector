import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, BookOpen, CheckCircle, ArrowLeft, AlertOctagon } from 'lucide-react';
import { Accordion, AccordionPanel, AccordionTitle, AccordionContent, Card, Button, Badge } from 'flowbite-react';

const RiskReduction = ({ onBack, recommendations }) => {
    // If no specific recommendations are passed, use default static ones (fallback)
    const hasSpecificAdvice = recommendations && recommendations.length > 0;

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-8">
            <header className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                        {hasSpecificAdvice ? "Targeted Risk Mitigation" : "Risk Reduction Protocols"}
                    </h2>
                    <p className="text-slate-400">
                        {hasSpecificAdvice ? "Actionable steps based on analysis of your specific file" : "General guidelines for minimizing data fabrication risk"}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 pb-8 custom-scrollbar">
                {/* Main Advisory Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="h-full glass-panel p-8 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/10 to-transparent">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 ${hasSpecificAdvice ? 'bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-amber-500/20 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'} `}>
                                {hasSpecificAdvice ? <AlertOctagon size={32} /> : <ShieldAlert size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-white">
                                {hasSpecificAdvice ? "Detected Flaws & Anomalies" : "Critical Risk Factors"}
                            </h3>
                        </div>

                        {hasSpecificAdvice ? (
                            <div className="space-y-4">
                                {recommendations.map((rec, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-colors">
                                        <div className="p-4 flex gap-3 text-amber-400 font-bold border-b border-white/5 items-center">
                                            <AlertOctagon size={18} />
                                            {rec.title}
                                        </div>
                                        <div className="p-4 text-slate-300 text-sm leading-relaxed">
                                            {rec.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                <li className="flex gap-4 text-slate-300 bg-black/20 p-5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                    <span className="text-amber-500 font-bold pt-1">•</span>
                                    <span>Ensure all financial documents contain verifiable mathematical calculations.</span>
                                </li>
                                <li className="flex gap-4 text-slate-300 bg-black/20 p-5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                    <span className="text-amber-500 font-bold pt-1">•</span>
                                    <span>Verify digital signatures and metadata consistency on all uploads.</span>
                                </li>
                                <li className="flex gap-4 text-slate-300 bg-black/20 p-5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                                    <span className="text-amber-500 font-bold pt-1">•</span>
                                    <span>Avoid uploading low-resolution images or screenshots which trigger heuristic warnings.</span>
                                </li>
                            </ul>
                        )}
                    </div>
                </motion.div>

                {/* Best Practices */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="glass-panel p-8 h-full bg-emerald-900/10 border-emerald-500/20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Correction Strategy</h3>
                        </div>

                        <div className="space-y-8 text-slate-300">
                            <div className="group">
                                <h4 className="text-emerald-400 font-bold mb-2 group-hover:text-emerald-300 transition-colors">1. Valid Source</h4>
                                <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                                    Always replace scanned copies with original PDF exports from the accounting software (e.g., Quickbooks, Xero) whenever possible.
                                </p>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="group">
                                <h4 className="text-emerald-400 font-bold mb-2 group-hover:text-emerald-300 transition-colors">2. Completeness Check</h4>
                                <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                                    Ensure pages are not missing. A gap in invoice numbering or page sequence immediately flags a file as manipulated.
                                </p>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="group">
                                <h4 className="text-emerald-400 font-bold mb-2 group-hover:text-emerald-300 transition-colors">3. Metadata Integrity</h4>
                                <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                                    Do not "Save As" a new PDF to "clean" a document. This destroys the chain of custody. Upload the original file received from the vendor.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Educational Resource */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2"
                >
                    <div className="glass-panel p-6 bg-indigo-600/10 border-indigo-500/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors"></div>
                        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                            <div className="p-4 bg-blue-500/20 rounded-full text-blue-400 border border-blue-500/30">
                                <BookOpen size={32} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Need a manual override?</h3>
                                <p className="text-slate-400 text-sm">If you believe this file is legitimate despite the flags, you can submit a manual review request to the compliance officer.</p>
                            </div>
                            <button className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                                Request Override
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RiskReduction;
