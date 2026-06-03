import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'GorHub — Business Management Platform',
  description: 'Manage your products, orders, and tasks in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
