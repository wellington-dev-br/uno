import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UNO Online - Play with Friends',
  description: 'Play UNO online with friends in real-time. Ranked matches, achievements, and more!',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-bga-dark text-white`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
