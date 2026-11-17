import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, requests to /api are forwarded to the C# backend
// (backend/ folder, `func start`). Change the target with BACKEND_URL if it runs elsewhere.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.BACKEND_URL ?? 'http://localhost:8000',
    },
  },
});
