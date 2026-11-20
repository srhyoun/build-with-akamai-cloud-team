import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` + `npm start` in another terminal: /api goes to the model server.
// stats.html: the Live Tactics Stats page (db/), its own entry so it doesn't touch the game's main.tsx.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
  build: { rollupOptions: { input: { main: 'index.html', stats: 'stats.html' } } },
});
