import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Deficiency Assessment — TheBeetamin',
  description:
    'Take the free 2-minute quiz to find out which nutrients you are deficient in. Get a personalised Indian meal plan and recovery report instantly.',
  alternates: { canonical: 'https://www.thebeetamin.com/assessment' },
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
