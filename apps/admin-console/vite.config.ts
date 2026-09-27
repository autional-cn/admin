import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
function normalizeViteBase(p: string | undefined): string {
  if (!p || p === '/') return '/';
  if (p.includes('Program Files')) {
    throw new Error('MSYS2 path corruption detected on BASE_PATH: ' + p + '. Use PowerShell to build.');
  }
  return p.replace(/\/$/, '') + '/';
}

const API_PROXY_TARGET = process.env.VITE_API_PROXY_URL || 'http://localhost:11080';

function buildProxyConfig(): Record<string, any> {
  const proxy: Record<string, any> = {};

  // Pass-through: all service-prefixed paths and bare /api/v1/* go to gateway directly.
  // Gateway handles longest-prefix match routing to the correct upstream service.
  // This matches production behavior exactly (nginx → gateway → upstream).
  const passThroughPrefixes = [
    '/api/v1/',
    '/identity/',
    '/tenant/',
    '/audit/',
    '/billing/api/v1/billing/',
    '/compliance/api/v1/compliance/',
    '/storage/api/v1/storage/',
    '/wallet/api/v1/wallet/',
    '/session/',
    '/mfa/api/v1/mfa/',
    '/notification/',
    '/communication/api/v1/communication/',
    '/point/',
    '/profile/api/v1/profile/',
    '/status/api/v1/status/',
    '/oauth/api/v1/oauth/',
    '/.well-known/',
    '/bff',
    '/developer',
  ];

  for (const prefix of passThroughPrefixes) {
    proxy[prefix] = {
      target: API_PROXY_TARGET,
      changeOrigin: true,
    };
  }

  return proxy;
}

export default defineConfig({
  plugins: [react()],
  base: normalizeViteBase(process.env.BASE_PATH),
  resolve: {
    extensions: ['.mjs', '.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {'@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 13102,
    proxy: buildProxyConfig(),
  },
  preview: {
    port: 13102,
    proxy: buildProxyConfig(),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query'],
          'shared-api': ['@autional-cn/shared'],
        },
      },
    },
  },
});
