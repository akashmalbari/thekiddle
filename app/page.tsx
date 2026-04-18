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
function YellowBtn({ children, onClick, style, type = 'button', disabled = false }: { children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties; type?: 'button' | 'submit' | 'reset'; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  const isInteractive = !disabled
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseEnter={() => isInteractive && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#FFD166', backgroundImage: 'none', WebkitAppearance: 'none', appearance: 'none', color: '#1A1208', border: 'none', borderRadius: 'var(--r-full)', padding: '14px 32px', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, cursor: isInteractive ? 'pointer' : 'wait', opacity: disabled ? 0.7 : 1, boxShadow: hov && isInteractive ? '0 8px 28px rgba(255,209,102,0.55)' : 'var(--shadow-yellow)', transform: hov && isInteractive ? 'translateY(-2px)' : 'none', transition: 'all 0.2s', ...style }}>
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
function EmailCapture({ onSuccess, isCompact = false }: { onSuccess?: (email: string) => void; isCompact?: boolean }) {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!loading) submit()
  }

  if (done) return (
    <div style={{ background: '#E6FAF9', border: '2px solid #6ECDC8', borderRadius: 'var(--r-lg)', padding: '18px 24px', textAlign: 'center' }} className="pop-in">
      <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: '#2C2016' }}>You're in! Check your inbox for a sample Kiddle.</div>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    flex: 1,
    width: '100%',
    border: isCompact ? '2px solid var(--border)' : 'none',
    borderRadius: isCompact ? 'var(--r-md)' : 0,
    outline: 'none',
    fontFamily: "'Nunito',sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--dark)',
    background: isCompact ? '#FFFFFF' : 'transparent',
    backgroundImage: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    boxShadow: 'none',
    opacity: 1,
    minWidth: isCompact ? 0 : 220,
    textAlign: 'left',
    padding: isCompact ? '14px 16px' : '6px 8px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: isCompact ? 'column' : 'row', gap: 10, background: isCompact ? '#FFFFFF' : 'white', borderRadius: isCompact ? 'var(--r-xl)' : 'var(--r-full)', padding: isCompact ? '16px' : '6px 10px', boxShadow: isCompact ? '0 10px 24px rgba(26,18,8,0.08)' : 'var(--shadow-md)', border: '2px solid var(--border)', alignItems: isCompact ? 'stretch' : 'center' }}>
        {isCompact ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <label style={{ display: 'grid', gap: 8, textAlign: 'left', fontSize: 14, fontWeight: 800, color: 'var(--body)' }}>
              Email address
              <input type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="name@example.com"
                style={inputStyle} />
            </label>
          </div>
        ) : (
          <input type="email" autoComplete="email" aria-label="Email address" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="Enter your email address"
            style={inputStyle} />
        )}
        <YellowBtn type="submit" disabled={loading} style={{ borderRadius: 'var(--r-full)', padding: isCompact ? '14px 18px' : '11px 28px', fontSize: isCompact ? 16 : 15, marginInline: 'auto', width: isCompact ? '100%' : 'auto', boxShadow: isCompact ? 'none' : undefined, border: isCompact ? '2px solid #E6B84A' : undefined }}>
          {loading ? 'Sending sample...' : isCompact ? 'Email Me a Free Sample →' : 'Get a Sample Kiddle For Free →'}
        </YellowBtn>
      </div>
      {isCompact && !error && <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, textAlign: 'center' }}>We’ll send one sample Kiddle straight to your inbox.</p>}
      {error && <p style={{ color: '#E07D78', fontSize: 13, fontWeight: 700, marginTop: 2, paddingLeft: isCompact ? 0 : 8, textAlign: isCompact ? 'center' : 'left' }}>⚠️ {error}</p>}
    </form>
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
          {[['What We Offer','features'],['How It Works','how-it-works'],['Pricing','pricing']].map(([label, id]) => (
            <span key={id} onClick={() => scrollTo(id)} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFD166'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--body)'}>{label}</span>
          ))}
          <Link
            href="/blog"
            style={{ color: 'var(--body)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#FFD166'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--body)'}
          >
            Blogs
          </Link>
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
            {[['What We Offer','features'],['How It Works','how-it-works'],['Pricing','pricing']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'white', borderRadius: 14, padding: '14px 16px', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--body)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
              >
                {label}
              </button>
            ))}
            <Link
              href="/blog"
              onClick={() => setMobileMenu(false)}
              style={{ width: '100%', textAlign: 'left', border: 'none', background: 'white', borderRadius: 14, padding: '14px 16px', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--body)', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}
            >
              Blog
            </Link>
            <YellowBtn onClick={() => scrollTo('pricing')} style={{ width: '100%', padding: '14px 18px', fontSize: 15 }}>Get Started</YellowBtn>
          </div>
        )}
      </nav>

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '120px 16px 48px' : isTablet ? '110px 24px 56px' : '100px 40px 60px', position: 'relative', overflow: 'hidden', isolation: 'isolate' }}>
        {/* Soft background blobs */}
        <div style={{ position: 'absolute', top: '5%', right: isMobile ? '-25%' : '5%', width: isMobile ? 260 : 480, height: isMobile ? 260 : 480, borderRadius: '50%', background: 'radial-gradient(circle, #FFF8E1 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '10%', left: isMobile ? '-20%' : '-5%', width: isMobile ? 220 : 360, height: isMobile ? 220 : 360, borderRadius: '50%', background: 'radial-gradient(circle, #FFF0EF 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Floating craft doodles */}
        {(isMobile
          ? [
              { emoji: '🌟', top: '12%', right: '8%', cls: 'float-sm' },
              { emoji: '🎨', top: '18%', left: '8%', cls: 'float-delay2' },
            ]
          : [
              { emoji: '✂️', top: '14%', left: '4%', cls: 'float' },
              { emoji: '🖍️', top: '20%', right: '4%', cls: 'float-delay1' },
              { emoji: '🎨', bottom: '28%', left: '3%', cls: 'float-delay2' },
              { emoji: '📌', top: '60%', right: '3%', cls: 'float-delay3' },
            ]).map((b, i) => (
          <div key={i} className={b.cls} style={{ position: 'absolute', top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: isMobile ? 38 : 52, height: isMobile ? 38 : 52, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, boxShadow: 'var(--shadow-sm)', border: '2px solid var(--border)', opacity: isMobile ? 0.92 : 1, pointerEvents: 'none', zIndex: 0 }}>
            {b.emoji}
          </div>
        ))}

        <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: isMobile ? 8 : 14, marginBottom: isMobile ? 18 : 24, paddingTop: isMobile ? 8 : 12 }}>
            {[
              { src: '/hero-1.png', rotate: -10, z: 2, offset: isMobile ? 10 : 14, w: isMobile ? 96 : 132 },
              { src: '/hero-2.png', rotate: 0, z: 2, offset: 0, w: isMobile ? 96 : 132 },
              { src: '/hero-3.png', rotate: 10, z: 2, offset: isMobile ? -10 : -14, w: isMobile ? 96 : 132 },
            ].map((card, i) => (
              <img
                key={i}
                src={card.src}
                alt={`Kiddle preview ${i + 1}`}
                style={{
                  width: card.w,
                  height: 'auto',
                  borderRadius: 10,
                  border: '2px solid rgba(240,232,212,0.9)',
                  boxShadow: '0 10px 26px rgba(26,18,8,0.14)',
                  filter: 'blur(0.5px)',
                  transform: `translateX(${card.offset}px) rotate(${card.rotate}deg)`,
                  transformOrigin: 'top center',
                  zIndex: card.z,
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            ))}
          </div>
          <div style={{ marginBottom: 24 }}><Tag color="pink">New edition every Monday · Ages 3–5</Tag></div>
          <h1 style={{ fontSize: isMobile ? 30 : isTablet ? 38 : 48, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.12, marginBottom: 22 }}>
            One magical hour. Zero planning. <br/>{' '}
            <span style={{ color: '#FFD166', position: 'relative', display: 'inline-block' }}>
              6+ activities
              <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%' }} viewBox="0 0 300 10" preserveAspectRatio="none">
                <path d="M0,7 Q75,0 150,7 Q225,14 300,7" stroke="#FFAAA5" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 18, color: 'var(--body)', lineHeight: 1.75, marginBottom: 36, fontWeight: 600, maxWidth: 540, marginInline: 'auto' }}>
            Kiddle is a weekly print-and-play workbook packed with activities most kids have never seen together — science, phonics, storytelling, movement, and more. Busy parents, this one's for you.
          </p>
          <div style={{ marginBottom: 20, maxWidth: 500, marginInline: 'auto' }}>
            <EmailCapture isCompact={isMobile} />
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
              { emoji: '🧠', title: 'Age appropriate science experiment', desc: 'A hands-on experiment your child does using everyday items exploring surface tension, color mixing, and cause and effect. Watch their excitement when it works.', color: '#FFD166', pale: '#FFF8E1' },
              { emoji: '📚', title: 'Unique Learning Activities', desc: 'A fresh mix of activities your child won’t find in typical workbooks—phonics play, cut-and-build creations, and story-building exercises that spark creativity, hands-on thinking, and deeper learning.', color: '#FFAAA5', pale: '#FFF0EF' },
              { emoji: '🏃', title: 'Active Play', desc: 'Body break activity tied to the week\'s theme — stomping like elephants, jumping like frogs. Gross motor skills, energy release, and giggles. Because kids this age learn through their whole body.', color: '#6ECDC8', pale: '#E6FAF9' },
              { emoji: '✂️', title: 'Logic & Reasoning', desc: 'Riddles and pattern games designed for little thinkers. Not too easy, not frustrating. ', color: '#FFD166', pale: '#FFF8E1' },
              { emoji: '🎨', title: 'Creative Expression', desc: 'Themed coloring that builds fine motor skills while your child creates, not just colors.', color: '#FFAAA5', pale: '#FFF0EF' },
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
              { n: '2', emoji: '📬', title: 'Receive Weekly', desc: 'Receive your weekly Kiddle pack every Monday — just print at home, at work, or a nearby store.', color: '#FFAAA5' },
              { n: '3', emoji: '🌟', title: 'Play & Learn', desc: 'Simple, joyful activities designed to keep your child engaged and learning.', color: '#6ECDC8' },
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
                {['4 weekly Kiddles', '12+ activities per month', 'Printable activity sheets', 'Parent guidance tips', 'Cancel anytime'].map((f, i) => (
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
                {['52 weekly Kiddles', '150+ activities per year', 'Printable activity sheets', 'Parent guidance tips', 'Exclusive seasonal activities', 'Priority email support'].map((f, i) => (
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
            <a href="/#contact" style={{ color: '#E07D78', fontWeight: 800, textDecoration: 'none' }}>Contact Us</a>
          </p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════ */}
      <section id="testimonials" style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'left', marginBottom: 56 }}>
                <Tag color="teal">What Parents Say</Tag>
                <h2 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, color: 'var(--dark)', marginTop: 16, marginBottom: 14 }}>The Monday they actually look forward to</h2>
                <p style={{ fontSize: isMobile ? 16 : 17, color: 'var(--body)', lineHeight: 1.8, fontWeight: 600, whiteSpace: isMobile ? 'normal' : 'nowrap' }}>
              Parents tell us the experiment page alone is worth the subscription.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'repeat(3, 1fr)', gap: 18 }}>
            {[
              {
                quote: '“My daughter asked me on Sunday night if her \"new book\" had arrived yet. That\'s never happened with any other activity.”',
                author: 'Priya M. · Mum of a 4-year-old',
              },
              {
                quote: '“The pepper experiment blew my son\'s mind. He made his grandfather do it three times. Worth every penny.”',
                author: 'James T. · Dad of a 5-year-old',
              },
              {
                quote: '“As a working mum I have zero time to plan activities. This is genuinely the only thing that gives me a guilt-free hour on weekends.”',
                author: 'Aisha K. · Mum of two, ages 3 & 5',
              },
            ].map((t, i) => (
              <div key={i} style={{ background: '#F4F5F7', border: '2px solid #DFE2E8', borderRadius: 28, padding: isMobile ? '20px 16px' : '26px 28px', minHeight: isMobile ? 'auto' : 300, display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#E3B630', fontSize: 32, lineHeight: 1, letterSpacing: 1, marginBottom: 20 }}>★★★★★</div>
                <p style={{ fontSize: isMobile ? 15 : 17, lineHeight: 1.7, color: '#1C1712', fontWeight: 700, fontStyle: 'italic', marginBottom: 28, flex: 1, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {t.quote}
                </p>
                <p style={{ fontSize: isMobile ? 23/2 : 16, color: '#7A7670', fontWeight: 700 }}>{t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY WE STARTED KIDDLE ═════════════════════════ */}
      <section style={{ padding: isMobile ? '56px 16px' : isTablet ? '64px 24px' : '80px 40px', background: 'var(--cream-warm)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1.05fr 1fr', gap: isMobile ? 28 : 40, alignItems: 'center' }}>
          <div>
            <div style={{ textAlign: 'center' }}>
              <Tag color="pink">Our Story</Tag>
            </div>
            <h2 style={{ fontSize: isMobile ? 32 : 42, fontWeight: 800, color: 'var(--dark)', marginTop: 16, marginBottom: 16 }}>
              Why we started Kiddle?
            </h2>
            <p style={{ fontSize: isMobile ? 16 : 17, color: 'var(--body)', lineHeight: 1.8, fontWeight: 600, marginBottom: 16 }}>
              Kiddle started with a simple thought — in a world full of screens and busy schedules, children don’t just need more activities, they need more meaningful moments.
            </p>
            <p style={{ fontSize: isMobile ? 16 : 17, color: 'var(--body)', lineHeight: 1.8, fontWeight: 600, marginBottom: 16 }}>
              Every Kiddle is thoughtfully curated to help parents and kids slow down, connect, and grow together — through simple, playful learning that fits into real life.
            </p>
            <p style={{ fontSize: isMobile ? 16 : 17, color: 'var(--body)', lineHeight: 1.8, fontWeight: 600 }}>
              -- Manali Killedar - Malbari (Founder)
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: isMobile ? 560 : 'none', margin: '0 auto' }}>
            <img
              src="/motivation.jpeg"
              alt="Mom and child enjoying Kiddle activities"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
                borderRadius: 18,
                boxShadow: 'var(--shadow-sm)',
                border: '2px solid var(--border)',
              }}
            />
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
                Where curiosity grows through play and creativity.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFD166', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Quick Links</div>
              {[
                { label: 'What We Offer', action: () => scrollTo('features') },
                { label: 'How It Works', action: () => scrollTo('how-it-works') },
                { label: 'Pricing', action: () => scrollTo('pricing') },
              ].map(l => (
                <button key={l.label} onClick={l.action} style={{ display: 'block', width: '100%', fontSize: 14, fontWeight: 600, marginBottom: 10, cursor: 'pointer', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 0, fontFamily: "'Nunito',sans-serif", textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'white'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}>{l.label}</button>
              ))}
              <Link href="/blog" style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Blogs</Link>
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
