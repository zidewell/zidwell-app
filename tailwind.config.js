// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Zidwell semantic tokens as Tailwind utilities (optional)
        'zidwell-ink': '#191919',
        'zidwell-white': '#FFFFFF',
        'zidwell-yellow': '#FDC020',
        'zidwell-green': '#00B64F',
      },
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'be-vietnam': ['Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'pop': '0 20px 35px -8px rgba(0, 0, 0, 0.15), 0 5px 12px -4px rgba(0, 0, 0, 0.1)',
        'ink': '0 2px 4px rgba(25, 25, 25, 0.1)',
      },
      borderRadius: {
        'squircle': '20px',
        'squircle-sm': '16px',
        'squircle-lg': '28px',
        'squircle-xl': '32px',
      },
    },
  },
  plugins: [],
}