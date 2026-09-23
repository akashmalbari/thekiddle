import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog/posts'

const baseUrl = 'https://thekiddle.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: '2026-09-23', changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: '2026-09-23', changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/faq`, lastModified: '2026-03-26', changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy-policy`, lastModified: '2026-03-26', changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms-of-service`, lastModified: '2026-03-26', changeFrequency: 'yearly', priority: 0.2 },
  ]

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages]
}
