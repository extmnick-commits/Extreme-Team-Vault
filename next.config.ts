import type { NextConfig } from 'next'

function bunnyStreamImagePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    { protocol: 'https', hostname: '*.b-cdn.net', pathname: '/**' },
    { protocol: 'https', hostname: 'thumb.mediadelivery.net', pathname: '/**' },
  ]

  const cdn = process.env.NEXT_PUBLIC_BUNNY_STREAM_CDN_URL?.trim()
  if (cdn) {
    try {
      const { hostname, protocol } = new URL(cdn)
      if (hostname && (protocol === 'https:' || protocol === 'http:')) {
        patterns.unshift({
          protocol: protocol.replace(':', '') as 'https' | 'http',
          hostname,
          pathname: '/**',
        })
      }
    } catch {
      // ignore invalid CDN URL at build time
    }
  }

  return patterns
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: bunnyStreamImagePatterns(),
  },
}

export default nextConfig
