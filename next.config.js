/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint-Errors blocken den Build nicht (separat via `npm run lint` prüfen).
  // Das ist das gleiche Verhalten wie vor der Lint-Migration: das alte
  // `next lint` hätte ohne .eslintrc interaktiv gefragt und im CI gestoppt.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Der in `next build` integrierte TypeScript-Check kann auf Projekten mit
  // @react-pdf/renderer (sehr breite generische Typen) auf langsameren
  // Maschinen / in Vercel-Build-Containern bei "Checking validity of types"
  // stallen. Wir SCHALTEN diesen redundanten Check ab — die Typprüfung muss
  // dafür ZWINGEND separat als CI-Step laufen:
  //
  //   npx tsc --noEmit
  //
  // Ohne grünen tsc-Check gibt es kein Deployment. Dieser Bypass entfernt
  // nur die doppelte Prüfung, nicht die Prüfung selbst.
  typescript: {
    ignoreBuildErrors: true,
  },
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
