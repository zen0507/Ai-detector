import { motion } from 'framer-motion';

const RiskGauge = ({ score = 0, riskLevel = 'low_risk', size = 300 }) => {
    const percentage = Math.min(Math.max(score, 0), 100);

    // FIX 5: Single consistent arc color per risk level — no gradient edge inconsistency
    let arcColor = '#22c55e';   // emerald — low risk
    if (riskLevel === 'high_risk' || percentage > 75) {
        arcColor = '#e74c3c';   // FIX 5: uniform red
    } else if (riskLevel === 'medium_risk' || percentage > 20) {
        arcColor = '#f59e0b';   // amber
    }

    const radius = size / 2 - 25;
    const center = size / 2;
    
    // Convert 0-100 percentage to 0-180 degrees (clockwise from left)
    const angle = (percentage / 100) * 180;
    const radians = (180 - angle) * (Math.PI / 180);
    
    // Calculate endpoint on the circle
    const endX = center + radius * Math.cos(radians);
    const endY = center - radius * Math.sin(radians);
    
    // Background arc path (180 degrees)
    const bgPath = `M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`;
    
    // Active progress arc path
    const activePath = `M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflow: 'visible' }}>
            <div style={{ position: 'relative', width: size, height: size / 2 + 10, overflow: 'visible' }}>
                <svg width={size} height={size / 2 + 10} style={{ overflow: 'visible' }} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
                    {/* Background Track */}
                    <path
                        d={bgPath}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        strokeOpacity="0.1"
                        strokeLinecap="round"
                        className="text-[var(--text-muted)]"
                    />
                    {/* Active Progress */}
                    <motion.path
                        d={activePath}
                        fill="none"
                        stroke={arcColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>

                {/* Score number centered at bottom of arc */}
                <div style={{
                    position: 'absolute', bottom: 0, left: '50%',
                    transform: 'translateX(-50%) translateY(4px)',
                    textAlign: 'center',
                }}>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        style={{
                            fontSize: '3rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            letterSpacing: '-0.05em',
                            color: 'var(--text-primary)',
                        }}
                    >
                        {percentage.toFixed(0)}
                    </motion.span>
                </div>
            </div>

            {/* FIX 5: Gap between score number & HIGH RISK label = 8px */}
            <div style={{ marginTop: 8, marginBottom: 0 }}>
                <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    padding: '4px 14px',
                    borderRadius: 999,
                    border: `1px solid ${arcColor}`,
                    color: arcColor,
                    background: riskLevel === 'high_risk' ? 'rgba(231,76,60,0.08)'
                              : riskLevel === 'medium_risk' ? 'rgba(245,158,11,0.08)'
                              : 'rgba(34,197,94,0.08)',
                    display: 'inline-block',
                }}>
                    {riskLevel.replace(/_/g, ' ')}
                </div>
            </div>
        </div>
    );
};

export default RiskGauge;
