import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { mugla: { navy:'#092f4f', blue:'#006cae', cyan:'#00a6c8', orange:'#ef7d00', sand:'#f3f0e9', green:'#6a9d3b' } },
    fontFamily: { sans:['var(--font-sans)','Arial','sans-serif'] },
    boxShadow: { soft:'0 18px 55px rgba(9,47,79,.10)' }
  } },
  plugins: []
} satisfies Config
