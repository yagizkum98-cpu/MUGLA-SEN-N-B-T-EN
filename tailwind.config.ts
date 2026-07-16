import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { mugla: { navy:'#0E3A66', blue:'#0B6FAE', cyan:'#00A6C8', orange:'#EF7D00', sand:'#F3F0E9', green:'#6A9D3B' } },
    fontFamily: { sans:['var(--font-sans)','Arial','sans-serif'] },
    boxShadow: { soft:'0 18px 55px rgba(14,58,102,.10)' }
  } },
  plugins: []
} satisfies Config
