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
                // Aurora Theme Palette
                dark: '#0f172a',
                'deep-navy': '#020617',
                'aurora-bg': '#0B1120',
                'glass-surface': 'rgba(255, 255, 255, 0.05)', // Increased visibility
                'glass-border': 'rgba(255, 255, 255, 0.12)',  // Increased visibility
                'neon-violet': '#818cf8',
                'neon-cyan': '#22d3ee',
            },
            backdropBlur: {
                xs: '2px',
                xl: '20px',
            },
            animation: {
                'aurora': 'aurora 20s linear infinite',
                'float': 'float 8s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
            },
            keyframes: {
                aurora: {
                    '0%': { backgroundPosition: '50% 50%, 50% 50%' },
                    '100%': { backgroundPosition: '350% 50%, 350% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-15px)' },
                },
                shimmer: {
                    'from': { backgroundPosition: '0 0' },
                    'to': { backgroundPosition: '-200% 0' },
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'neon': '0 0 20px rgba(129, 140, 248, 0.3)',
            }
        },
    },
    fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
    },
    plugins: [
        flowbitePlugin,
    ],
}
