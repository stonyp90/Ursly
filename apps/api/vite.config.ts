import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/api',
  plugins: [nxViteTsPaths()],
  build: {
    outDir: '../../dist/apps/api',
    reportCompressedSize: true,
    target: 'node24',
    ssr: true,
    lib: {
      entry: 'src/main.ts',
      formats: ['cjs'],
      fileName: 'main',
    },
    rollupOptions: {
      external: [
        // Node built-ins
        /^node:/,
        'fs',
        'path',
        'http',
        'https',
        'url',
        'stream',
        'zlib',
        'crypto',
        'events',
        'util',
        'buffer',
        'string_decoder',
        'child_process',
        'net',
        'tls',
        'os',
        'querystring',
        'perf_hooks',
        'dns',
        'assert',
        // Production dependencies (will be installed separately)
        /@nestjs\/.*/,
        /@grpc\/.*/,
        'axios',
        'mongoose',
        'keycloak-connect',
        'passport',
        'passport-jwt',
        'rxjs',
        'reflect-metadata',
        'tslib',
        'socket.io',
        'class-validator',
        'class-transformer',
      ],
    },
  },
});

