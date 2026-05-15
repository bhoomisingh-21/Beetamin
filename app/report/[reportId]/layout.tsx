import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Your Deficiency Recovery Report',
    description:
      'Your personalised nutrient deficiency report from TheBeetamin — prepared by Dr. Priya Sharma.',
    robots: { index: false, follow: false },
  }
}

export default function ReportIdLayout({ children }: { children: React.ReactNode }) {
  return children
}
