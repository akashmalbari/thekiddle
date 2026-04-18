import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BlockRenderer } from '@/components/blog/BlockRenderer'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

type Params = {
  slug: string
}

type Props = {
  params: Promise<Params>
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found | The Kiddle Blog',
      description: 'The post you are looking for could not be found.',
    }
  }

  return {
    title: `${post.title} | The Kiddle Blog`,
    description: post.seoDescription,
    keywords: post.seoKeywords,
    openGraph: {
      title: post.title,
      description: post.seoDescription,
      type: 'article',
      url: `https://thekiddle.com/blog/${post.slug}`,
      images: [{ url: post.heroImage, alt: post.heroImageAlt }],
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.seoDescription,
      images: [post.heroImage],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = getAllPosts().filter((candidate) => candidate.slug !== post.slug).slice(0, 2)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription,
    datePublished: post.date,
    dateModified: post.date,
    image: `https://thekiddle.com${post.heroImage}`,
    mainEntityOfPage: `https://thekiddle.com/blog/${post.slug}`,
    author: {
      '@type': 'Organization',
      name: 'The Kiddle',
    },
    publisher: {
      '@type': 'Organization',
      name: 'The Kiddle',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thekiddle.com/icon.svg',
      },
    },
    articleSection: post.category,
    keywords: post.seoKeywords.join(', '),
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <SiteHeader />
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '28px 16px 70px' }}>
        <article>
          <header style={{ marginBottom: 22 }}>
            <p style={{ marginBottom: 8 }}>
              <span
                style={{
                  display: 'inline-block',
                  background: '#E6FAF9',
                  color: '#4AADA8',
                  borderRadius: 999,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {post.category}
              </span>
            </p>
            <h1 style={{ fontSize: 48, lineHeight: 1.12, marginBottom: 8 }}>{post.title}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, fontWeight: 700 }}>{formatDate(post.date)}</p>
          </header>

          <img
            src={post.heroImage}
            alt={post.heroImageAlt}
            style={{ width: '100%', borderRadius: 22, border: '2px solid var(--border)', marginBottom: 24 }}
          />

          <BlockRenderer blocks={post.blocks} />
        </article>

        <section style={{ marginTop: 46 }}>
          <h2 style={{ fontSize: 32, marginBottom: 14 }}>Related posts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                style={{
                  background: 'white',
                  border: '2px solid var(--border)',
                  borderRadius: 14,
                  padding: '14px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>{related.category}</p>
                <h3 style={{ fontSize: 22, color: 'var(--dark)' }}>{related.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  )
}
