import { Terminal, Activity, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

const FraudIndicatorTimeline = ({ indicators = [], baseTimestamp = null }) => {
    // Generate timeline data based on indicators
    const generateTimeline = () => {
        const baseTime = baseTimestamp ? new Date(baseTimestamp) : new Date();
        const timeline = [];

        // Initial scan start (earliest event)
        timeline.push({
            time: new Date(baseTime.getTime() - 4000), // 4 seconds ago
            label: 'DOCUMENT INGESTION',
            subtext: 'File stream initialized',
            severity: 'info',
            icon: Terminal
        });

        if (!indicators || indicators.length === 0) {
            timeline.push({
                time: new Date(baseTime.getTime() - 2500),
                label: 'PATTERN RECOGNITION',
                subtext: 'Scanning for known forgery signatures...',
                severity: 'info',
                icon: Activity
            });
            timeline.push({
                time: new Date(baseTime.getTime() - 2000),
                label: 'NO ANOMALIES DETECTED',
                subtext: 'Digital artifacts within normal distribution',
                severity: 'success',
                icon: CheckCircle
            });
            timeline.push({
                time: baseTime,
                label: 'VERIFICATION COMPLETE',
                subtext: 'Document integrity confirmed',
                severity: 'success',
                icon: CheckCircle
            });
        } else {
            // Distribute indicators over time
            indicators.forEach((ind, idx) => {
                const offset = 3500 - (idx * 800);
                const text = typeof ind === 'string' ? ind : (ind.description || JSON.stringify(ind));

                timeline.push({
                    time: new Date(baseTime.getTime() - Math.max(0, offset)),
                    label: 'ANOMALY DETECTED',
                    subtext: text,
                    severity: 'warning',
                    icon: AlertTriangle
                });
            });

            timeline.push({
                time: baseTime,
                label: 'RISK THRESHOLD EXCEEDED',
                subtext: 'Security protocols triggered',
                severity: 'danger',
                icon: AlertOctagon
            });
        }

        return timeline.sort((a, b) => a.time - b.time);
    };

    const timelineData = generateTimeline();

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + `.${Math.floor(date.getMilliseconds() / 10).toString().padStart(2, '0')}`;
    };

    return (
        <div className="mt-4 flex flex-col h-full max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
            <div className="relative border-l border-white/10 ml-3 space-y-8 py-2">
                {timelineData.map((item, idx) => (
                    <div key={idx} className="relative ml-6">
                        <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#0a101f] ${item.severity === 'info' ? 'bg-indigo-500/20 text-indigo-400' :
                                item.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                    item.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                            }`}>
                            <item.icon size={12} />
                        </span>
                        <div className="flex flex-col">
                            <span className="font-mono text-xs text-slate-500 mb-1 block">
                                {formatTime(item.time)}
                            </span>
                            <h3 className={`text-sm font-bold ${item.severity === 'info' ? 'text-indigo-300' :
                                    item.severity === 'success' ? 'text-emerald-300' :
                                        item.severity === 'warning' ? 'text-amber-300' :
                                            'text-red-400'
                                }`}>
                                {item.label}
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">
                                {item.subtext}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FraudIndicatorTimeline;
