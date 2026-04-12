import Link from 'next/link'

export default function FAQPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#FFFDF6', padding: '56px 20px' }}>
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          background: 'white',
          border: '2px solid #F0E8D4',
          borderRadius: 20,
          padding: '28px',
        }}
      >
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#1A1208', marginBottom: 12 }}>
          Frequently Asked Questions (FAQ)
        </h1>
        <p style={{ fontSize: 14, color: '#7E725F', marginBottom: 28, fontWeight: 600 }}>
          Last Updated: March 26, 2026
        </p>

        {[
          {
            q: 'What is Kiddle?',
            a: 'Kiddle is a weekly learning adventure designed for young children — delivered as a thoughtfully curated activity pack that blends creativity, phonics, logic, and play into meaningful time together.',
          },
          {
            q: 'Who is Kiddle for?',
            a: 'Kiddle is designed for parents, caregivers, and educators of children ages 3–5. Children enjoy the activities, but adults guide the experience.',
          },
          {
            q: 'What do I receive each week?',
            a: 'You’ll receive a new Kiddle Weekly — a thoughtfully curated activity pack with a mix of creative, learning, and play-based experiences, designed so you don’t have to spend time planning or figuring out what to do each week.',
          },
          {
            q: 'Do I need a printer to use Kiddle?',
            a: 'Not necessarily. You can use Kiddle on a tablet or screen, or print it at home, work, or a local print shop — whatever is most convenient for you.',
          },
          {
            q: 'How often will I receive it?',
            a: 'A new Kiddle Weekly is delivered every week. Occasionally, timing may shift slightly due to holidays or updates as we continue improving the experience.',
          },
          {
            q: 'How much time does it take?',
            a: 'Most families spend around 30–40 minutes completing the activities, though this can vary based on your child’s pace and interest.',
          },
          {
            q: 'Is this screen-free?',
            a: 'Kiddle is designed to be used away from screens once opened or printed — helping children learn through hands-on play and real-world interaction.',
          },
          {
            q: 'Can I cancel anytime?',
            a: 'Yes. You can cancel anytime, and your access will continue until the end of your current billing period.',
          },
          {
            q: 'Is this a replacement for school or professional advice?',
            a: 'No. Kiddle is designed to support early learning through play, but it is not a substitute for formal education, medical, or professional advice.',
          },
          {
            q: 'How can I contact support?',
            a: (
              <>
                You can reach us anytime through the{' '}
                <Link
                  href="/#contact"
                  style={{ color: '#E07D78', fontWeight: 800, textDecoration: 'none' }}
                >
                  Contact Us
                </Link>{' '}
                form on our website. We aim to respond as quickly as possible.
              </>
            ),
          },
        ].map((item, i) => (
          <section key={i} style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1208', marginBottom: 8 }}>{item.q}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: '#2C2016', fontWeight: 600 }}>{item.a}</p>
          </section>
        ))}

        <div style={{ marginTop: 30 }}>
          <Link href="/" style={{ color: '#E07D78', textDecoration: 'none', fontWeight: 800 }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
