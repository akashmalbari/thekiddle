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
  subscriber_state: 'potential' | 'active' | 'unsubscribed'
  created_at: string
  children: { age_value: number }[]
}

type NewsletterRecord = {
  id: number
  title: string
  issue_date: string
  pdf_path: string | null
  status: 'draft' | 'uploaded' | 'sending' | 'sent' | 'failed'
  created_at: string
  sent_at: string | null
  recipient_count?: number
  sent_count?: number
  failed_count?: number
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

type ContactQuery = {
  id: number
  name: string
  email: string
  subject: string | null
  message: string
  answered: boolean
  created_at: string
  answered_at: string | null
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState<'subscribers' | 'newsletters' | 'pricing' | 'contacts'>('subscribers')
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [search, setSearch] = useState('')
  const [newsletters, setNewsletters] = useState<NewsletterRecord[]>([])
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
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([])
  const [contactLoading, setContactLoading] = useState(false)
  const [contactMsg, setContactMsg] = useState('')

  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterMsg, setNewsletterMsg] = useState('')
  const [newsletterTitle, setNewsletterTitle] = useState('')
  const [newsletterIssueDate, setNewsletterIssueDate] = useState('')
  const [newsletterFile, setNewsletterFile] = useState<File | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [savingNewsletter, setSavingNewsletter] = useState(false)
  const [sendConfig, setSendConfig] = useState<{ testMode: boolean; testEmail: string }>({ testMode: false, testEmail: '' })

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
    const { data: parents } = await supabase.from('parents').select('id, name, email, subscriber_state, created_at').order('created_at', { ascending: false })
    if (!parents) { setLoadingData(false); return }
    const enriched: Subscriber[] = await Promise.all(parents.map(async p => {
      const { data: kids } = await supabase.from('children').select('age_value').eq('parent_id', p.id)
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

  const loadContactQueries = async () => {
    setContactLoading(true)
    const { data } = await supabase
      .from('contact_queries')
      .select('id, name, email, subject, message, answered, created_at, answered_at')
      .order('created_at', { ascending: false })

    setContactQueries((data || []) as ContactQuery[])
    setContactLoading(false)
  }

  const authFetch = async (url: string, init?: RequestInit) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.access_token
    if (!accessToken) throw new Error('Not authenticated')

    return fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    })
  }

  const loadNewsletters = async () => {
    setNewsletterLoading(true)
    setNewsletterMsg('')
    try {
      const res = await authFetch('/api/admin/newsletters')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load newsletters')
      setNewsletters(data.newsletters || [])
    } catch (e: any) {
      setNewsletterMsg(`⚠️ ${e.message}`)
    } finally {
      setNewsletterLoading(false)
    }
  }

  const loadSendConfig = async () => {
    try {
      const res = await authFetch('/api/admin/newsletters/send-config')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load send config')
      setSendConfig({ testMode: !!data.testMode, testEmail: data.testEmail || '' })
    } catch {
      // keep default silent fallback
    }
  }

  const saveNewsletter = async () => {
    setNewsletterMsg('')
    if (!newsletterTitle.trim() || !newsletterIssueDate || !newsletterFile) {
      setNewsletterMsg('⚠️ Title, issue date, and PDF are required')
      return
    }

    setSavingNewsletter(true)
    try {
      setUploadingPdf(true)
      const formData = new FormData()
      formData.append('file', newsletterFile)

      const uploadRes = await authFetch('/api/admin/newsletters/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')
      setUploadingPdf(false)

      const createRes = await authFetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsletterTitle,
          issueDate: newsletterIssueDate,
          pdfPath: uploadData.path,
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Unable to save newsletter')

      setNewsletterTitle('')
      setNewsletterIssueDate('')
      setNewsletterFile(null)
      setNewsletterMsg('✅ Newsletter uploaded and saved')
      await loadNewsletters()
    } catch (e: any) {
      setNewsletterMsg(`⚠️ ${e.message}`)
    } finally {
      setUploadingPdf(false)
      setSavingNewsletter(false)
    }
  }

  const previewNewsletter = async (newsletterId: number) => {
    setNewsletterMsg('')
    try {
      const res = await authFetch(`/api/admin/newsletters/${newsletterId}/preview`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to preview newsletter')
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      setNewsletterMsg(`⚠️ ${e.message}`)
    }
  }

  const sendNewsletter = async (newsletter: NewsletterRecord) => {
    setNewsletterMsg('')
    try {
      const dryRunRes = await authFetch(`/api/admin/newsletters/${newsletter.id}/send?dryRun=true`, { method: 'POST' })
      const dryRunData = await dryRunRes.json()
      if (!dryRunRes.ok) throw new Error(dryRunData.error || 'Unable to prepare send')

      const confirmation = window.confirm(
        `Send next newsletters now?\n\nEligible active subscribers: ${dryRunData.eligibleParentCount || 0}\nBehavior: ${dryRunData.description || 'Each active subscriber receives their next newsletter in sequence.'}`
      )
      if (!confirmation) return

      const res = await authFetch(`/api/admin/newsletters/${newsletter.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to send newsletter')
      setNewsletterMsg(`✅ Send completed — Sent: ${data.sentCount}, Failed: ${data.failedCount}, Skipped: ${data.skippedCount}`)
      await loadNewsletters()
    } catch (e: any) {
      setNewsletterMsg(`⚠️ ${e.message}`)
    }
  }

  const deleteNewsletter = async (newsletter: NewsletterRecord) => {
    setNewsletterMsg('')

    const confirmed = window.confirm(
      `Are you sure? This will permanently delete the newsletter and its file.\n\n${newsletter.title}`
    )
    if (!confirmed) return

    try {
      const res = await authFetch(`/api/admin/newsletters/${newsletter.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to delete newsletter')
      setNewsletterMsg('✅ Newsletter deleted successfully')
      await loadNewsletters()
    } catch (e: any) {
      setNewsletterMsg(`⚠️ ${e.message}`)
    }
  }

  const markContactAnswered = async (query: ContactQuery, answered: boolean) => {
    setContactMsg('')

    const { data: authUser } = await supabase.auth.getUser()
    const adminId = authUser.user?.id || null

    const { error } = await supabase
      .from('contact_queries')
      .update({
        answered,
        answered_at: answered ? new Date().toISOString() : null,
        answered_by: answered ? adminId : null,
      })
      .eq('id', query.id)

    if (error) {
      setContactMsg(`⚠️ ${error.message}`)
      return
    }

    setContactMsg('✅ Contact status updated')
    await loadContactQueries()
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
      loadContactQueries()
      loadNewsletters()
      loadSendConfig()
    }
  }, [authed])

  const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--border)', fontSize: 14, fontFamily: "'Nunito',sans-serif", fontWeight: 600, color: 'var(--dark)', background: 'var(--cream)', outline: 'none', transition: 'border-color 0.2s' }
  const filtered = subscribers.filter(
    s =>
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.subscriber_state?.toLowerCase().includes(search.toLowerCase())
  )

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
            { label: 'Newsletters Sent', value: newsletters.filter(n => n.status === 'sent').length, emoji: '📮', color: '#FFD166' },
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
          {(['subscribers', 'newsletters', 'pricing', 'contacts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 22px', borderRadius: 11, border: 'none', fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', background: tab === t ? '#FFD166' : 'transparent', color: tab === t ? '#1A1208' : 'var(--muted)', boxShadow: tab === t ? 'var(--shadow-yellow)' : 'none' }}>
              {t === 'subscribers' ? '📧 Subscribers' : t === 'newsletters' ? '📮 Newsletters' : t === 'pricing' ? '💱 Pricing' : '💬 Contacts'}
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
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ background: '#E6FAF9', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 800, color: '#2C2016', border: '1px solid #6ECDC850' }}>
                        {sub.subscriber_state}
                      </span>
                      {sub.children.map((c, i) => (
                        <span key={i} style={{ background: '#FFF8E1', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: 'var(--body)', border: '1px solid #FFD16650' }}>
                          🧒 age {c.age_value}
                        </span>
                      ))}
                    </div>
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
            <div style={{ marginBottom: 14, background: sendConfig.testMode ? '#FFF0EF' : '#E6FAF9', border: `2px solid ${sendConfig.testMode ? '#FFAAA5' : '#6ECDC8'}`, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: sendConfig.testMode ? '#E07D78' : '#4AADA8', marginBottom: 8 }}>
                {sendConfig.testMode ? 'SELECTED MODE ACTIVE' : 'PRODUCTION MODE ACTIVE'}
                {sendConfig.testMode && sendConfig.testEmail ? ` — Emails will only be sent to ${sendConfig.testEmail}` : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center' }}>
                <input
                  style={{ ...inp, background: 'white' }}
                  type="text"
                  placeholder="test1@email.com, test2@email.com"
                  value={sendConfig.testEmail}
                  onChange={e => setSendConfig(cfg => ({ ...cfg, testEmail: e.target.value }))}
                />
                <button
                  onClick={() => setSendConfig(cfg => ({ ...cfg, testMode: !cfg.testMode }))}
                  style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: sendConfig.testMode ? '#FFF8E1' : '#FFF0EF', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: 'pointer' }}
                >
                  Switch to {sendConfig.testMode ? 'Production' : 'Selected'}
                </button>
                <button
                  onClick={async () => {
                    setNewsletterMsg('')
                    try {
                      const res = await authFetch('/api/admin/newsletters/send-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ testMode: sendConfig.testMode, testEmail: sendConfig.testEmail }),
                      })
                      const data = await res.json()
                      if (!res.ok) throw new Error(data.error || 'Unable to save send settings')
                      setNewsletterMsg('✅ Send settings saved')
                      await loadSendConfig()
                    } catch (e: any) {
                      setNewsletterMsg(`⚠️ ${e.message}`)
                    }
                  }}
                  style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: '#FFD166', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: 'pointer' }}
                >
                  Save Settings
                </button>
              </div>
            </div>
            {newsletterMsg && (
              <div style={{ marginBottom: 14, background: 'white', border: '2px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--body)' }}>
                {newsletterMsg}
              </div>
            )}

            <div style={{ background: 'white', border: '2px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Upload Newsletter PDF</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
                <input style={{ ...inp, background: 'white' }} placeholder="Title" value={newsletterTitle} onChange={e => setNewsletterTitle(e.target.value)} />
                <input style={{ ...inp, background: 'white' }} type="date" value={newsletterIssueDate} onChange={e => setNewsletterIssueDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="file" accept="application/pdf" onChange={e => setNewsletterFile(e.target.files?.[0] || null)} />
                <button onClick={saveNewsletter} disabled={savingNewsletter || uploadingPdf} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: '#FFD166', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: savingNewsletter ? 'wait' : 'pointer' }}>
                  {uploadingPdf ? 'Uploading PDF...' : savingNewsletter ? 'Saving...' : 'Save Newsletter'}
                </button>
              </div>
            </div>

            {newsletterLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>Loading newsletters...</div>
            ) : newsletters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>No newsletters uploaded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {newsletters.map(n => (
                  <div key={n.id} style={{ background: 'white', borderRadius: 16, padding: 14, border: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{n.title}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Issue: {n.issue_date}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--hint)' }}>Status: {n.status}{n.sent_at ? ` · Sent: ${new Date(n.sent_at).toLocaleString()}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => previewNewsletter(n.id)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#E6FAF9', color: '#4AADA8', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: 'pointer' }}>Preview</button>
                        <button onClick={() => sendNewsletter(n)} disabled={n.status === 'sending'} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#FFD166', color: '#1A1208', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: n.status === 'sending' ? 'wait' : 'pointer' }}>
                          {n.status === 'sending' ? 'Sending...' : 'Send Next Newsletter to Active Subscribers'}
                        </button>
                        <button onClick={() => deleteNewsletter(n)} disabled={n.status === 'sending'} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: '#FFF0EF', color: '#E07D78', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: n.status === 'sending' ? 'not-allowed' : 'pointer' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {/* CONTACTS */}
        {tab === 'contacts' && (
          <div>
            {contactMsg && (
              <div style={{ marginBottom: 14, background: 'white', border: '2px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--body)' }}>
                {contactMsg}
              </div>
            )}
            {contactLoading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>Loading contact queries...</div>
            ) : contactQueries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontWeight: 700, fontSize: 15 }}>No contact queries yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contactQueries.map(q => (
                  <div key={q.id} style={{ background: 'white', borderRadius: 18, padding: '16px 18px', border: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{q.name} · {q.email}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{q.subject || 'No subject'} · {new Date(q.created_at).toLocaleString()}</div>
                      </div>
                      <button onClick={() => markContactAnswered(q, !q.answered)} style={{ padding: '8px 12px', borderRadius: 10, border: 'none', background: q.answered ? '#FFF0EF' : '#E6FAF9', color: q.answered ? '#E07D78' : '#4AADA8', fontFamily: "'Nunito',sans-serif", fontWeight: 800, cursor: 'pointer' }}>
                        {q.answered ? 'Mark Unanswered' : 'Mark Answered'}
                      </button>
                    </div>
                    <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: 'var(--body)', fontWeight: 600 }}>{q.message}</p>
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
