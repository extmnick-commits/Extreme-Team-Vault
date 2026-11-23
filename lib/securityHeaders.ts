import type { NextResponse } from 'next/server'

function contentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://source.zoom.us https://*.zoom.us",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.b-cdn.net https://*.bunnycdn.com https://thumb.mediadelivery.net https://*.mediadelivery.net https://*.blob.vercel-storage.com https://*.vercel-storage.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.bunnycdn.com https://video.bunnycdn.com https://*.b-cdn.net https://*.zoom.us wss://*.zoom.us https://*.blob.vercel-storage.com",
    "media-src 'self' blob: https://*.b-cdn.net https://*.mediadelivery.net https://*.bunnycdn.com",
    "frame-src 'self' https://*.whereby.com https://zoom.us https://*.zoom.us https://player.mediadelivery.net https://iframe.mediadelivery.net",
    "worker-src 'self' blob: https://cdn.jsdelivr.net",
  ]
  return directives.join('; ')
}

/** HTTP security headers applied to HTML, API, and static responses. */
export function securityHeaderPairs(): { key: string; value: string }[] {
  const pairs: { key: string; value: string }[] = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value:
        'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
  ]

  if (process.env.NODE_ENV === 'production') {
    pairs.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    })
    pairs.push({
      key: 'Content-Security-Policy',
      value: contentSecurityPolicy(),
    })
  }

  return pairs
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const { key, value } of securityHeaderPairs()) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value)
    }
  }
  return response
}