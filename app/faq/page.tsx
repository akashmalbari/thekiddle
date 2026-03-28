import Link from 'next/link'

export default function FAQPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FFFDF6', padding: '56px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: 'white', border: '2px solid #F0E8D4', borderRadius: 20, padding: '28px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#1A1208', marginBottom: 12 }}>Frequently Asked Questions (FAQ)</h1>
        <p style={{ fontSize: 14, color: '#7E725F', marginBottom: 28, fontWeight: 600 }}>Last Updated: March 26, 2026</p>

        {[{
          q: 'What is The Kiddle?',
          a: 'The Kiddle is a digital newsletter service for parents and caregivers of children ages 3–5, offering age-appropriate, screen-free learning and activity content delivered by email on a recurring basis.'
        }, {
          q: 'Who should use The Kiddle?',
          a: 'The service is designed for adults (parents, legal guardians, caregivers, and educators). Children are intended beneficiaries of the activities but should not create accounts or purchase plans directly.'
        }, {
          q: 'How often do newsletters arrive?',
          a: 'Paid plans include weekly delivery, subject to occasional operational adjustments, maintenance windows, and holiday scheduling changes.'
        }, {
          q: 'Do you provide medical, psychological, or educational guarantees?',
          a: 'No. The Kiddle provides general informational and recreational content only. It is not medical, therapeutic, legal, or individualized educational advice, and outcomes may vary.'
        }, {
          q: 'Can I cancel my subscription?',
          a: 'Yes. You may cancel according to your subscription terms. Access generally continues through the end of the active billing period unless otherwise required by law or disclosed at checkout.'
        }, {
          q: 'How can I contact support?',
          a: (
            <>
              Use the <Link href="/#contact" style={{ color: '#E07D78', fontWeight: 800, textDecoration: 'none' }}>Contact Us</Link> form on our website. We review inquiries in the order received and make reasonable efforts to respond promptly.
            </>
          )
        }].map((item, i) => (
          <section key={i} style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1208', marginBottom: 8 }}>{item.q}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: '#2C2016', fontWeight: 600 }}>{item.a}</p>
          </section>
        ))}

        <div style={{ marginTop: 30 }}>
          <Link href="/" style={{ color: '#E07D78', textDecoration: 'none', fontWeight: 800 }}>← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
