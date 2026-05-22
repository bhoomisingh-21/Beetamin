import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import {
  FAQJsonLd,
  MedicalServiceJsonLd,
  OrganizationJsonLd,
  SiteNavigationJsonLd,
  WebSiteJsonLd,
} from '@/components/JsonLd'
import { CrawlableSiteNav } from '@/components/seo/CrawlableSiteNav'
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
    default: 'TheBeetamin — Your Personalised Deficiency Recovery Platform for India',
    template: '%s | TheBeetamin',
  },

  description:
    'Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report, Indian meal plan, and expert nutritionist sessions — Dr. Priya Sharma. Built for India. Starting at ₹39.',

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
    title: 'TheBeetamin — Your Personalised Deficiency Recovery Platform for India',
    description:
      'Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report, Indian meal plan, and expert nutritionist sessions — Dr. Priya Sharma. Built for India. Starting at ₹39.',
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
    title: 'TheBeetamin — Your Personalised Deficiency Recovery Platform for India',
    description:
      'Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report, Indian meal plan, and expert nutritionist sessions. Built for India.',
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

  applicationName: 'TheBeetamin',

  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },

  manifest: '/site.webmanifest',

  verification: {
    google: 'vocZ7ntJQnQy1wZGHbcNnCmxCMPrv-CchCUruZsYP_Q',
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
          <WebSiteJsonLd />
          <OrganizationJsonLd />
          <MedicalServiceJsonLd />
          <SiteNavigationJsonLd />
          <FAQJsonLd />
          <CrawlableSiteNav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
