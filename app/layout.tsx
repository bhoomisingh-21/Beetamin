import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="antialiased">
        <body className={`${inter.className} bg-[#010803] text-white overflow-x-hidden`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
