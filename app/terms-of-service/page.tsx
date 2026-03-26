import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FFFDF6', padding: '56px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', border: '2px solid #F0E8D4', borderRadius: 20, padding: '28px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#1A1208', marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: '#7E725F', marginBottom: 24, fontWeight: 600 }}>Last Updated: March 26, 2026</p>

        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#2C2016', fontWeight: 600, marginBottom: 20 }}>
          These Terms of Service (“Terms”) govern your access to and use of The Kiddle website, content, and subscription offerings (“Services”). By using the Services, you agree to be bound by these Terms.
        </p>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>1. Eligibility & Account Responsibility</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>You represent that you are at least the age of majority in your jurisdiction and have authority to enter into these Terms. You are responsible for maintaining account confidentiality and all activity under your account credentials.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>2. Service Scope</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>The Kiddle provides educational and recreational newsletter content for young children via parent/guardian-managed access. Services may evolve over time, including feature additions, removals, or modifications.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>3. Subscriptions, Billing, and Renewal</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>Paid plans are billed in advance on a recurring basis according to the plan selected (monthly or yearly unless otherwise stated). By subscribing, you authorize recurring charges through the designated payment method. Taxes may apply where required by law.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>4. Cancellation & Refunds</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>You may cancel in accordance with the cancellation flow provided in your account or billing portal. Unless required by law or explicitly offered by us, fees are non-refundable for elapsed periods. Promotional and trial terms may include separate conditions.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>5. Acceptable Use</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>You agree not to misuse the Services, including unauthorized access attempts, scraping beyond permitted use, copyright infringement, distribution of malicious content, or any unlawful, deceptive, or abusive activity.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>6. Intellectual Property</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>All content, branding, and materials in the Services are owned by The Kiddle or its licensors and protected by applicable intellectual property laws. Except for limited personal, non-commercial use, no rights are granted without written permission.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>7. Disclaimers</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>Services are provided on an “as is” and “as available” basis, without warranties of any kind, to the fullest extent permitted by law. The Kiddle does not guarantee uninterrupted service, specific outcomes, or error-free operation.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>8. Limitation of Liability</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>To the maximum extent permitted by law, The Kiddle and its affiliates will not be liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits/data/goodwill arising from use of the Services.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>9. Termination</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We may suspend or terminate access for violations of these Terms, legal requirements, or security concerns. Termination does not waive obligations accrued prior to termination.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>10. Governing Law</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>These Terms are governed by applicable laws designated by The Kiddle in operational policy. Venue and dispute mechanisms may be updated in future production legal review.</p>
        </section>

        <div style={{ marginTop: 30 }}>
          <Link href="/" style={{ color: '#E07D78', textDecoration: 'none', fontWeight: 800 }}>← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
