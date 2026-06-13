/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1B3A5C', light: '#2D5A8E', dark: '#0F2440' },
        accent: { DEFAULT: '#C8960C', light: '#F0B429', dark: '#9A7200' },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#0284C7',
        surface: { DEFAULT: '#FFFFFF', '2': '#F1F5F9' },
        border: '#E2E8F0',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-muted': '#94A3B8',
      },
    },
  },
  plugins: [],
};
