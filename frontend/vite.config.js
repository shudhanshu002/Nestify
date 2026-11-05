import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'CLIENT_ID_'],
    define: {
      'import.meta.env.CLIENT_ID_GOOGLE': JSON.stringify(
        env.CLIENT_ID_GOOGLE || env.VITE_GOOGLE_CLIENT_ID || process.env.CLIENT_ID_GOOGLE || ''
      ),
    },
  };
});
