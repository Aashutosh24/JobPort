/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#0B1020',
        surface: '#121A2B',
        primary: '#4F7CFF',
        secondary: '#7C5CFF',
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Orange
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #4F7CFF33 0deg, #7C5CFF33 180deg, #4F7CFF33 360deg)',
      },
    },
  },
  plugins: [],
}