/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bga-dark': '#1a1a2e',
        'bga-darker': '#16213e',
        'bga-accent': '#00d4ff',
        'uno-red': '#ef5350',
        'uno-yellow': '#fdd835',
        'uno-blue': '#42a5f5',
        'uno-green': '#66bb6a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'card-slide': 'cardSlide 0.8s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1)',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        cardSlide: {
          '0%': { transform: 'translateX(0) translateY(0)', opacity: 1 },
          '100%': { transform: 'translateX(100px) translateY(-50px)', opacity: 0 },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(0, 212, 255, 0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
