import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` + `npm start` in another terminal: /api goes to the model server.
// stats.html (Live Tactics Stats) and quiz.html (pre/post quiz): db/ pages, own entries so they don't touch the game's main.tsx.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
  build: { rollupOptions: { input: { main: 'index.html', stats: 'stats.html', quiz: 'quiz.html' } } },
});
