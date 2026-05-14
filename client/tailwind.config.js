/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        cream: '#F5F0EB',
        warm: {
          50:  '#FAFAF8',
          100: '#F5F0EB',
          200: '#EBE4DA',
          300: '#D9CFBF',
        },
        cyan: {
          soft: '#A8E6E6',
          mid:  '#5CC8C8',
          glow: '#2EC4C4',
        },
        amber: {
          soft: '#FFD59E',
          mid:  '#FFAA44',
        },
        ink: {
          900: '#0D0F12',
          800: '#161A20',
          700: '#1F2630',
        },
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':  { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
