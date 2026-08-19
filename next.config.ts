import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const nextConfig: NextConfig = {
  turbopack: {},   // ✅ silences the Turbopack warning
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 1080, 1200, 1920],
    imageSizes: [48, 64, 80, 110, 200, 400],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    unoptimized: false,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/**' },
      { protocol: 'https', hostname: 'infinitech-api14.site', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },

  async rewrites() {
    return [
      { source: '/img-proxy/:path*', destination: 'http://localhost:8000/:path*' },
    ];
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  // skipWaiting: true,
    disable: false, // ← enables PWA in dev too
})(nextConfig);