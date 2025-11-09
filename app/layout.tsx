import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import ReduxProvider from './providers/ReduxProvider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'playlive24',
  description: 'playlive24',
  generator: 'playlive24',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <ReduxProvider>
          {children}
          <Analytics />
          <Toaster position="top-right" richColors />
        </ReduxProvider>
      </body>
    </html>
  )
}
