/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Required for Lambda/Docker deployment via Serverless Framework
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Note: Content-Security-Policy is set dynamically in middleware.ts
          // using per-request nonces — no unsafe-inline needed.
        ],
      },
    ];
  },

  env: {
    AWS_REGION: process.env.AWS_REGION || 'me-central-1',
    APP_NAME: 'نهج',
    APP_VERSION: '1.0.0',
  },
};

module.exports = nextConfig;
