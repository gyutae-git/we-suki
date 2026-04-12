/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Make sure these colors are always included
    'bg-stone-50',
    'bg-stone-100',
    'text-stone-900',
    'text-rose-900',
    'bg-rose-900',
    'border-stone-200',
  ],
  theme: {
    extend: {
      colors: {
        brand: '#A50034',
        'brand-dark': '#7e0026',
        surface: '#F7F4F0',
        'surface-2': '#EDEBE7',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 2px 6px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        'btn-brand': '0 4px 14px rgba(165,0,52,0.25)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
