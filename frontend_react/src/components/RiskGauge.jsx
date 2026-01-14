import { motion } from 'framer-motion';

const RiskGauge = ({ score = 0, riskLevel = 'low_risk', size = 200 }) => {
    // Score is 0.0 to 1.0. Map to 0 to 100 for display
    const percentage = Math.min(Math.max(score * 100, 0), 100);

    // Determine color with neon palette
    let color = '#34d399'; // emerald-400
    let glowColor = 'rgba(52, 211, 153, 0.6)';
    let secondaryColor = '#059669';

    if (riskLevel === 'high_risk' || percentage > 75) {
        color = '#f87171'; // red-400
        glowColor = 'rgba(248, 113, 113, 0.6)';
        secondaryColor = '#b91c1c';
    } else if (riskLevel === 'medium_risk' || percentage > 20) {
        color = '#fbbf24'; // amber-400
        glowColor = 'rgba(251, 191, 36, 0.6)';
        secondaryColor = '#d97706';
    }

    const radius = size / 2 - 20;
    const circumference = radius * Math.PI; // We only want a semi-circle path

    // Calculate dash offset for the colored progress
    // We want to fill from LEFT (0%) to RIGHT (100%)
    // The path is drawn clockwise.
    // If we rotate the circle -180deg (or 180deg), we get top arc.
    // Progress 0 -> offset = circumference
    // Progress 100 -> offset = 0
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-4">
            {/* Gauge Container - Explicit dimensions to prevent collapse */}
            <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
                {/* SVG contains the arc */}
                <svg width={size} height={size / 2 + 20} className="overflow-visible">
                    <defs>
                        <linearGradient id={`gaugeGradient-${riskLevel}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={secondaryColor} />
                            <stop offset="100%" stopColor={color} />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Group rotated to form the top arc */}
                    <g transform={`translate(${size / 2}, ${size / 2}) rotate(-180)`}>
                        {/* Background Track */}
                        <circle
                            cx="0"
                            cy="0"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeOpacity="0.1"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeLinecap="round"
                            className="text-slate-200 dark:text-white/10"
                        />

                        {/* Progress Bar */}
                        <motion.circle
                            cx="0"
                            cy="0"
                            r={radius}
                            fill="none"
                            stroke={`url(#gaugeGradient-${riskLevel})`}
                            strokeWidth="12"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }}
                        />
                    </g>
                </svg>

                {/* Value Text - positioned absolutely at the bottom-center of the semi-circle */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 text-center">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="text-4xl font-bold font-mono text-slate-900 dark:text-white tracking-tighter drop-shadow-sm"
                    >
                        {percentage.toFixed(0)}
                    </motion.span>
                </div>
            </div>

            {/* Label - Explicitly separated flow content */}
            <div className={`mt-6 text-sm font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/5 bg-slate-100 dark:bg-white/5 ${riskLevel === 'high_risk' ? 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-500/10' :
                    riskLevel === 'medium_risk' ? 'text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10' :
                        'text-emerald-500 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                }`}>
                {riskLevel.replace(/_/g, ' ')}
            </div>
        </div>
    );
};

export default RiskGauge;
