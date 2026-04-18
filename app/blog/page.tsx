import Link from 'next/link'
import type { Metadata } from 'next'
import { BlogCard } from '@/components/blog/BlogCard'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getAllCategories, getAllPosts } from '@/lib/blog/posts'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata: Metadata = {
  title: 'The Kiddle Blog | Playful Learning Ideas for Ages 3–5',
  description:
    'Browse The Kiddle blog for parent-friendly tips on themed learning, preschool readiness, and joyful at-home activities for children ages 3–5.',
  openGraph: {
    title: 'The Kiddle Blog | Playful Learning Ideas for Ages 3–5',
    description:
      'Parent-friendly guides and ideas to make early learning fun, structured, and screen-free for kids ages 3–5.',
    type: 'website',
    url: 'https://thekiddle.com/blog',
  },
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const params = await searchParams
  const activeCategory = typeof params.category === 'string' ? params.category : 'All'

  const posts = getAllPosts()
  const categories = ['All', ...getAllCategories()]
  const filteredPosts =
    activeCategory === 'All' ? posts : posts.filter((post) => post.category.toLowerCase() === activeCategory.toLowerCase())

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <SiteHeader />

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 16px 70px' }}>
        <section style={{ textAlign: 'center', marginBottom: 26 }}>
          <span
            style={{
              display: 'inline-block',
              background: '#FFF0EF',
              color: '#E07D78',
              borderRadius: 999,
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            The Kiddle Blog
          </span>
          <h1 style={{ fontSize: 46, marginTop: 16, color: 'var(--dark)' }}>Playful Learning for Curious Kids</h1>
          <p style={{ maxWidth: 720, margin: '10px auto 0', fontSize: 18, color: 'var(--body)', lineHeight: 1.75, fontWeight: 600 }}>
            Practical, parent-friendly guides on preschool learning, structured play, and helping ages 3–5 thrive at home.
          </p>
        </section>

        <section aria-label="Filter posts by category" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {categories.map((category) => {
            const isActive = activeCategory.toLowerCase() === category.toLowerCase()
            return (
              <Link
                key={category}
                href={category === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(category)}`}
                style={{
                  borderRadius: 999,
                  padding: '9px 14px',
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: 'none',
                  border: `2px solid ${isActive ? '#FFD166' : 'var(--border)'}`,
                  background: isActive ? '#FFF8E1' : 'white',
                  color: 'var(--body)',
                }}
              >
                {category}
              </Link>
            )
          })}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </section>
      </main>
    </div>
  )
}
