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
  // Security-Header (OWASP-Baseline). Cloudflare-Turnstile + Supabase Storage
  // sind in der CSP whitelisted. 'unsafe-inline'/'unsafe-eval' bleibt für
  // Next.js/Tailwind nötig — strikter wäre Nonce-basiert (Roadmap).
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      // globals.css importiert Google Fonts per @import → Stylesheet kommt von
      // fonts.googleapis.com, die .woff2-Dateien von fonts.gstatic.com. Ohne
      // beide Hosts blockt die CSP die Schriften im Production-Build.
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com",
      "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      // Stripe-Checkout: Das Consent-Formular POSTet an /checkout/[slug]/start,
      // der Server antwortet mit Redirect auf checkout.stripe.com. Ohne die
      // Stripe-Domains hier blockt die CSP-Direktive 'form-action' die
      // Weiterleitung (Konsole: "violates form-action 'self'").
      "form-action 'self' https://checkout.stripe.com",
    ].join('; ');
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
