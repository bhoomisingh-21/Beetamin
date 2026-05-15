import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { FAQJsonLd, MedicalServiceJsonLd, OrganizationJsonLd } from '@/components/JsonLd'
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
  'https://clerk.thebeetamin.com',
]

export const metadata: Metadata = {
  metadataBase: new URL('https://thebeetamin.com'),

  title: {
    default: 'TheBeetamin — Personalised Nutrition & Deficiency Recovery',
    template: '%s | TheBeetamin',
  },

  description:
    'Get a personalised nutrient deficiency report and expert nutrition sessions with Dr. Priya Sharma. Trusted by Indians to fix Vitamin D, Iron, B12, Omega-3 deficiencies with real food and science.',

  keywords: [
    'nutrient deficiency test India',
    'personalised nutrition plan India',
    'vitamin deficiency report',
    'online nutritionist consultation India',
    'health consultation India',
    'fix vitamin D deficiency India',
    'iron deficiency diet plan',
    'B12 deficiency India',
    'omega 3 deficiency',
    'TheBeetamin',
    'nutrition expert India',
    'deficiency recovery plan',
  ],

  authors: [{ name: 'Dr. Priya Sharma', url: 'https://thebeetamin.com' }],
  creator: 'TheBeetamin',
  publisher: 'TheBeetamin',

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://thebeetamin.com',
    siteName: 'TheBeetamin',
    title: 'TheBeetamin — Personalised Nutrition & Deficiency Recovery',
    description:
      'Fix your Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised report and expert nutritionist sessions. Built for India.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TheBeetamin — Personalised Deficiency Recovery',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'TheBeetamin — Personalised Nutrition & Deficiency Recovery',
    description:
      'Fix your nutrient deficiencies with a personalised report and expert sessions. Built for India.',
    images: ['/og-image.png'],
    creator: '@thebeetamin',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://thebeetamin.com',
  },

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',

  verification: {
    google: 'vocZ7ntJQnQy1wZGHbcNnCmxCMPrv-CchCUruZsYP_Q>',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      allowedRedirectOrigins={allowedRedirectOrigins}
    >
      <html lang="en" className="antialiased">
        <body className={`${inter.className} bg-[#010803] text-white overflow-x-hidden`}>
          <OrganizationJsonLd />
          <MedicalServiceJsonLd />
          <FAQJsonLd />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
