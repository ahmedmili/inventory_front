/** @type {import('next').NextConfig} */

// Log environment variables at build/start time
if (process.env.NODE_ENV === 'development' || process.env.LOG_ENV === 'true') {
  console.log('\n🚀 Next.js Configuration - Environment Variables');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || '❌ Not set'}`);
  console.log(`✅ NEXT_PUBLIC_IMAGES_BASE_URL: ${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '❌ Not set'}`);
  console.log(`ℹ️  NEXT_PUBLIC_WS_URL: ${process.env.NEXT_PUBLIC_WS_URL || 'Not set (optional)'}`);
  console.log(`ℹ️  NEXT_PUBLIC_STORAGE_URL: ${process.env.NEXT_PUBLIC_STORAGE_URL || 'Not set (optional)'}`);
  console.log(`📦 NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn('⚠️  WARNING: NEXT_PUBLIC_API_URL is not set - API calls will fail!\n');
  }
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  output: 'standalone', // Required for Docker
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
  },
  // Note: NEXT_PUBLIC_* variables are automatically exposed by Next.js
  // They are loaded from .env.local, .env.development, .env.production, or .env files
  // No need to define them in the env section below
  // 
  // The env section is only useful for:
  // 1. Non-NEXT_PUBLIC_ variables that need to be exposed to the client (rare)
  // 2. Transforming values before exposing them
  // 3. Providing fallback values (though process.env already handles this)
};

module.exports = nextConfig;

