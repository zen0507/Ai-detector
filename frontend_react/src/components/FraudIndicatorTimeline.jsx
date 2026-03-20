import { Terminal, Activity, CheckCircle, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// FIX 8: Deduplicate timeline events that share the same label + subtext
const deduplicateEvents = (events) => {
    const seen = new Map();
    events.forEach(ev => {
        const key = `${ev.label}||${ev.subtext}`;
        if (seen.has(key)) {
            seen.get(key).count += 1;
        } else {
            seen.set(key, { ...ev, count: 1 });
        }
    });
    return Array.from(seen.values());
};

const FraudIndicatorTimeline = ({ indicators = [], baseTimestamp = null }) => {
    const generateTimeline = () => {
        const baseTime = baseTimestamp ? new Date(baseTimestamp) : new Date();
        const timeline = [];

        timeline.push({
            time: new Date(baseTime.getTime() - 4000),
            label: 'DOCUMENT INGESTION',
            subtext: 'File stream initialized',
            severity: 'info',
            icon: Terminal,
        });

        if (!indicators || indicators.length === 0) {
            timeline.push({
                time: new Date(baseTime.getTime() - 2500),
                label: 'PATTERN RECOGNITION',
                subtext: 'Scanning for known forgery signatures...',
                severity: 'info',
                icon: Activity,
            });
            timeline.push({
                time: baseTime,
                label: 'VERIFICATION COMPLETE',
                subtext: 'Document integrity confirmed',
                severity: 'success',
                icon: CheckCircle,
            });
        } else {
            indicators.forEach((ind, idx) => {
                const offset = 3500 - (idx * 800);
                const text = typeof ind === 'string' ? ind : (ind.description || ind.desc || JSON.stringify(ind));
                timeline.push({
                    time: new Date(baseTime.getTime() - Math.max(0, offset)),
                    label: 'ANOMALY DETECTED',
                    subtext: text,
                    severity: 'warning',
                    icon: AlertTriangle,
                });
            });

            timeline.push({
                time: baseTime,
                label: 'RISK THRESHOLD EXCEEDED',
                subtext: 'Security protocols triggered',
                severity: 'danger',
                icon: AlertOctagon,
            });
        }

        return timeline.sort((a, b) => a.time - b.time);
    };

    const rawTimeline = generateTimeline();
    // FIX 8: Deduplicate before rendering
    const timelineData = deduplicateEvents(rawTimeline);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
            + `.${Math.floor(date.getMilliseconds() / 10).toString().padStart(2, '0')}`;
    };

    // FIX 7: Label colors — #b91c1c for both warning and danger in light mode, unchanged in dark
    const getLabelColor = (severity) => {
        if (severity === 'info') return 'var(--timeline-info, #7F77DD)';
        if (severity === 'success') return 'var(--timeline-success, #16a34a)';
        if (severity === 'warning') return '#b91c1c';   // FIX 7: Dark readable red for light mode
        if (severity === 'danger') return '#b91c1c';    // FIX 7: Same red for both
        return 'var(--text-primary)';
    };

    // FIX 7: Dot background & icon color
    const getDotStyle = (severity) => {
        if (severity === 'info') return { background: 'rgba(83,74,183,0.12)', color: '#7F77DD' };
        if (severity === 'success') return { background: 'rgba(34,197,94,0.12)', color: '#16a34a' };
        if (severity === 'warning') return { background: 'rgba(239,68,68,0.1)', color: '#b91c1c' };
        if (severity === 'danger') return { background: 'rgba(239,68,68,0.12)', color: '#b91c1c' };
        return {};
    };

    const DOT_SIZE = 32; // FIX 7: All dots uniform 32px

    return (
        <div className="w-full transition-colors duration-300">
            {timelineData.map((item, idx) => {
                const isLast = idx === timelineData.length - 1;
                const dotStyle = getDotStyle(item.severity);

                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{ display: 'flex', gap: 0, position: 'relative' }}
                    >
                        {/* Left column: dot + connecting line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: DOT_SIZE, flexShrink: 0, marginRight: 16 }}>
                            {/* FIX 7: Uniform 32px dot for all event types */}
                            <div style={{
                                width: DOT_SIZE,
                                height: DOT_SIZE,
                                borderRadius: '50%',
                                border: '1px solid var(--divider)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                ...dotStyle,
                            }}>
                                <item.icon size={15} color={dotStyle.color} />
                            </div>
                            {/* FIX 7: Vertical connecting line between dots */}
                            {!isLast && (
                                <div style={{
                                    width: 2,
                                    flex: 1,
                                    minHeight: 24,
                                    background: 'var(--divider)',
                                    marginTop: 4,
                                    marginBottom: 4,
                                }} />
                            )}
                        </div>

                        {/* Right column: content */}
                        <div style={{
                            flex: 1,
                            paddingBottom: isLast ? 0 : 20,
                            borderBottom: isLast ? 'none' : '1px solid var(--divider)',
                            // FIX 7: separator margin starts after dot, aligned with text
                            marginLeft: 0,
                            marginBottom: isLast ? 0 : 4,
                        }}>
                            {/* Timestamp */}
                            <span style={{
                                fontFamily: 'monospace',
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 4,
                            }}>
                                <Clock size={11} style={{ opacity: 0.6 }} /> {formatTime(item.time)}
                            </span>

                            {/* Event label — FIX 7: #b91c1c for warning/danger */}
                            <h3 style={{
                                fontSize: 13,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: getLabelColor(item.severity),
                                margin: 0,
                            }}>
                                {item.label}
                                {/* FIX 8: Count badge for deduplicated events */}
                                {item.count > 1 && (
                                    <span style={{
                                        marginLeft: 8,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        padding: '1px 6px',
                                        borderRadius: 999,
                                        background: 'rgba(180,28,28,0.1)',
                                        color: '#b91c1c',
                                        verticalAlign: 'middle',
                                    }}>
                                        ×{item.count}
                                    </span>
                                )}
                            </h3>

                            <p style={{
                                fontSize: 12,
                                color: 'var(--text-muted)',
                                marginTop: 4,
                                lineHeight: 1.55,
                                paddingBottom: 4,
                            }}>
                                {item.subtext}
                                {item.count > 1 && (
                                    <span style={{ marginLeft: 4, opacity: 0.65 }}>
                                        (×{item.count} occurrences)
                                    </span>
                                )}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default FraudIndicatorTimeline;
