import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Kiddle – Screen-Free Activities for Kids Ages 3–5',
  description: 'Weekly activity-packed newsletters with offline, screen-free activities for curious kids aged 3–5. Creative, educational, and 100% fun.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
