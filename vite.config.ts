import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 5577,
    strictPort: true,
  },
  preview: {
    port: 5577,
    strictPort: true,
    host: '0.0.0.0',
    // Explicit list of public tunnel hostnames + 'all' fallback. The
    // boolean true form is only recognized in newer Vite versions; the
    // string 'all' is the cross-version-safe sentinel.
    allowedHosts: [
      'favourites-quilt-reduces-textile.trycloudflare.com',
      '.trycloudflare.com',
      'all',
    ] as any,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
