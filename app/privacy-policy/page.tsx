import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FFFDF6', padding: '56px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', border: '2px solid #F0E8D4', borderRadius: 20, padding: '28px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#1A1208', marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: '#7E725F', marginBottom: 24, fontWeight: 600 }}>Last Updated: March 26, 2026</p>

        <p style={{ fontSize: 15, lineHeight: 1.8, color: '#2C2016', fontWeight: 600, marginBottom: 20 }}>
          This Privacy Policy explains how The Kiddle (“we,” “us,” “our”) collects, uses, discloses, and safeguards personal information when you use our website and subscription services. By using our services, you acknowledge and agree to the practices described below.
        </p>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>1. Information We Collect</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We may collect: (a) account and profile data (name, email, subscription selections), (b) child-related profile details submitted by a parent or guardian (e.g., first name, age range), (c) support messages and contact form submissions, and (d) technical and usage data such as device/browser metadata, IP-derived location, and interaction analytics.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>2. How We Use Information</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We process information to provide and improve services, personalize content, operate billing and subscription workflows, respond to inquiries, send transactional/service communications, prevent abuse, and comply with legal obligations.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>3. Lawful Basis & Children’s Data</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>Where required by applicable law, we rely on contract performance, legitimate interests, legal obligations, and/or consent. We expect child-related data to be submitted only by a parent or legal guardian. We do not knowingly permit children to create direct accounts.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>4. Sharing & Service Providers</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We may share information with vetted processors (e.g., hosting, database, email delivery, payment infrastructure, analytics) under contractual safeguards. We may also disclose data where required by law, legal process, or to protect rights, safety, and platform integrity.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>5. Data Retention</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We retain personal information for as long as necessary for service delivery, dispute resolution, compliance, and recordkeeping. Retention windows may vary by data category and legal obligations.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>6. Security</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We implement commercially reasonable technical and organizational safeguards. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>7. Your Rights</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>Depending on jurisdiction, you may have rights to access, correct, delete, port, or object to certain processing. To exercise rights requests, contact us using the Contact Us form. We may verify your identity before fulfilling requests.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>8. International Transfers</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>Your information may be processed in countries other than your own. Where required, we apply appropriate transfer safeguards under applicable data protection laws.</p>
        </section>

        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>9. Policy Updates</h2>
          <p style={{ fontSize: 15, lineHeight: 1.75, fontWeight: 600 }}>We may update this Privacy Policy periodically. Material changes will be reflected by an updated “Last Updated” date and, where appropriate, additional notice.</p>
        </section>

        <div style={{ marginTop: 30 }}>
          <Link href="/" style={{ color: '#E07D78', textDecoration: 'none', fontWeight: 800 }}>← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
