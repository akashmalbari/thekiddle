import Link from 'next/link'
import type { BlogPost } from '@/lib/blog/types'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article
      style={{
        background: 'white',
        border: '2px solid var(--border)',
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <img
          src={post.heroImage}
          alt={post.heroImageAlt}
          style={{ width: '100%', height: 200, objectFit: 'cover', borderBottom: '2px solid var(--border)' }}
        />
      </Link>

      <div style={{ padding: 18 }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-block',
              background: '#E6FAF9',
              color: '#4AADA8',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 0.2,
            }}
          >
            {post.category}
          </span>
        </div>
        <h2 style={{ fontSize: 28, lineHeight: 1.2, marginBottom: 10 }}>
          <Link href={`/blog/${post.slug}`} style={{ color: 'var(--dark)', textDecoration: 'none' }}>
            {post.title}
          </Link>
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--body)', fontWeight: 600, marginBottom: 14 }}>{post.excerpt}</p>
        <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>{formatDate(post.date)}</p>
      </div>
    </article>
  )
}
