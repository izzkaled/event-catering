import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Netlify @netlify/plugin-nextjs handles SSR — do not use output: 'standalone'
  turbopack: {
    root: here,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/login', destination: '/auth/login', permanent: true },
      { source: '/signup', destination: '/auth/signup', permanent: true },
    ]
  },
  async headers() {
    const publicCdn = [
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      {
        key: 'Netlify-CDN-Cache-Control',
        value: 'public, durable, s-maxage=60, stale-while-revalidate=3600',
      },
    ]
    const marketingCdn = [
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      {
        key: 'Netlify-CDN-Cache-Control',
        value: 'public, durable, s-maxage=300, stale-while-revalidate=86400',
      },
    ]
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-src https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      { source: '/', headers: marketingCdn },
      { source: '/faq', headers: marketingCdn },
      { source: '/packages', headers: publicCdn },
      { source: '/experience/find', headers: publicCdn },
      {
        source: '/packages/:slug/preview',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Netlify-CDN-Cache-Control', value: 'private, no-store' },
        ],
      },
      { source: '/packages/:slug', headers: publicCdn },
    ]
  },
}

export default nextConfig
