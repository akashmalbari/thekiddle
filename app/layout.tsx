import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://thekiddle.com'),
  title: 'The Kiddle – Weekly Printable Activities for Kids Ages 3–5',
  description:
    'Weekly print-and-play activity workbooks with screen-free science, phonics, storytelling, movement, and more for kids ages 3–5.',
  keywords: [
    'screen-free activities for kids',
    'printable activities for ages 3–5',
    'preschool activity subscription',
    'weekly kids activities',
  ],
  applicationName: 'The Kiddle',
  authors: [{ name: 'The Kiddle', url: 'https://thekiddle.com' }],
  creator: 'The Kiddle',
  publisher: 'The Kiddle',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'The Kiddle – Weekly Printable Activities for Kids Ages 3–5',
    description:
      'A fresh print-and-play activity workbook every week for curious kids ages 3–5.',
    type: 'website',
    url: '/',
    siteName: 'The Kiddle',
    images: [{ url: '/hero.png', alt: 'The Kiddle printable activity workbook' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Kiddle – Weekly Printable Activities for Kids Ages 3–5',
    description: 'A fresh print-and-play activity workbook every week for curious kids ages 3–5.',
    images: ['/hero.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://thekiddle.com/#organization',
    name: 'The Kiddle',
    url: 'https://thekiddle.com',
    logo: 'https://thekiddle.com/icon.svg',
    description: 'Weekly printable, screen-free activity workbooks for children ages 3–5.',
  }

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://thekiddle.com/#website',
    name: 'The Kiddle',
    url: 'https://thekiddle.com',
    publisher: { '@id': 'https://thekiddle.com/#organization' },
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]).replace(/</g, '\\u003c'),
          }}
        />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-H8BKF756K3" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-H8BKF756K3');
          `}
        </Script>
      </body>
    </html>
  )
}
