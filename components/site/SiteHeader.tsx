'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/site/Logo'

type NavItem = { label: string; href: string }

const navItems: NavItem[] = [
  { label: 'What We Offer', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
]

export function SiteHeader() {
  const [mobileMenu, setMobileMenu] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1200)

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const isMobile = viewportWidth < 768

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        padding: isMobile ? '12px 16px' : '0 40px',
        minHeight: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,253,246,0.96)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
        transition: 'all 0.3s',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? 12 : 0,
      }}
    >
      <Link href="/" style={{ textDecoration: 'none' }} aria-label="Go to homepage">
        <Logo size="sm" />
      </Link>

      {!isMobile && (
        <div style={{ display: 'flex', gap: 28, fontSize: 15, fontWeight: 700, color: 'var(--body)' }}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{ color: 'var(--body)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFD166')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--body)')}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {isMobile && (
        <button
          onClick={() => setMobileMenu((open) => !open)}
          style={{
            border: '2px solid var(--border)',
            background: 'white',
            borderRadius: 14,
            padding: '10px 14px',
            fontFamily: "'Nunito',sans-serif",
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--body)',
            cursor: 'pointer',
          }}
        >
          {mobileMenu ? 'Close' : 'Menu'}
        </button>
      )}

      {isMobile && mobileMenu && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0 4px' }}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenu(false)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                background: 'white',
                borderRadius: 14,
                padding: '14px 16px',
                fontFamily: "'Nunito',sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--body)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
