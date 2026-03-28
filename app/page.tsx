'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type PricingData = {
  countryCode: string
  countryName: string
  currencyCode: string
  monthlyDisplay: string
  yearlyDisplay: string
}

/* ── LOGO ──────────────────────────────────────────────── */
function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: { the: 12, main: 24, pencil: 9 }, md: { the: 15, main: 32, pencil: 12 }, lg: { the: 20, main: 48, pencil: 18 } }[size]
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, userSelect: 'none', textDecoration: 'none' }}>
      <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: s.the, fontWeight: 800, color: '#FFAAA5', lineHeight: 1, marginBottom: -2 }}>The</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: s.main, fontWeight: 800, color: '#FFD166', lineHeight: 1, letterSpacing: '-0.03em' }}>K</span>
        <svg width={s.pencil} height={s.main * 0.88} viewBox="0 0 20 48" style={{ margin: `0 ${s.main * 0.025}px`, flexShrink: 0 }}>
          <rect x="5" y="0" width="10" height="7" rx="3.5" fill="#6ECDC8" />
          <rect x="5" y="7" width="10" height="31" rx="2" fill="#FFAAA5" />
          <polygon points="5,38 15,38 10,48" fill="#FFD166" />
        </svg>
        <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: s.main, fontWeight: 800, color: '#FFD166', lineHeight: 1, letterSpacing: '-0.03em' }}>ddle</span>
      </div>
    </div>
  )
}

/* ── SHARED BUTTON ──────────────────────────────────────── */
function YellowBtn({ children, onClick, style }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#FFD166', color: '#1A1208', border: 'none', borderRadius: 'var(--r-full)', padding: '14px 32px', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: hov ? '0 8px 28px rgba(255,209,102,0.55)' : 'var(--shadow-yellow)', transform: hov ? 'translateY(-2px)' : 'none', transition: 'all 0.2s', ...style }}>
      {children}
    </button>
  )
}

/* ── SECTION TAG ─────────────────────────────────────────── */
function Tag({ children, color = 'yellow' }: { children: React.ReactNode; color?: 'yellow' | 'pink' | 'teal' }) {
  const palettes = { yellow: { bg: '#FFF8E1', color: '#BF8C00' }, pink: { bg: '#FFF0EF', color: '#E07D78' }, teal: { bg: '#E6FAF9', color: '#4AADA8' } }
  const p = palettes[color]
  return (
    <span style={{ display: 'inline-block', background: p.bg, color: p.color, borderRadius: 'var(--r-full)', padding: '5px 16px', fontSize: 13, fontWeight: 800, letterSpacing: 0.3 }}>
      {children}
    </span>
  )
}

/* ── EMAIL CAPTURE ───────────────────────────────────────── */
function EmailCapture({ onSuccess }: { onSuccess?: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email || !email.includes('@')) { setError('Please enter a valid email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Something went wrong') }
      setDone(true)
      onSuccess?.(email)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  if (done) return (
    <div style={{ background: '#E6FAF9', border: '2px solid #6ECDC8', borderRadius: 'var(--r-lg)', padding: '18px 24px', textAlign: 'center' }} className="pop-in">
      <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: '#2C2016' }}>You&apos;re in! Check your inbox for a sample Kiddle.</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, background: 'white', borderRadius: 'var(--r-full)', padding: '6px 6px 6px 20px', boxShadow: 'var(--shadow-md)', border: '2px solid var(--border)', flexWrap: 'wrap' }}>
        <input value={email} onChange={e => { setEmail(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter your email address"
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--dark)', background: 'transparent', minWidth: 180 }} />
        <YellowBtn onClick={submit} style={{ borderRadius: 'var(--r-full)', padding: '11px 28px', fontSize: 15 }}>
          {loading ? '⏳' : 'Get a Sample Kiddle For Free →'}
        </YellowBtn>
      </div>
      {error && <p style={{ color: '#E07D78', fontSize: 13, fontWeight: 700, marginTop: 8, paddingLeft: 8 }}>⚠️ {error}</p>}
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!name.trim() || !email.includes('@') || !message.trim()) {
      setError('Please fill name, valid email, and message.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Unable to submit right now.')
      }

      setDone(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ background: '#E6FAF9', border: '2px solid #6ECDC8', borderRadius: 16, padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#2C2016' }}>
        ✅ Thanks! We received your query and will get back to you soon.
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: 12,
    border: '2px solid var(--border)',
    padding: '11px 12px',
    fontFamily: "'Nunito',sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--dark)',
    background: 'white',
    outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input style={inputStyle} placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} />
      <input style={inputStyle} type="email" placeholder="Your email *" value={email} onChange={e => setEmail(e.target.value)} />
      <input style={inputStyle} placeholder="Subject (optional)" value={subject} onChange={e => setSubject(e.target.value)} />
      <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Your message *" value={message} onChange={e => setMessage(e.target.value)} />
      {error && <div style={{ color: '#E07D78', fontSize: 13, fontWeight: 700 }}>⚠️ {error}</div>}
      <button onClick={submit} disabled={loading} style={{ border: 'none', borderRadius: 999, background: '#FFD166', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 14, padding: '11px 16px', cursor: loading ? 'wait' : 'pointer' }}>
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(1200)
  const [pricing, setPricing] = useState<PricingData>({
    countryCode: 'US',
    countryName: 'United States',
    currencyCode: 'USD',
    monthlyDisplay: '$1.99',
    yearlyDisplay: '$21.99',
  })

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const res = await fetch('/api/pricing')
        if (!res.ok) return
        const data = await res.json()
        setPricing({
          countryCode: data.countryCode,
          countryName: data.countryName,
          currencyCode: data.currencyCode,
          monthlyDisplay: data.monthlyDisplay,
          yearlyDisplay: data.yearlyDisplay,
        })
      } catch {
        // keep USD fallback
      }
    }

    loadPricing()
  }, [])

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false) }
  const isMobile = viewportWidth < 768
  const isTablet = viewportWidth < 1024

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', overflowX: 'hidden' }}>

      {/* ══ NAV ══════════════════════════════════════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: isMobile ? '12px 16px' : '0 40px', minHeight: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled || mobileMenu ? 'rgba(255,253,246,0.96)' : 'transparent', backdropFilter: scrolled || mobileMenu ? 'blur(14px)' : 'none', borderBottom: scrolled || mobileMenu ? '1px solid var(--border)' : 'none', transition: 'all 0.3s', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? 12 : 0 }}>
        <Logo size="sm" />
        {!isMobile && <div style={{ display: 'flex', gap: 28, fontSize: 15, fontWeight: 700, color: 'var(--body)' }}>
          {[['Features','features'],['How It Works','how-it-works'],['Pricing','pricing']].map(([label, id]) => (
            <span key={id} onClick={() => scrollTo(id)} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFD166'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--body)'}>{label}</span>
          ))}
        </div>}
        {isMobile ? (
          <button
            onClick={() => setMobileMenu(open => !open)}
            style={{ border: '2px solid var(--border)', background: 'white', borderRadius: 14, padding: '10px 14px', fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 800, color: 'var(--body)', cursor: 'pointer' }}
          >
            {mobileMenu ? 'Close' : 'Menu'}
          </button>
        ) : (
          <YellowBtn onClick={() => scrollTo('pricing')} style={{ padding: '10px 22px', fontSize: 14 }}>Get Started</YellowBtn>
        )}
        {isMobile && mobileMenu && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0 4px' }}>
            {[['Features','features'],['How It Works','how-it-works'],['Pricing','pricing']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'white', borderRadius: 14, padding: '14px 16px', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--body)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
              >
                {label}
              </button>
            ))}
            <YellowBtn onClick={() => scrollTo('pricing')} style={{ width: '100%', padding: '14px 18px', fontSize: 15 }}>Get Started</YellowBtn>
          </div>
        )}
      </nav>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '120px 16px 48px' : isTablet ? '110px 24px 56px' : '100px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Soft background blobs */}
        <div style={{ position: 'absolute', top: '5%', right: isMobile ? '-25%' : '5%', width: isMobile ? 260 : 480, height: isMobile ? 260 : 480, borderRadius: '50%', background: 'radial-gradient(circle, #FFF8E1 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: isMobile ? '-20%' : '-5%', width: isMobile ? 220 : 360, height: isMobile ? 220 : 360, borderRadius: '50%', background: 'radial-gradient(circle, #FFF0EF 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Floating craft doodles */}
        {!isMobile && [
          { emoji: '✂️', top: '14%', left: '4%', cls: 'float' },
          { emoji: '🖍️', top: '20%', right: '4%', cls: 'float-delay1' },
          { emoji: '🎨', bottom: '28%', left: '3%', cls: 'float-delay2' },
          { emoji: '📌', top: '60%', right: '3%', cls: 'float-delay3' },
          { emoji: '🌟', top: '10%', left: '30%', cls: 'wiggle' },
        ].map((b, i) => (
          <div key={i} className={b.cls} style={{ position: 'absolute', top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: 52, height: 52, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: 'var(--shadow-sm)', border: '2px solid var(--border)' }}>
            {b.emoji}
          </div>
        ))}

        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: isMobile ? 36 : 64, alignItems: 'center', width: '100%' }}>
          {/* Left */}
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <div style={{ marginBottom: 24 }}><Tag color="pink">Ages 3–5 · Screen-Free</Tag></div>
            <h1 style={{ fontSize: isMobile ? 36 : isTablet ? 44 : 54, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.12, marginBottom: 22 }}>
              Let&apos;s Make Learning &amp; Playing{' '}
              <span style={{ color: '#FFD166', position: 'relative', display: 'inline-block' }}>
                Fun Without Screens
                <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} viewBox="0 0 300 10" preserveAspectRatio="none">
                  <path d="M0,7 Q75,0 150,7 Q225,14 300,7" stroke="#FFAAA5" strokeWidth="3" fill="none" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 18, color: 'var(--body)', lineHeight: 1.75, marginBottom: 36, fontWeight: 600, maxWidth: 480, marginInline: isMobile ? 'auto' : undefined }}>
              Weekly activity-packed newsletters for kids aged 3–5. Creative, educational, and 100% screen-free!
            </p>
            <div style={{ marginBottom: 20, maxWidth: 500, marginInline: isMobile ? 'auto' : undefined }}>
              <EmailCapture />
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>
              Join 2,000+ parents giving their kids screen-free fun
            </p>
          </div>

          {/* Right — illustrated card stack */}
          <div style={{ position: 'relative', height: isMobile ? 320 : 460, display: 'flex', alignItems: 'center', justifyContent: 'center', order: isTablet ? -1 : 0 }}>
            {/* Main photo card */}
            <div style={{ width: isMobile ? '100%' : 360, maxWidth: 360, height: isMobile ? 250 : 300, borderRadius: 28, overflow: 'hidden', boxShadow: '0 20px 60px rgba(26,18,8,0.15)', position: 'relative', zIndex: 2 }} className="float-sm">
              {/* Illustrated placeholder — real photo would go here */}
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF0EF 50%, #E6FAF9 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontSize: 64 }}>🎨</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--body)', fontFamily: "'Baloo 2',cursive" }}>This week&apos;s activity</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Rainbow Tissue Paper Collage</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {['✂️','🖌️','📄','🌈'].map((e, i) => <span key={i} style={{ fontSize: 22 }}>{e}</span>)}
                </div>
              </div>
            </div>
            {/* Stat bubble */}
            <div style={{ position: 'absolute', bottom: isMobile ? 24 : 80, left: isMobile ? 0 : 10, background: 'white', borderRadius: 18, padding: isMobile ? '12px 16px' : '14px 20px', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 3 }} className="float-delay1">
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FFD166', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', lineHeight: 1, fontFamily: "'Baloo 2',cursive" }}>150+</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Activities</div>
              </div>
            </div>
            {/* Screen-free badge */}
            <div style={{ position: 'absolute', top: isMobile ? 14 : 60, right: 10, background: '#E6FAF9', border: '2px solid #6ECDC8', borderRadius: 16, padding: isMobile ? '8px 12px' : '10px 16px', zIndex: 3, textAlign: 'center' }} className="float-delay2">
              <div style={{ fontSize: 22 }}>📵</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4AADA8', marginTop: 4 }}>100% Screen<br />Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════ */}
      <section id="features" style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag color="teal">What We Offer</Tag>
            <h2 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, color: 'var(--dark)', marginTop: 16, marginBottom: 14 }}>Everything Your Child Needs to Thrive</h2>
            <p style={{ fontSize: isMobile ? 15 : 17, color: 'var(--body)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontWeight: 600 }}>
              Carefully curated activities that engage, educate, and entertain — all without a single screen.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { emoji: '🎨', title: 'Creative Activities', desc: 'Hands-on arts, crafts, and creative projects that spark imagination and develop fine motor skills.', color: '#FFD166', pale: '#FFF8E1' },
              { emoji: '📚', title: 'Educational Fun', desc: 'Learning through play with activities designed by early childhood educators for ages 3–5.', color: '#FFAAA5', pale: '#FFF0EF' },
              { emoji: '🏃', title: 'Active Play', desc: 'Movement-based games and activities that get kids moving, grooving, and developing gross motor skills.', color: '#6ECDC8', pale: '#E6FAF9' },
              { emoji: '✂️', title: 'Simple to Set Up', desc: 'Every activity uses materials you already have at home. No shopping trips required.', color: '#FFD166', pale: '#FFF8E1' },
              { emoji: '🧠', title: 'Expert Designed', desc: 'Activities are crafted by early childhood specialists who know exactly what kids this age need.', color: '#FFAAA5', pale: '#FFF0EF' },
              { emoji: '📮', title: 'Weekly Delivery', desc: 'Fresh activities arrive in your inbox every week — always new, always exciting, always offline.', color: '#6ECDC8', pale: '#E6FAF9' },
            ].map((f, i) => (
              <div key={i} style={{ background: f.pale, borderRadius: 22, padding: '28px', border: `2px solid ${f.color}30`, transition: 'transform 0.22s, box-shadow 0.22s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 36px ${f.color}40` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 18 }}>
                  {f.emoji}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.7, fontWeight: 600 }}>{f.desc}</p>
              </div>
            ))}
          </div>
          {/* Stats bar */}
          <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {[['12+','Activities/Month'],['100%','Screen-Free'],['Expert','Designed'],['Ages','3–5 Years']].map(([val, lbl], i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#FFD166', fontFamily: "'Baloo 2',cursive" }}>{val}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'var(--cream-warm)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag color="pink">Simple Process</Tag>
            <h2 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, color: 'var(--dark)', marginTop: 16, marginBottom: 14 }}>How Kiddle Works</h2>
            <p style={{ fontSize: isMobile ? 15 : 17, color: 'var(--body)', fontWeight: 600 }}>Getting started is easy! Three simple steps to transform playtime.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { n: '1', emoji: '📧', title: 'Subscribe', desc: 'Choose your plan, drop in your email, and you\'re part of the Kiddle family. Takes 30 seconds.', color: '#FFD166' },
              { n: '2', emoji: '📬', title: 'Receive Weekly', desc: 'Every week, a fresh newsletter lands in your inbox packed with 3+ screen-free activities for your little one.', color: '#FFAAA5' },
              { n: '3', emoji: '🌟', title: 'Play & Learn', desc: 'Print or follow along as your child explores, creates, and grows — without a screen in sight!', color: '#6ECDC8' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: isMobile ? 'center' : 'flex-start', textAlign: isMobile ? 'center' : 'left', background: 'white', borderRadius: 22, padding: isMobile ? '24px 20px' : '28px 32px', border: '2px solid var(--border)', transition: 'border-color 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color; (e.currentTarget as HTMLElement).style.transform = 'translateX(6px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateX(0)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: s.color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px ${s.color}55` }}>
                  <div style={{ fontSize: 24 }}>{s.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(26,18,8,0.5)', marginTop: 2 }}>Step {s.n}</div>
                </div>
                <div>
                  <h3 style={{ fontSize: 21, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.7, fontWeight: 600 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ══ PRICING ════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: isMobile ? '64px 16px' : isTablet ? '72px 24px' : '88px 40px', background: 'var(--cream)', borderTop: '2px solid var(--border)', borderBottom: '2px solid var(--border)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag color="yellow">Simple Pricing</Tag>
            <h2 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, color: 'var(--dark)', marginTop: 16, marginBottom: 14 }}>Choose Your Plan</h2>
            <p style={{ fontSize: isMobile ? 15 : 17, color: 'var(--body)', fontWeight: 600 }}>Flexible options for every family. Cancel anytime, no questions asked.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24 }}>
            {/* Monthly */}
            <div style={{ background: 'white', borderRadius: 28, padding: '36px', border: '2px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Monthly Explorer</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: 48, fontWeight: 800, color: 'var(--dark)' }}>{pricing.monthlyDisplay}</span>
                <span style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 700 }}>/month</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 28 }}>Perfect for trying it out</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {['4 weekly newsletters', '12+ activities per month', 'Printable activity sheets', 'Parent guidance tips', 'Cancel anytime'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: 'var(--body)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/register?plan=monthly" style={{ display: 'block', textAlign: 'center', background: 'var(--border)', color: 'var(--body)', borderRadius: 'var(--r-full)', padding: '14px', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, textDecoration: 'none', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#E6E0D0'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--border)'}>
                Subscribe Now
              </Link>
            </div>
            {/* Yearly — featured */}
            <div style={{ background: 'white', borderRadius: 28, padding: '36px', border: '3px solid #FFD166', boxShadow: 'var(--shadow-yellow)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#FFD166', color: '#1A1208', borderRadius: 'var(--r-full)', padding: '5px 18px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                ⭐ Most Popular
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Yearly Adventurer</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: 48, fontWeight: 800, color: 'var(--dark)' }}>{pricing.yearlyDisplay}</span>
                <span style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 700 }}>/year</span>
              </div>
              <div style={{ display: 'inline-block', background: '#E6FAF9', color: '#4AADA8', borderRadius: 'var(--r-full)', padding: '3px 12px', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>1 Month Free</div>
              <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 28 }}>Best value for dedicated families</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {['52 weekly newsletters', '150+ activities per year', 'Printable activity sheets', 'Parent guidance tips', 'Exclusive seasonal activities', 'Priority email support'].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: 'var(--body)' }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: '#E6B84A' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/register?plan=yearly" style={{ display: 'block', textAlign: 'center', background: '#FFD166', color: '#1A1208', borderRadius: 'var(--r-full)', padding: '14px', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: 'var(--shadow-yellow)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(255,209,102,0.55)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-yellow)' }}>
                Subscribe Now
              </Link>
            </div>
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)', fontWeight: 700 }}>
            Pricing shown for {pricing.countryName} ({pricing.currencyCode}). Questions?{' '}
            <a href="mailto:hello@thekiddle.com" style={{ color: '#FFAAA5', textDecoration: 'none', fontWeight: 800 }}>Contact us</a>
          </p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════ */}
      <section style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Tag color="pink">Testimonials</Tag>
            <h2 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, color: 'var(--dark)', marginTop: 16 }}>Loved By Parents Everywhere</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { q: '"Kiddle has been a game-changer! My kids look forward to the activities every week, and I love that they\'re learning while playing offline."', name: 'Sarah M.', role: 'Mom of two', color: '#FFF8E1' },
              { q: '"As an educator, I\'m impressed by the quality of activities. They\'re developmentally appropriate and genuinely engaging for young children."', name: 'James K.', role: 'Preschool Teacher & Dad', color: '#FFF0EF' },
              { q: '"Finally, something that keeps my daughter entertained without a screen! The activities are creative and so easy to set up."', name: 'Emily R.', role: 'Mom of 4-year-old', color: '#E6FAF9' },
            ].map((t, i) => (
              <div key={i} style={{ background: t.color, borderRadius: 22, padding: '28px', border: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 28, lineHeight: 1 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.7, fontWeight: 600, fontStyle: 'italic', flex: 1 }}>{t.q}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: ['#FFD166','#FFAAA5','#6ECDC8'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white' }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--dark)' }}>{t.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 48, flexWrap: 'wrap' }}>
            {[['2,000+','Happy Families'],['4.9/5','Average Rating'],['150+','Total Activities']].map(([v,l],i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily:"'Baloo 2',cursive", fontSize: 30, fontWeight: 800, color: '#FFD166' }}>{v}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════ */}
      <section style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'linear-gradient(135deg, #FFD166 0%, #FFAAA5 60%, #6ECDC8 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,253,246,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }} className="float">🌟</div>
          <h2 style={{ fontSize: isMobile ? 34 : 44, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.15, marginBottom: 16 }}>
            Ready to Make Playtime Meaningful?
          </h2>
          <p style={{ fontSize: isMobile ? 16 : 18, color: 'rgba(26,18,8,0.7)', marginBottom: 40, lineHeight: 1.7, fontWeight: 600 }}>
            Join thousands of parents choosing screen-free activities for their little ones. Start your journey today!
          </p>
          <div style={{ maxWidth: 500, margin: '0 auto 20px' }}>
            <EmailCapture />
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, fontWeight: 700, color: 'rgba(26,18,8,0.6)' }}>
            {['✓ Cancel Anytime', '✓ No Commitment'].map((t,i) => <span key={i}>{t}</span>)}
          </div>
        </div>
      </section>

      {/* ══ CONTACT ═══════════════════════════════════════ */}
      <section id="contact" style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'white', borderTop: '2px solid var(--border)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Tag color="teal">Contact Us</Tag>
            <h2 style={{ fontSize: isMobile ? 30 : 38, fontWeight: 800, color: 'var(--dark)', marginTop: 14, marginBottom: 8 }}>Have a Question?</h2>
            <p style={{ fontSize: 15, color: 'var(--body)', fontWeight: 600 }}>Send us a message and our team will reply soon.</p>
          </div>
          <div style={{ background: 'var(--cream)', border: '2px solid var(--border)', borderRadius: 20, padding: isMobile ? '18px' : '24px' }}>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════ */}
      <footer style={{ background: '#1A1208', color: 'rgba(255,255,255,0.7)', padding: isMobile ? '48px 16px 28px' : isTablet ? '52px 24px 32px' : '56px 40px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : '2fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <Logo size="sm" />
              <p style={{ marginTop: 16, fontSize: 14, lineHeight: 1.7, fontWeight: 600, maxWidth: 260 }}>
                Screen-free activities for curious kids aged 3–5. Making learning fun, one newsletter at a time.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFD166', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Quick Links</div>
              {[
                { label: 'Features', action: () => scrollTo('features') },
                { label: 'How It Works', action: () => scrollTo('how-it-works') },
                { label: 'Pricing', action: () => scrollTo('pricing') },
                { label: 'Sample Newsletter', action: () => window.open('/TheKiddle_Newsletter.pdf', '_blank') },
              ].map(l => (
                <button key={l.label} onClick={l.action} style={{ display: 'block', width: '100%', fontSize: 14, fontWeight: 600, marginBottom: 10, cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 0, fontFamily: "'Nunito',sans-serif", textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}>{l.label}</button>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFD166', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Support</div>
              <Link href="/faq" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>FAQ</Link>
              <button onClick={() => scrollTo('contact')} style={{ display: 'block', width: '100%', fontSize: 14, fontWeight: 600, marginBottom: 10, cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 0, fontFamily: "'Nunito',sans-serif", textAlign: 'left' }}>Contact Us</button>
              <Link href="/privacy-policy" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/terms-of-service" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Terms of Service</Link>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>© 2026 The Kiddle. All rights reserved.</p>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Made with ❤️ for little learners</p>
            <Link href="/admin" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
