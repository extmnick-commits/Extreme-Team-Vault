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

function devAllowedOrigins(): string[] {
  const fromEnv =
    process.env.DEV_ALLOWED_ORIGINS?.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean) ?? []
  return [...new Set(['192.168.1.175', ...fromEnv])]
}

const nextConfig: NextConfig = {
  allowedDevOrigins: devAllowedOrigins(),
  transpilePackages: ['@zoom/meetingsdk'],
  turbopack: {
    resolveAlias: {
      '@zoom/download-manager': './lib/zoom/downloadManagerStub.ts',
    },
  },
  images: {
    remotePatterns: bunnyStreamImagePatterns(),
  },
}

export default nextConfig
