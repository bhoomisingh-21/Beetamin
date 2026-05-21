import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Deficiency Report',
  description:
    'Take a free health assessment and get a personalised nutrient deficiency report with a 7-day Indian meal plan. Fix Vitamin D, Iron, B12 and Omega-3 gaps. From ₹39.',
  alternates: { canonical: 'https://thebeetamin.com/assessment' },
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
