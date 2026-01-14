import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Filter, FileText, Calendar, HardDrive, X, ShieldCheck, Eye, Trash2, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeadCell, Button, TextInput, Select, Badge, Card, Modal, ModalHeader, ModalBody, Tooltip, Spinner } from 'flowbite-react';
import FraudIndicatorTimeline from './FraudIndicatorTimeline';
import RiskGauge from './RiskGauge';

const API_BASE = 'http://localhost:8000';

const CaseReports = ({ viewMode = 'all' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchReports();
    }, [filterType, viewMode]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/detector/api/reports/`;
            const params = new URLSearchParams();
            if (filterType) params.append('fraud_type', filterType);
            if (viewMode === 'requested') params.append('status_filter', 'requested');

            const fullUrl = params.toString() ? `${url}?${params.toString()}` : url;

            const response = await fetch(fullUrl, { credentials: 'include' });
            const data = await response.json();
            if (data.reports) setReports(data.reports);
        } catch (error) {
            console.error("Failed to fetch reports", error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = async (report) => {
        const id = report.id.toString().replace('DOC-', '');
        if (!id || id.startsWith('CS-')) return;

        try {
            const response = await fetch(`${API_BASE}/detector/api/reports/${id}/`, { credentials: 'include' });
            const data = await response.json();
            if (data.success) {
                // Merge list data (like date) with detail data to ensure consistency
                setSelectedReport({ ...report, ...data });
                setShowModal(true);
            }
        } catch (error) {
            console.error("Failed to fetch report details", error);
        }
    };

    const handleDelete = async (reportId, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to remove this case record? Action will be logged.")) return;

        const id = reportId.toString().replace('DOC-', '');
        try {
            await fetch(`${API_BASE}/detector/api/delete/${id}/`, {
                method: 'POST',
                credentials: 'include'
            });
            fetchReports();
        } catch (error) {
            console.error("Failed to delete report", error);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedReport) return;
        const id = selectedReport.id.toString().replace('DOC-', '');
        window.open(`${API_BASE}/detector/api/reports/${id}/pdf/`, '_blank');
    };

    const closeModal = () => {
        setShowModal(false);
        setTimeout(() => setSelectedReport(null), 300);
    };

    const filteredReports = reports.filter(report =>
        report.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id?.toString().includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-slate-400 mb-2">Audit History</h2>
                    <p className="text-slate-500 dark:text-slate-400">Archived forensic analysis reports</p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={16} />
                        <input
                            type="text"
                            placeholder="Search Case ID..."
                            className="glass-input pl-10 h-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-200 dark:bg-white/5 p-1 rounded-lg">
                        {['', 'fraud', 'verified'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filterType === type
                                    ? 'bg-white dark:bg-indigo-500 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {type === '' ? 'All Cases' : type === 'fraud' ? 'Fraud Risk' : 'Verified'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel overflow-hidden"
            >
                <div className="overflow-x-auto p-4">
                    <Table hoverable className="bg-transparent border-separate border-spacing-y-2">
                        <TableHead className="bg-slate-100 dark:bg-white/5 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
                            <TableRow className="bg-transparent hover:bg-transparent">
                                <TableHeadCell className="p-4 md:p-6 bg-transparent">Case Name</TableHeadCell>
                                <TableHeadCell className="p-4 md:p-6 bg-transparent">ID Ref</TableHeadCell>
                                <TableHeadCell className="p-4 md:p-6 bg-transparent">Date Logged</TableHeadCell>
                                <TableHeadCell className="p-4 md:p-6 bg-transparent">Verification</TableHeadCell>
                                <TableHeadCell className="p-4 md:p-6 bg-transparent text-right">Actions</TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-200 dark:divide-white/5">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center p-8 text-slate-500">
                                        <Spinner size="xl" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center p-8 text-slate-500 bg-transparent">
                                        No reports found matching your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReports.map((report) => (
                                    <TableRow
                                        key={report.id}
                                        className="bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-lg border-b border-slate-100 dark:border-white/5 last:border-0"
                                        onClick={() => handleViewReport(report)}
                                    >
                                        <TableCell className="p-4 md:p-6 font-medium text-slate-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-indigo-500" size={18} />
                                                {report.filename || `Case #${report.id}`}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 md:p-6 text-slate-600 dark:text-slate-400 font-mono text-xs font-semibold">
                                            {report.id}
                                        </TableCell>
                                        <TableCell className="p-4 md:p-6 text-slate-600 dark:text-slate-400 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
                                                {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 md:p-6">
                                            {report.review_status === 'rejected' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30">
                                                    <AlertTriangle size={12} /> FRAUD CONFIRMED
                                                </span>
                                            ) : report.review_status === 'approved' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                                                    <CheckCircle size={12} /> VERIFIED
                                                </span>
                                            ) : report.risk_level === 'high_risk' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                                    <AlertTriangle size={12} /> HIGH RISK
                                                </span>
                                            ) : report.risk_level === 'medium_risk' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                                                    <AlertTriangle size={12} /> SUSPICIOUS
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                    <CheckCircle size={12} /> LOW RISK
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="p-4 md:p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Tooltip content="View Details">
                                                    <Button size="xs" color="gray" className="!bg-transparent !border-none !ring-0 text-slate-400 hover:text-indigo-500">
                                                        <Eye size={18} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip content="Delete Record">
                                                    <Button
                                                        size="xs"
                                                        color="gray"
                                                        className="!bg-transparent !border-none !ring-0 text-slate-400 hover:text-red-500"
                                                        onClick={(e) => handleDelete(report.id, e)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </motion.div>

            <Modal show={showModal} onClose={closeModal} size="5xl" popup className="bg-slate-900/80 backdrop-blur-sm">
                <ModalHeader className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 p-4" />
                <ModalBody className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-0 overflow-hidden rounded-b-lg">
                    {selectedReport && (
                        <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-[500px]">
                            {/* Left Column: Details & Preview */}
                            <div className="md:col-span-2 p-6 border-r border-slate-200 dark:border-white/5 overflow-y-auto">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
                                            {selectedReport.filename}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">ID: {selectedReport.id}</p>
                                    </div>
                                    <Badge color={selectedReport.status === 'FRAUD' ? 'failure' : 'success'} size="lg">
                                        {selectedReport.status}
                                    </Badge>
                                </div>

                                <button
                                    onClick={closeModal}
                                    className="mb-6 group flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 transition-all"
                                >
                                    <ArrowRight className="rotate-180 mr-2 group-hover:-translate-x-1 transition-transform" size={16} />
                                    Back to Audit List
                                </button>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-white/10 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <AlertTriangle size={40} className="text-slate-500 dark:text-white" />
                                        </div>
                                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-1 font-semibold">Risk Assessment</p>
                                        <p className={`text-xl font-bold ${selectedReport.risk_score > 0.7 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {selectedReport.risk_level ? selectedReport.risk_level.replace(/_/g, ' ').toUpperCase() : (selectedReport.risk_score > 0.7 ? 'CRITICAL' : 'LOW RISK')}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-white/5 dark:to-white/10 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Calendar size={40} className="text-slate-500 dark:text-white" />
                                        </div>
                                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-1 font-semibold">Analyzed On</p>
                                        <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                                            {selectedReport.date ? new Date(selectedReport.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-indigo-500" />
                                        Forensic Analysis
                                    </h4>
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                                        <p className="text-sm text-indigo-900 dark:text-indigo-100 italic leading-relaxed">
                                            "{selectedReport.review_notes || "System generated analysis based on available metadata and visual inspection."}"
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Fraud Indicators</h4>
                                    <FraudIndicatorTimeline
                                        indicators={selectedReport.fraud_indicators || []}
                                        baseTimestamp={selectedReport.date}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Actions & Score */}
                            <div className="p-6 bg-slate-100 dark:bg-white/5 flex flex-col gap-6 justify-center">
                                <Card className="bg-white dark:bg-slate-800 border-none shadow-lg">
                                    <div className="flex flex-col items-center justify-center p-4">
                                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Confidence Score</p>
                                        <div className="flex justify-center items-center">
                                            <RiskGauge score={selectedReport.score || selectedReport.risk_score || 0} size={160} />
                                        </div>
                                        <p className="mt-4 text-sm text-center text-slate-500">
                                            Probability of manipulation based on {selectedReport.fraud_indicators?.length || 0} indicators.
                                        </p>
                                    </div>
                                </Card>

                                <div className="mt-auto space-y-3">
                                    <Button
                                        gradientDuoTone="cyanToBlue"
                                        className="w-full shadow-lg shadow-cyan-500/20"
                                        onClick={handleDownloadPDF}
                                    >
                                        <Download className="mr-2 h-4 w-4" /> Download Report
                                    </Button>
                                    <Button color="gray" className="w-full dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:border-white/10" onClick={closeModal}>
                                        Close Viewer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default CaseReports;
