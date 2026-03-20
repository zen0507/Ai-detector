// Falsum brand colors merged into tailwind config
import flowbitePlugin from "flowbite/plugin";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "node_modules/flowbite-react/dist/esm/**/*.js",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Falsum Brand
                'falsum-bg': '#0D0D14',
                'falsum-card': '#1a1a2e',
                'falsum-purple': '#534AB7',
                'falsum-violet': '#7F77DD',
                'falsum-real': '#3B6D11',
                'falsum-suspicious': '#BA7517',
                'falsum-fake': '#A32D2D',
                // Legacy
                dark: '#0D0D14',
                'deep-navy': '#080810',
                'aurora-bg': '#0D0D14',
                'glass-surface': 'rgba(26, 26, 46, 0.6)',
                'glass-border': 'rgba(83, 74, 183, 0.2)',
                'neon-violet': '#7F77DD',
                'neon-cyan': '#534AB7',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Courier New', 'monospace'],
            },
            animation: {
                'float': 'float 8s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'scan': 'scanLine 3s linear infinite',
                'grid-pulse': 'gridPulse 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                scanLine: {
                    '0%': { top: '-2px' },
                    '100%': { top: '102%' },
                },
                gridPulse: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                },
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(83, 74, 183, 0.15)',
                'neon': '0 0 20px rgba(83, 74, 183, 0.3)',
                'neon-violet': '0 0 30px rgba(127, 119, 221, 0.2)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
            },
        },
    },
    plugins: [
        flowbitePlugin,
    ],
}
