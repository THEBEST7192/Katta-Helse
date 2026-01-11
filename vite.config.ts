import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Konfigurasjon for Vite: https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.PORT || '8001'),
    },
  };
})
