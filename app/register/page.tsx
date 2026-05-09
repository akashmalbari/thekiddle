'use client'
import { useEffect, useState, type CSSProperties, type FocusEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type PricingData = {
  countryCode: string
  countryName: string
  currencyCode: string
  yearlyDisplay: string
}

function Logo() {
  return (
    <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, userSelect: 'none', textDecoration: 'none' }}>
      <span style={{ fontFamily:"'Baloo 2',cursive", fontSize: 13, fontWeight: 800, color: '#FFAAA5', lineHeight: 1, marginBottom: -3 }}>The</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily:"'Baloo 2',cursive", fontSize: 28, fontWeight: 800, color: '#FFD166', lineHeight: 1, letterSpacing: '-0.03em' }}>K</span>
        <svg width="10" height="26" viewBox="0 0 20 48" style={{ margin: '0 1px', flexShrink: 0 }}>
          <rect x="5" y="0" width="10" height="7" rx="3.5" fill="#6ECDC8" />
          <rect x="5" y="7" width="10" height="31" rx="2" fill="#FFAAA5" />
          <polygon points="5,38 15,38 10,48" fill="#FFD166" />
        </svg>
        <span style={{ fontFamily:"'Baloo 2',cursive", fontSize: 28, fontWeight: 800, color: '#FFD166', lineHeight: 1, letterSpacing: '-0.03em' }}>ddle</span>
      </div>
    </Link>
  )
}

function StepDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {[0,1].map(i => (
        <div key={i} style={{ height: 6, borderRadius: 6, width: i === step ? 28 : i < step ? 16 : 14, background: i < step ? '#6ECDC8' : i === step ? '#FFD166' : '#F0E8D4', transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)' }} />
      ))}
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginLeft: 6 }}>{step + 1} / 2</span>
    </div>
  )
}

const inputCss: CSSProperties = {
  width: '100%', padding: '13px 18px',
  borderRadius: 14, border: '2px solid var(--border)',
  fontSize: 15, fontFamily: "'Nunito',sans-serif",
  fontWeight: 600, color: 'var(--dark)',
  background: 'var(--cream)', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function RegisterInner() {
  const params = useSearchParams()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [childAge, setChildAge] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [viewportWidth, setViewportWidth] = useState(1200)
  const [pricing, setPricing] = useState<PricingData>({
    countryCode: 'US',
    countryName: 'United States',
    currencyCode: 'USD',
    yearlyDisplay: '$21.99',
  })

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
          yearlyDisplay: data.yearlyDisplay,
        })
      } catch {
        // keep USD fallback
      }
    }

    loadPricing()
  }, [])

  useEffect(() => {
    const billingStatus = params.get('billing')
    const sessionId = params.get('session_id')

    if (billingStatus === 'success') {
      if (sessionId) {
        fetch(`/api/billing/confirm?session_id=${encodeURIComponent(sessionId)}`)
          .catch(() => {
            // webhook may still complete confirmation; UI remains optimistic
          })
      }
      setDone(true)
    }

    if (billingStatus === 'cancelled') {
      setError('Payment was cancelled. You can try again anytime.')
      setStep(1)
    }
  }, [params])

  const isMobile = viewportWidth < 768

  const focus = (color: string) => (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = color
    e.target.style.boxShadow = `0 0 0 4px ${color}22`
  }
  const blur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border)'
    e.target.style.boxShadow = 'none'
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName: name,
          email,
          childAge: parseInt(childAge),
          plan: 'yearly',
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Something went wrong') }

      const data = await res.json()
      if (!data?.url) throw new Error('Checkout session was not created')
      window.location.href = data.url
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const card: CSSProperties = { background: 'white', borderRadius: 28, padding: isMobile ? '24px 20px' : '36px', border: '2px solid var(--border)', boxShadow: 'var(--shadow-md)', animation: 'slide-up 0.45s ease both' }

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF8E1, #FFF0EF, #E6FAF9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontSize: 80, marginBottom: 20, animation: 'float-y 3s ease-in-out infinite' }}>🎉</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.2 }}>Welcome to The Kiddle!</h1>
        <p style={{ fontSize: 17, color: 'var(--body)', lineHeight: 1.75, marginBottom: 36, fontWeight: 600 }}>
          Your welcome email is on its way to <strong style={{ color: '#FFD166' }}>{email}</strong>. It includes your sample Kiddle to get started.
        </p>
        <Link href="/" style={{ display: 'inline-block', background: '#FFD166', color: '#1A1208', padding: '15px 40px', borderRadius: 'var(--r-full)', fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: 'var(--shadow-yellow)' }}>
          Back to home 🏠
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ padding: isMobile ? '16px' : '18px 40px', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0, background: 'white', borderBottom: '1px solid var(--border)' }}>
        <Logo />
        <StepDots step={step} />
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>

          {/* ── STEP 0: Contact ── */}
          {step === 0 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>👋</div>
                <h1 style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>Let&apos;s get started!</h1>
                <p style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>Just a couple of details to get your Kiddle ready.</p>
              </div>
              <div style={card}>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Your name</label>
                  <input style={inputCss} placeholder="e.g. Sarah Johnson" value={name} onChange={e => setName(e.target.value)} onFocus={focus('#FFD166')} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Email address</label>
                  <input style={inputCss} type="email" placeholder="sarah@example.com" value={email} onChange={e => setEmail(e.target.value)} onFocus={focus('#FFD166')} onBlur={blur} />
                </div>
                <button onClick={() => { if (name.trim() && email.includes('@')) setStep(1) }} disabled={!name.trim() || !email.includes('@')}
                  style={{ width: '100%', padding: '15px', borderRadius: 16, border: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 800, cursor: name.trim() && email.includes('@') ? 'pointer' : 'not-allowed', background: name.trim() && email.includes('@') ? '#FFD166' : 'var(--border)', color: name.trim() && email.includes('@') ? '#1A1208' : 'var(--hint)', boxShadow: name.trim() && email.includes('@') ? 'var(--shadow-yellow)' : 'none', transition: 'all 0.2s' }}>
                  Continue → Tell us about your child
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: Child info ── */}
          {step === 1 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🧒</div>
                <h1 style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>About your little one</h1>
                <p style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>We&apos;ll personalize activities to their age!</p>
              </div>
              <div style={card}>
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Child age</label>
                  <select style={{ ...inputCss, appearance: 'none' } as CSSProperties} value={childAge} onChange={e => setChildAge(e.target.value)} onFocus={focus('#FFAAA5') as any} onBlur={blur as any}>
                    <option value="">Select age</option>
                    {['2','3','4','5','6'].map(a => <option key={a} value={a}>{a} years old</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10 }}>
                  <button onClick={() => setStep(0)} style={{ padding: '13px 20px', borderRadius: 14, border: '2px solid var(--border)', background: 'white', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, cursor: 'pointer', color: 'var(--muted)' }}>← Back</button>
                  <button onClick={() => { if (childAge) submit() }} disabled={!childAge || loading}
                    style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 800, cursor: childAge && !loading ? 'pointer' : 'not-allowed', background: childAge && !loading ? '#FFD166' : 'var(--border)', color: childAge && !loading ? '#1A1208' : 'var(--hint)', boxShadow: childAge && !loading ? 'var(--shadow-yellow)' : 'none', transition: 'all 0.2s' }}>
                    {loading ? '⏳ Redirecting...' : 'Continue → Checkout'}
                  </button>
                </div>
                {error && <div style={{ background: '#FFF0EF', border: '2px solid #FFAAA5', borderRadius: 10, padding: '10px 14px', marginTop: 14, fontSize: 13, color: '#E07D78', fontWeight: 700 }}>⚠️ {error}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '14px', textAlign: 'center', fontSize: 13, color: 'var(--hint)', fontWeight: 700 }}>🔒 Secure · No spam, ever · Cancel anytime</div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterInner /></Suspense>
}
