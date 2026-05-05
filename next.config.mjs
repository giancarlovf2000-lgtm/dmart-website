/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    // Allow embedding in SiteForge only. Update SITEFORGE_ORIGIN if the domain changes.
    const SITEFORGE_ORIGIN = process.env.SITEFORGE_ORIGIN ?? 'https://siteforge-dmart.vercel.app'
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // frame-ancestors replaces X-Frame-Options in modern browsers
            key: 'Content-Security-Policy',
            value: `frame-ancestors 'self' ${SITEFORGE_ORIGIN} https://*.vercel.app http://localhost:3000 http://localhost:3001`,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
