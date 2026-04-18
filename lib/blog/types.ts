export type BlogBlock =
  | { type: 'heading'; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'callout'; content: string; tone?: 'info' | 'tip' | 'note' }
  | { type: 'CTA'; heading: string; content: string; buttonLabel: string; href: string }
  | { type: 'divider' }

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  seoDescription: string
  category: string
  date: string
  heroImage: string
  heroImageAlt: string
  seoKeywords: string[]
  blocks: BlogBlock[]
}
