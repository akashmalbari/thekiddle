import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''
  const payload = token ? verifyUnsubscribeToken(token) : null

  if (!payload) {
    return (
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
        <h1>Unsubscribe link is invalid</h1>
        <p>This link is invalid or expired. Please use the latest email from The Kiddle.</p>
      </main>
    )
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: parent } = await supabaseAdmin
    .from('parents')
    .select('id,email,marketing_email_opt_in,email_token_version')
    .eq('id', payload.sub)
    .maybeSingle()

  if (!parent || parent.email !== payload.email || (parent.email_token_version || 1) !== payload.ver) {
    return (
      <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
        <h1>Unsubscribe link is no longer valid</h1>
        <p>For security, please use the newest email we sent you.</p>
      </main>
    )
  }

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('id,status,cancel_at_period_end,current_period_end')
    .eq('parent_id', parent.id)
    .eq('provider', 'stripe')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px', fontFamily: 'Nunito, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Manage your email & subscription preferences</h1>
      <p style={{ marginBottom: 20 }}>Signed in as: <strong>{parent.email}</strong></p>

      <section style={{ border: '1px solid #E9DDCD', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ marginTop: 0 }}>Email preferences</h2>
        <p>
          Current status: <strong>{parent.marketing_email_opt_in ? 'Subscribed' : 'Unsubscribed'}</strong>
        </p>
        <form method="post" action="/api/unsubscribe/confirm">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="action" value="email_unsubscribe" />
          <button
            type="submit"
            style={{
              border: 0,
              borderRadius: 8,
              padding: '10px 14px',
              background: '#1A1208',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Unsubscribe from emails
          </button>
        </form>
      </section>

      <section style={{ border: '1px solid #E9DDCD', borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Paid subscription</h2>
        {subscription ? (
          <>
            <p>
              Status: <strong>{subscription.status}</strong>
              {subscription.cancel_at_period_end && subscription.current_period_end
                ? ` (ends on ${new Date(subscription.current_period_end).toLocaleDateString()})`
                : ''}
            </p>
            <p style={{ fontSize: 14, color: '#534235' }}>
              Canceling subscription stops future billing. It does not change your email preference by default.
            </p>
            <form method="post" action="/api/unsubscribe/confirm">
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="action" value="cancel_subscription" />
              <input type="hidden" name="mode" value="period_end" />
              <button
                type="submit"
                style={{
                  border: 0,
                  borderRadius: 8,
                  padding: '10px 14px',
                  background: '#B73E3E',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                Cancel subscription at period end
              </button>
            </form>
          </>
        ) : (
          <p>No active subscription found.</p>
        )}
      </section>
    </main>
  )
}
