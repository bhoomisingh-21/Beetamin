import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import HomeSeoContent from "@/components/sections/HomeSeoContent";
import Experts from "@/components/sections/Experts";
import ProblemSection from "@/components/sections/ProblemSection";
import BuiltForYou from "@/components/sections/BuiltForYou";
import Comparison from "@/components/sections/Comparison";
import StatsSection from "@/components/sections/StatsSection";
import HowItWorks from "@/components/sections/HowItWorks";
import AssessmentHero from "@/components/sections/AssessmentHero";
import PricingSection from "@/components/sections/PricingSection";
import ReferralBanner from "@/components/sections/ReferralBanner";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";
import PageLoader from "@/components/PageLoader";
import ScrollProgress from "@/components/ScrollProgress";
import { hasActiveFullPlanPurchase } from "@/lib/plan-access";

export const metadata: Metadata = {
  title: 'TheBeetamin — Personalised Nutrition & Deficiency Recovery',
  description:
    'Take a free deficiency assessment and get a personalised recovery report. Fix Vitamin D, Iron, B12, Omega-3 deficiencies with Indian food and expert sessions.',
  alternates: { canonical: 'https://thebeetamin.com' },
};

export default async function Home() {
  const { userId } = await auth()
  const hasFullPlan = userId ? await hasActiveFullPlanPurchase(userId) : false

  return (
    <div className="bg-[#0A0F0A] min-h-screen">
      <PageLoader />
      <ScrollProgress />
      <Navbar />
      <Hero />
      <HomeSeoContent />
      <Experts />
      <BuiltForYou />
      <ProblemSection />
      <Comparison />
      <HowItWorks />
      <StatsSection />
      <AssessmentHero />
      <PricingSection hasFullPlan={hasFullPlan} />
      <ReferralBanner />
      <FAQ />
      <Footer />
    </div>
  );
}
