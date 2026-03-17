/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // or 'media' if you prefer system-based dark mode
  content: [
    '/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors
        primary: {
          50: '#e6f3ed',
          100: '#cce7db',
          200: '#99cfb7',
          300: '#66b793',
          400: '#339f6f',
          500: '#2b825b', // Your main primary color
          600: '#226849',
          700: '#1a4e37',
          800: '#113424',
          900: '#091a12',
          DEFAULT: '#2b825b', // Default primary color
        },
        // Secondary colors
        secondary: {
          50: '#f5f5f5',
          100: '#e9e9e9',
          200: '#d4d4d4',
          300: '#b8b8b8',
          400: '#9c9c9c',
          500: '#242424', // Your main secondary color
          600: '#1d1d1d',
          700: '#161616',
          800: '#0f0f0f',
          900: '#080808',
          DEFAULT: '#242424', // Default secondary color
        },
        // Additional semantic colors
        success: '#2b825b',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        
        // Background colors
        background: {
          light: '#ffffff',
          dark: '#121212',
        },
        
        // Text colors
        text: {
          light: '#6b6b6b',
          dark: '#141414',
          'dark-mode': '#f5f5f5',
        },
        
        // Border colors
        border: {
          light: '#242424',
          dark: '#474747',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'sidebar': '18rem', // 72 * 0.25rem = 18rem
      },
      boxShadow: {
        'brutal': '2px 2px 0px 0px #242424',
        'brutal-hover': '2px 2px 0px 0px #2b825b',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-in-out',
        'slide-out': 'slideOut 0.3s ease-in-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}