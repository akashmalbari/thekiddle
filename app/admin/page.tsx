'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function Logo() {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, userSelect: 'none' }}>
      <span style={{ fontFamily:"'Baloo 2',cursive", fontSize: 11, fontWeight: 800, color: '#FFAAA5', lineHeight: 1, marginBottom: -2 }}>The</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily:"'Baloo 2',cursive", fontSize: 22, fontWeight: 800, color: '#FFD166', lineHeight: 1 }}>K</span>
        <svg width="8" height="21" viewBox="0 0 20 48" style={{ margin: '0 1px', flexShrink: 0 }}>
          <rect x="5" y="0" width="10" height="7" rx="3.5" fill="#6ECDC8" />
          <rect x="5" y="7" width="10" height="31" rx="2" fill="#FFAAA5" />
          <polygon points="5,38 15,38 10,48" fill="#FFD166" />
        </svg>
        <span style={{ fontFamily:"'Baloo 2',cursive", fontSize: 22, fontWeight: 800, color: '#FFD166', lineHeight: 1 }}>ddle</span>
      </div>
    </div>
  )
}

type Subscriber = {
  id: string
  name: string | null
  email: string
  created_at: string
  children: { name: string; age_value: number }[]
}

type Newsletter = {
  id: number
  title: string
  theme: string
  age: string
  status: 'published' | 'draft'
  activities: number
}

type CountryPricing = {
  id: number
  country_code: string
  country_name: string
  currency_code: string
  currency_symbol: string
  monthly_price: number
  yearly_price: number
  is_active: boolean
}

const SAMPLE_NEWSLETTERS: Newsletter[] = [
  { id: 1, title: 'Rainbow Tissue Paper Collage', theme: '🎨 Art & Craft', age: '3–5', status: 'published', activities: 3 },
  { id: 2, title: 'Counting Garden Rocks', theme: '🔢 Math Play', age: '3–5', status: 'published', activities: 4 },
  { id: 3, title: 'Animal Sound Walk', theme: '🐾 Nature', age: '3–5', status: 'published', activities: 3 },
  { id: 4, title: 'Sensory Cloud Dough', theme: '🤲 Sensory', age: '3–5', status: 'draft', activities: 2 },
  { id: 5, title: 'Letter Treasure Hunt', theme: '📖 Literacy', age: '3–4', status: 'draft', activities: 3 },
]

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState<'subscribers' | 'newsletters' | 'pricing'>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [search, setSearch] = useState('')
  const [newsletters, setNewsletters] = useState(SAMPLE_NEWSLETTERS)
  const [pricingRows, setPricingRows] = useState<CountryPricing[]>([])
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingMsg, setPricingMsg] = useState('')
  const [newPricing, setNewPricing] = useState({
    country_code: '',
    country_name: '',
    currency_code: '',
    currency_symbol: '',
    monthly_price: '',
    yearly_price: '',
    is_active: true,
  })

  const handleLogin = async () => {
    setLoginLoading(true); setLoginErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPw })
    if (error) { setLoginErr('Invalid email or password'); setLoginLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoginErr('Login failed'); setLoginLoading(false); return }
    const { data: adminRow } = await supabase.from('admins').select('id').eq('id', user.id).single()
    if (!adminRow) { await supabase.auth.signOut(); setLoginErr('You do not have admin access'); setLoginLoading(false); return }
    setAuthed(true); setLoginLoading(false)
  }

  const loadSubscribers = async () => {
    setLoadingData(true)
    const { data: parents } = await supabase.from('parents').select('id, name, email, created_at').order('created_at', { ascending: false })
    if (!parents) { setLoadingData(false); return }
    const enriched: Subscriber[] = await Promise.all(parents.map(async p => {
      const { data: kids } = await supabase.from('children').select('name, age_value').eq('parent_id', p.id)
      return { ...p, children: kids || [] }
    }))
    setSubscribers(enriched); setLoadingData(false)
  }

  const loadPricing = async () => {
    setPricingLoading(true)
    const { data } = await supabase
      .from('country_pricing')
      .select('id, country_code, country_name, currency_code, currency_symbol, monthly_price, yearly_price, is_active')
      .order('country_code', { ascending: true })

    setPricingRows((data || []) as CountryPricing[])
    setPricingLoading(false)
  }

  const savePricingRow = async (row: CountryPricing) => {
    setPricingMsg('')
    if (!row.country_code || !row.currency_code) {
      setPricingMsg('⚠️ Country code and currency code are required')
      return
    }

    const { error } = await supabase
      .from('country_pricing')
      .update({
        country_code: row.country_code.toUpperCase(),
        country_name: row.country_name,
        currency_code: row.currency_code.toUpperCase(),
        currency_symbol: row.currency_symbol,
        monthly_price: Number(row.monthly_price),
        yearly_price: Number(row.yearly_price),
        is_active: row.is_active,
      })
      .eq('id', row.id)

    if (error) {
      setPricingMsg(`⚠️ ${error.message}`)
      return
    }

    setPricingMsg('✅ Pricing updated')
    await loadPricing()
  }

  const addPricingRow = async () => {
    setPricingMsg('')
    if (!newPricing.country_code || !newPricing.country_name || !newPricing.currency_code || !newPricing.currency_symbol) {
      setPricingMsg('⚠️ Fill all required fields to add pricing row')
      return
    }

    const { error } = await supabase.from('country_pricing').insert({
      country_code: newPricing.country_code.toUpperCase(),
      country_name: newPricing.country_name,
      currency_code: newPricing.currency_code.toUpperCase(),
      currency_symbol: newPricing.currency_symbol,
      monthly_price: Number(newPricing.monthly_price),
      yearly_price: Number(newPricing.yearly_price),
      is_active: newPricing.is_active,
    })

    if (error) {
      setPricingMsg(`⚠️ ${error.message}`)
      return
    }

    setNewPricing({
      country_code: '',
      country_name: '',
      currency_code: '',
      currency_symbol: '',
      monthly_price: '',
      yearly_price: '',
      is_active: true,
    })
    setPricingMsg('✅ New country pricing added')
    await loadPricing()
  }

  useEffect(() => {
    if (authed) {
      loadSubscribers()
      loadPricing()
    }
  }, [authed])

  const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--border)', fontSize: 14, fontFamily: "'Nunito',sans-serif", fontWeight: 600, color: 'var(--dark)', background: 'var(--cream)', outline: 'none', transition: 'border-color 0.2s' }
  const filtered = subscribers.filter(s => s.email?.toLowerCase().includes(search.toLowerCase()) || s.name?.toLowerCase().includes(search.toLowerCase()) || s.children?.some(c => c.name?.toLowerCase().includes(search.toLowerCase())))

  // ── LOGIN ──
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF8E1, #FFF0EF, #E6FAF9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Logo />
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Admin Portal</div>
        </div>
        <div style={{ background: 'white', borderRadius: 28, padding: '36px', border: '2px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>Welcome back 👋</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600, marginBottom: 26 }}>Sign in to manage The Kiddle</p>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Email</label>
            <input style={inp} type="email" placeholder="admin@thekiddle.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#FFD166'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Password</label>
            <input style={inp} type="password" placeholder="••••••••" value={loginPw} onChange={e => setLoginPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              onFocus={e => e.target.style.borderColor = '#FFD166'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          {loginErr && <div style={{ background: '#FFF0EF', border: '2px solid #FFAAA5', borderRadius: 10, padding: '9px 14px', marginBottom: 14, fontSize: 13, color: '#E07D78', fontWeight: 700 }}>⚠️ {loginErr}</div>}
          <button onClick={handleLogin} disabled={loginLoading} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 800, cursor: loginLoading ? 'wait' : 'pointer', background: '#FFD166', color: '#1A1208', boxShadow: 'var(--shadow-yellow)' }}>
            {loginLoading ? '⏳ Signing in...' : 'Sign in →'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── DASHBOARD ──
  const totalKids = subscribers.reduce((s, sub) => s + sub.children.length, 0)
  const thisWeek = subscribers.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '0 40px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Logo />
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--muted)', textDecoration: 'none', background: 'var(--cream)' }}>← View site</a>
          <button onClick={() => { supabase.auth.signOut(); setAuthed(false) }} style={{ padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--muted)', background: 'var(--cream)', border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Sign out</button>
        </div>
      </header>

      <div style={{ flex: 1, padding: '28px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Subscribers', value: subscribers.length, emoji: '📧', color: '#FFD166' },
            { label: 'Children Registered', value: totalKids, emoji: '🧒', color: '#FFAAA5' },
            { label: 'Joined This Week', value: thisWeek, emoji: '📈', color: '#6ECDC8' },
            { label: 'Newsletters Sent', value: newsletters.filter(n => n.status === 'published').length, emoji: '📮', color: '#FFD166' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 18, padding: '18px 22px', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: s.color + '28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.emoji}</div>
              <div>
                <div style={{ fontFamily: "'Baloo 2',cursive", fontSize: 26, fontWeight: 800, color: 'var(--dark)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, padding: 4, border: '2px solid var(--border)', width: 'fit-content', marginBottom: 22 }}>
          {(['subscribers', 'newsletters', 'pricing'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 22px', borderRadius: 11, border: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', background: tab === t ? '#FFD166' : 'transparent', color: tab === t ? '#1A1208' : 'var(--muted)', boxShadow: tab === t ? 'var(--shadow-yellow)' : 'none' }}>
              {t === 'subscribers' ? '📧 Subscribers' : t === 'newsletters' ? '📮 Newsletters' : '💱 Pricing'}
            </button>
          ))}
        </div>

        {/* SUBSCRIBERS */}
        {tab === 'subscribers' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <input style={{ ...inp, maxWidth: 320, background: 'white' }} placeholder="🔍  Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {loadingData ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>Loading subscribers...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>{search ? 'No results found' : 'No subscribers yet — share that link!'}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(sub => (
                  <div key={sub.id} style={{ background: 'white', borderRadius: 18, padding: '18px 24px', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', gap: 18, transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#FFD166'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF8E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📧</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{sub.name || '—'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{sub.email}</div>
                    </div>
                    {sub.children.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {sub.children.map((c, i) => (
                          <span key={i} style={{ background: '#FFF8E1', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--body)', border: '1px solid #FFD16650' }}>
                            🧒 {c.name} · age {c.age_value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--hint)', flexShrink: 0 }}>
                      {new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NEWSLETTERS */}
        {tab === 'newsletters' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#FFD166', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: 'var(--shadow-yellow)' }}>
                + New Newsletter
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {newsletters.map(n => (
                <div key={n.id} style={{ background: 'white', borderRadius: 18, padding: '18px 24px', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#6ECDC8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E6FAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📮</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{n.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{n.theme} · Ages {n.age} · {n.activities} activities</div>
                  </div>
                  <div style={{ padding: '4px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 800, background: n.status === 'published' ? '#E6FAF9' : '#FFF8E1', color: n.status === 'published' ? '#4AADA8' : '#E6B84A', border: `1.5px solid ${n.status === 'published' ? '#6ECDC855' : '#FFD16655'}` }}>
                    {n.status === 'published' ? '● Published' : '○ Draft'}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ padding: '6px 14px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--muted)' }}>Edit</button>
                    <button onClick={() => setNewsletters(newsletters.map(x => x.id === n.id ? { ...x, status: x.status === 'published' ? 'draft' : 'published' } : x))}
                      style={{ padding: '6px 14px', borderRadius: 10, border: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 700, cursor: 'pointer', background: n.status === 'published' ? '#FFF0EF' : '#E6FAF9', color: n.status === 'published' ? '#E07D78' : '#4AADA8' }}>
                      {n.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRICING */}
        {tab === 'pricing' && (
          <div>
            {pricingMsg && (
              <div style={{ marginBottom: 14, background: 'white', border: '2px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--body)' }}>
                {pricingMsg}
              </div>
            )}

            <div style={{ background: 'white', border: '2px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Add Country Pricing</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
                <input style={{ ...inp, background: 'white' }} placeholder="Country Code (US)" value={newPricing.country_code} onChange={e => setNewPricing({ ...newPricing, country_code: e.target.value })} />
                <input style={{ ...inp, background: 'white' }} placeholder="Country Name" value={newPricing.country_name} onChange={e => setNewPricing({ ...newPricing, country_name: e.target.value })} />
                <input style={{ ...inp, background: 'white' }} placeholder="Currency Code (USD)" value={newPricing.currency_code} onChange={e => setNewPricing({ ...newPricing, currency_code: e.target.value })} />
                <input style={{ ...inp, background: 'white' }} placeholder="Currency Symbol ($)" value={newPricing.currency_symbol} onChange={e => setNewPricing({ ...newPricing, currency_symbol: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, alignItems: 'center' }}>
                <input style={{ ...inp, background: 'white' }} type="number" step="0.01" placeholder="Monthly Price" value={newPricing.monthly_price} onChange={e => setNewPricing({ ...newPricing, monthly_price: e.target.value })} />
                <input style={{ ...inp, background: 'white' }} type="number" step="0.01" placeholder="Yearly Price" value={newPricing.yearly_price} onChange={e => setNewPricing({ ...newPricing, yearly_price: e.target.value })} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--body)' }}>
                  <input type="checkbox" checked={newPricing.is_active} onChange={e => setNewPricing({ ...newPricing, is_active: e.target.checked })} /> Active
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={addPricingRow} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#FFD166', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: 'pointer' }}>+ Add Pricing Row</button>
              </div>
            </div>

            {pricingLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>Loading pricing...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pricingRows.map((row, i) => (
                  <div key={row.id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '2px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
                      <input style={{ ...inp, background: 'white' }} value={row.country_code} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, country_code: e.target.value } : r))} />
                      <input style={{ ...inp, background: 'white' }} value={row.country_name} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, country_name: e.target.value } : r))} />
                      <input style={{ ...inp, background: 'white' }} value={row.currency_code} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, currency_code: e.target.value } : r))} />
                      <input style={{ ...inp, background: 'white' }} value={row.currency_symbol} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, currency_symbol: e.target.value } : r))} />
                      <input style={{ ...inp, background: 'white' }} type="number" step="0.01" value={row.monthly_price} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, monthly_price: Number(e.target.value) } : r))} />
                      <input style={{ ...inp, background: 'white' }} type="number" step="0.01" value={row.yearly_price} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, yearly_price: Number(e.target.value) } : r))} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                        <input type="checkbox" checked={row.is_active} onChange={e => setPricingRows(pricingRows.map((r, idx) => idx === i ? { ...r, is_active: e.target.checked } : r))} /> Active
                      </label>
                      <button onClick={() => savePricingRow(row)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#E6FAF9', color: '#4AADA8', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: 'pointer' }}>Save</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
