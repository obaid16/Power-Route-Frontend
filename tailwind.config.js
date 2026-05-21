/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.jsx', './src/**/*.{js,jsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        volt: {
          navy: '#020617',
          slate: '#0f172a',
          cyan: '#00d4ff',
          mint: '#34d399',
          glow: '#0891b2',
        },
      },
    },
  },
  plugins: [],
};
