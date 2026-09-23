import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/register', '/unsubscribe', '/newsletter/'],
    },
    sitemap: 'https://thekiddle.com/sitemap.xml',
    host: 'https://thekiddle.com',
  }
}
