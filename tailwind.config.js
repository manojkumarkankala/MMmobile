/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f0ff',
          200: '#bce5ff',
          300: '#8ed6ff',
          400: '#59bdff',
          500: '#329fff',
          600: '#1c80f5',
          700: '#1767e1',
          800: '#1953b6',
          900: '#1a488f',
          950: '#142d57',
        },
        accent: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffc070',
          400: '#ff9a37',
          500: '#ff7d12',
          600: '#f06108',
          700: '#c74908',
          800: '#9e3a0f',
          900: '#7f3110',
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        error: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
          400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
          800: '#991b1b', 900: '#7f1d1d',
        },
        ink: {
          50: '#f7f8fa', 100: '#eef0f4', 200: '#dde1e9', 300: '#c2c8d4',
          400: '#9aa3b4', 500: '#717c91', 600: '#586273', 700: '#464e5c',
          800: '#2f3540', 900: '#1c2129', 950: '#0f1217',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Sora', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(15, 18, 23, 0.08)',
        card: '0 4px 24px -6px rgba(15, 18, 23, 0.10)',
        float: '0 12px 40px -8px rgba(28, 128, 245, 0.25)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'slide-down': 'slideDown 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'shimmer': 'shimmer 1.6s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(16px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: 0, transform: 'translateY(-12px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(0.95)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-800px 0' }, '100%': { backgroundPosition: '800px 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.5)' }, '100%': { boxShadow: '0 0 0 14px rgba(34,197,94,0)' } },
      },
    },
  },
  plugins: [],
};
