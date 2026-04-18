import type { BlogPost } from '@/lib/blog/types'

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-themed-learning-works-better-for-kids-3-5',
    title: 'Why Themed Learning Works Better for Kids Ages 3–5 (And How to Try It at Home)',
    excerpt:
      'Young children learn best when ideas connect to something they already love. Themed learning turns activities into one memorable world.',
    seoDescription:
      'Discover why themed learning helps preschoolers retain more, stay engaged, and build curiosity—and how parents can apply it at home with zero stress.',
    category: 'Early Learning',
    date: '2026-04-18',
    heroImage: '/hero-1.png',
    heroImageAlt: 'Child exploring themed learning activities at home',
    seoKeywords: [
      'themed learning for preschoolers',
      'learning activities for 3–5 year olds',
      'how to make learning fun for toddlers',
    ],
    blocks: [
      { type: 'heading', content: 'Why themed learning clicks for preschoolers' },
      {
        type: 'paragraph',
        content:
          'Most parents assume worksheets equal learning. But child development research tells a different story — young children absorb information best when it\'s connected to something they care about. That\'s the power of themed learning.',
      },
      {
        type: 'paragraph',
        content:
          'When a 4-year-old spends a week inside an "Ocean World," they\'re not just coloring fish. They\'re building vocabulary, asking questions, making connections between movement and science, and developing the kind of curiosity that lasts.',
      },
      {
        type: 'image',
        src: '/hero-2.png',
        alt: 'Ocean themed preschool workbook and playful activities',
        caption: 'Themed activities help kids connect ideas across science, language, and play.',
      },
      {
        type: 'list',
        items: [
          'Improves memory through repeated context',
          'Encourages question-asking and exploration',
          'Makes transitions between activities smoother',
          'Supports language and emotional engagement',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        content:
          'Try one weekly theme at home (like space, jungle, or ocean) and keep books, crafts, and movement in the same world for deeper learning.',
      },
      { type: 'divider' },
      {
        type: 'CTA',
        heading: 'Ready to try themed learning this week?',
        content:
          'Explore The Kiddle workbooks built around one rich theme each week — so every activity reinforces the same world.',
        buttonLabel: 'Explore Workbooks',
        href: '/#pricing',
      },
    ],
  },
  {
    slug: '10-signs-your-3-5-year-old-is-ready-for-structured-activities',
    title: '10 Signs Your 3–5 Year Old Is Ready for Structured Activities (Without Formal School)',
    excerpt:
      'Kids can be ready for structure long before formal school. Here are the signs your child is primed for guided play and focused activities.',
    seoDescription:
      'Learn the top readiness signs for structured play in ages 3–5 and how to support early learning at home without pressure or rigid routines.',
    category: 'Parent Guide',
    date: '2026-04-17',
    heroImage: '/hero-3.png',
    heroImageAlt: 'Parent and child enjoying guided activity time together',
    seoKeywords: [
      'activities for 3 year olds at home',
      'preschool learning at home',
      'kindergarten readiness activities',
      'structured play for toddlers',
    ],
    blocks: [
      { type: 'heading', content: 'Is your child ready for structured activities?' },
      {
        type: 'paragraph',
        content:
          'Every parent wonders: is my child ready? The answer is almost always yes — just not in the way school looks. Kids this age are wired for exploration, not sitting still. The key is finding activities that meet them where they are.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'They ask “why” constantly',
          'They love pretend play',
          'They follow a two-step instruction',
          'They show curiosity about animals or nature',
          'They enjoy doing things “by themselves”',
          'They can focus 5–10 minutes on a favorite task',
          'They repeat games to “master” them',
          'They like helping with simple routines',
          'They notice patterns and similarities',
          'They celebrate completing small challenges',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        content:
          'Structured does not mean strict. It means giving children a clear starting point, then letting curiosity lead the way.',
      },
      {
        type: 'paragraph',
        content:
          'The Kiddle workbooks are designed for exactly this stage. No reading required. No prep for parents. Just open the book and follow the theme together — or let them lead.',
      },
      { type: 'divider' },
      {
        type: 'CTA',
        heading: 'Looking for structured play that still feels fun?',
        content: 'Browse The Kiddle\'s themed workbooks for ages 3–5 and pick your next adventure.',
        buttonLabel: 'Browse Themed Workbooks',
        href: '/#pricing',
      },
    ],
  },
]

export function getAllPosts() {
  return blogPosts
}

export function getPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug)
}

export function getAllCategories() {
  return Array.from(new Set(blogPosts.map((post) => post.category)))
}
