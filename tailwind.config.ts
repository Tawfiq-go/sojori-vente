import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--gold)',
          dark: 'var(--goldD)',
          light: 'var(--goldS)',
        },
        ai: {
          DEFAULT: 'var(--ai)',
          dark: 'var(--aiD)',
        },
        surface: {
          1: 'var(--card)',
          2: 'var(--paper2)',
          3: 'var(--b)',
          4: 'var(--bs)',
        },
        text: {
          1: 'var(--ink)',
          2: 'var(--ink2)',
          3: 'var(--ink3)',
        },
        border: 'var(--b)',
      },
      fontFamily: {
        sans: ['var(--sans)'],
        serif: ['var(--serif)'],
        mono: ['var(--mono)'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      transitionDuration: {
        base: '250ms',
        fast: '150ms',
        slow: '350ms',
      },
      animation: {
        fadeIn: 'fadeIn 250ms ease-out',
        slideUp: 'slideUp 250ms ease-out',
        pulseGold: 'pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        pulseAI: 'pulseAI 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
