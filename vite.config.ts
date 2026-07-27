import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
      },
      plugins: [
        react(), 
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB to accommodate large sprites/gifs
            globPatterns: ['**/*.{js,css,html,ico,png,svg,gif,webp,mp3,wav}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/(raw\.githubusercontent\.com|api\.dicebear\.com|th\.bing\.com|plus\.unsplash\.com|images\.unsplash\.com)\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'fighter-legend-one-1-assets-v1',
                  expiration: {
                    maxEntries: 2000,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          manifest: {
            name: 'Fighter Legend',
            short_name: 'Fighter Legend',
            description: 'Offline capable game',
            theme_color: '#000000',
            display: 'fullscreen',
            orientation: 'landscape',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
