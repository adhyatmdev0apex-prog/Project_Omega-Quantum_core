/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core cyberdeck palette
        ink: {
          950: '#04060a',
          900: '#070b12',
          850: '#0a0f18',
          800: '#0d1320',
          750: '#111827',
          700: '#1a2233',
        },
        neon: {
          // primary neon green
          DEFAULT: '#39ff14',
          50: '#e8ffe2',
          100: '#c9ffb8',
          200: '#9bff7d',
          300: '#6dff4a',
          400: '#39ff14',
          500: '#2bd60f',
          600: '#22b30c',
          700: '#1a8a09',
          800: '#125f06',
          900: '#0a3a04',
        },
        cyan: {
          // accent cyan
          DEFAULT: '#00f0ff',
          50: '#d6ffff',
          100: '#a8feff',
          200: '#6bf6ff',
          300: '#2ceaff',
          400: '#00f0ff',
          500: '#00c4d2',
          600: '#009aa6',
          700: '#007079',
          800: '#00474c',
          900: '#002326',
        },
        warn: {
          DEFAULT: '#ffb020',
          400: '#ffc24d',
          500: '#ffb020',
          600: '#e0920a',
        },
        err: {
          DEFAULT: '#ff3b5c',
          400: '#ff6b85',
          500: '#ff3b5c',
          600: '#d61f3e',
        },
        ok: {
          DEFAULT: '#39ff14',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(57,255,20,0.18), 0 0 24px -6px rgba(57,255,20,0.35)',
        'glow-cyan': '0 0 0 1px rgba(0,240,255,0.18), 0 0 24px -6px rgba(0,240,255,0.35)',
        'glow-soft': '0 0 40px -12px rgba(57,255,20,0.25)',
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 40px -16px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(57,255,20,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.045) 1px, transparent 1px)',
        'radial-fade':
          'radial-gradient(1200px 600px at 50% -10%, rgba(0,240,255,0.08), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(57,255,20,0.06), transparent 60%)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(57,255,20,0.0)' },
          '50%': { boxShadow: '0 0 24px -4px rgba(57,255,20,0.45)' },
        },
        blink: {
          '0%,49%': { opacity: '1' },
          '50%,100%': { opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'grid-pan': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '44px 44px' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.6s ease-out both',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        blink: 'blink 1.1s steps(1) infinite',
        scan: 'scan 6s linear infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        'grid-pan': 'grid-pan 18s linear infinite',
      },
    },
  },
  plugins: [],
};
