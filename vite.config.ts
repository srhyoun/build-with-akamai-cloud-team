import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` + `npm start` in another terminal: /api goes to the model server.
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': 'http://localhost:8787' } } });
