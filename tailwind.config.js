/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        neonGreen: '#00ff41',
        neonRed: '#ff0033',
        bg: '#000000',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.4)',
      }
    },
  },
  plugins: [],
}
