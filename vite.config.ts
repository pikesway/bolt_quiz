import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'lucide-react',
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
      '@radix-ui/react-tabs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-slot'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  server: {
    historyApiFallback: true,
    hmr: {
      overlay: false
    }
  },
  base: '/',
  build: {
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/]
    }
  }
});
