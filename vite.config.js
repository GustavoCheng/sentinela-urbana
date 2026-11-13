import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: o build funciona em qualquer pasta (GitHub Pages, Vercel, Netlify).
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
