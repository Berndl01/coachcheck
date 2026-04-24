/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  // Ensure font files are included in Vercel serverless function bundles
  outputFileTracingIncludes: {
    '/api/assessment/[id]/report': [
      './node_modules/@expo-google-fonts/fraunces/**/*.ttf',
      './node_modules/@expo-google-fonts/manrope/**/*.ttf',
    ],
  },
};

module.exports = nextConfig;
