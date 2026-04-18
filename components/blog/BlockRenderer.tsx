import { InlineCta } from '@/components/blog/InlineCta'
import type { BlogBlock } from '@/lib/blog/types'

function BlockHeading({ content }: { content: string }) {
  return <h2 style={{ fontSize: 34, color: 'var(--dark)', margin: '30px 0 10px' }}>{content}</h2>
}

function BlockParagraph({ content }: { content: string }) {
  return <p style={{ fontSize: 18, lineHeight: 1.85, color: 'var(--body)', fontWeight: 600 }}>{content}</p>
}

function BlockImage() {
  return null
}

function BlockList({ items, ordered }: { items: string[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag style={{ paddingLeft: 24, color: 'var(--body)', fontSize: 17, lineHeight: 1.8, fontWeight: 600 }}>
      {items.map((item) => (
        <li key={item} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
    </Tag>
  )
}

function BlockCallout({ content, tone = 'note' }: { content: string; tone?: 'info' | 'tip' | 'note' }) {
  const toneStyles = {
    info: { bg: '#E6FAF9', border: '#6ECDC8', label: 'Good to know' },
    tip: { bg: '#FFF8E1', border: '#FFD166', label: 'Parent tip' },
    note: { bg: '#FFF0EF', border: '#FFAAA5', label: 'Note' },
  }[tone]

  return (
    <aside style={{ background: toneStyles.bg, border: `2px solid ${toneStyles.border}`, borderRadius: 16, padding: '16px 18px' }}>
      <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>{toneStyles.label}</p>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--body)', fontWeight: 700 }}>{content}</p>
    </aside>
  )
}

function BlockDivider() {
  return <hr style={{ border: 0, borderTop: '2px dashed var(--border)', margin: '30px 0' }} />
}

export function BlockRenderer({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return <BlockHeading key={index} content={block.content} />
          case 'paragraph':
            return <BlockParagraph key={index} content={block.content} />
          case 'image':
            return <BlockImage key={index} />
          case 'list':
            return <BlockList key={index} items={block.items} ordered={block.ordered} />
          case 'callout':
            return <BlockCallout key={index} content={block.content} tone={block.tone} />
          case 'CTA':
            return (
              <InlineCta
                key={index}
                heading={block.heading}
                content={block.content}
                buttonLabel={block.buttonLabel}
                href={block.href}
              />
            )
          case 'divider':
            return <BlockDivider key={index} />
          default:
            return null
        }
      })}
    </div>
  )
}
