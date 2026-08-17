/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',
          400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',
          800:'#5b21b6',900:'#4c1d95'
        },
        violet: {
          50:'#f5f3ff',100:'#ede9fe',200:'#ddd6fe',300:'#c4b5fd',
          400:'#a78bfa',500:'#8b5cf6',600:'#7c3aed',700:'#6d28d9',
          800:'#5b21b6',900:'#4c1d95',950:'#2e1065'
        },
        zinc: {
          50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',
          400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',
          800:'#27272a',850:'#1e1e21',900:'#18181b',950:'#09090b'
        },
        dark: { 900:'#09090b',800:'#18181b',700:'#27272a',600:'#3f3f46',500:'#52525b' }
      },
      fontFamily: { sans: ['DM Sans','system-ui','sans-serif'], mono: ['JetBrains Mono','monospace'] },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite'
      },
      keyframes: {
        fadeIn: { '0%':{ opacity:'0' },'100%':{ opacity:'1' } },
        slideUp: { '0%':{ opacity:'0',transform:'translateY(10px)' },'100%':{ opacity:'1',transform:'translateY(0)' } }
      },
      boxShadow: {
        'udemy': '0 2px 4px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.08)',
        'udemy-lg': '0 4px 8px rgba(0,0,0,.1), 0 8px 24px rgba(0,0,0,.1)',
        'violet': '0 4px 14px 0 rgba(124,58,237,0.3)',
      }
    }
  },
  plugins: []
}
