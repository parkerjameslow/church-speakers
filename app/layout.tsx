import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sacrament Speaker Tracker',
  description: 'Ward sacrament meeting speaker management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F2F2F2] min-h-screen">{children}</body>
    </html>
  )
}
