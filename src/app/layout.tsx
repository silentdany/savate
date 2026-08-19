import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppChrome } from '@/components/nav/AppChrome'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'Savate',
  description: 'Plan de savate boxe francaise sur 8 semaines, utilisable au dojo, hors ligne.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Savate',
  appleWebApp: { capable: true, title: 'Savate', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false, date: false, address: false, email: false },
}

export const viewport: Viewport = {
  themeColor: '#08090c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Le zoom reste autorise : le desactiver casserait l'accessibilite.
  // Le double-tap-zoom est neutralise par touch-action: manipulation.
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <ServiceWorkerRegistrar />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  )
}
