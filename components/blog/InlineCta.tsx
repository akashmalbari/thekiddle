import Link from 'next/link'

export function InlineCta({
  heading,
  content,
  buttonLabel,
  href,
}: {
  heading: string
  content: string
  buttonLabel: string
  href: string
}) {
  return (
    <aside
      style={{
        background: '#FFF8E1',
        border: '2px solid #FFD166',
        borderRadius: 20,
        padding: '24px',
        margin: '8px 0',
      }}
    >
      <h3 style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{heading}</h3>
      <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--body)', fontWeight: 600, marginBottom: 16 }}>{content}</p>
      <Link
        href={href}
        style={{
          display: 'inline-block',
          background: '#FFD166',
          color: '#1A1208',
          borderRadius: '999px',
          padding: '12px 22px',
          fontWeight: 800,
          fontSize: 15,
          textDecoration: 'none',
          boxShadow: 'var(--shadow-yellow)',
        }}
      >
        {buttonLabel}
      </Link>
    </aside>
  )
}
