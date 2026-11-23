import type { MetadataRoute } from 'next'

/** Team portal is not public — keep crawlers off the entire site. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}