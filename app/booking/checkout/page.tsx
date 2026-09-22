import { FullPlanCheckoutClient } from '@/components/booking/FullPlanCheckoutClient'

export const metadata = {
  title: 'Complete Your Details — Book a Session',
  description:
    'Enter your details and verify your contact before secure PayU checkout for the ₹3,999 Full Recovery Plan or ₹499 single session.',
}

export default async function FullPlanCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const sp = await searchParams
  const plan = sp.plan === 'booster' ? 'booster' : 'upgrade'
  return <FullPlanCheckoutClient plan={plan} />
}
