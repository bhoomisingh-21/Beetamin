import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in'
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up'

/** OAuth return URLs must match these origins (add preview hostnames as plain strings if needed). */
const allowedRedirectOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://thebeetamin.com',
  'https://www.thebeetamin.com',
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      allowedRedirectOrigins={allowedRedirectOrigins}
    >
      <html lang="en" className="antialiased">
        <body className={`${inter.className} bg-[#010803] text-white overflow-x-hidden`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
