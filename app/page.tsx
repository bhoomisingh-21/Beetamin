import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import ProblemSection from "@/components/sections/ProblemSection";
import BuiltForYou from "@/components/sections/BuiltForYou";
import HowItWorks from "@/components/sections/HowItWorks";
import Experts from "@/components/sections/Experts";
import Comparison from "@/components/sections/Comparison";
import StatsSection from "@/components/sections/StatsSection";
import LeadMagnet from "@/components/sections/LeadMagnet";
import PricingSection from "@/components/sections/PricingSection";
import FAQ from "@/components/sections/FAQ";
import ReferralBanner from "@/components/sections/ReferralBanner";
import Footer from "@/components/sections/Footer";
import { HomePageSeoHead } from "@/components/seo/HomePageSeoHead";
import { SitelinkDiscovery } from "@/components/seo/SitelinkDiscovery";
import PageLoader from "@/components/PageLoader";
import ScrollProgress from "@/components/ScrollProgress";
import StickyMobileCTA from "@/components/sections/StickyMobileCTA";
import { hasActiveFullPlanPurchase } from "@/lib/plan-access";

export const metadata: Metadata = {
  title: {
    absolute: 'TheBeetamin — Your Personalised Deficiency Recovery Platform for India',
  },
  description:
    'Fix Vitamin D, Iron, B12 and Omega-3 deficiencies with a personalised recovery report, Indian meal plan, and expert nutritionist sessions — Dr. Priya Sharma. Built for India.',
  alternates: { canonical: 'https://www.thebeetamin.com' },
};

export default async function Home() {
  const { userId } = await auth()
  const hasFullPlan = userId ? await hasActiveFullPlanPurchase(userId) : false

  return (
    <div className="bg-[#0A0F0A] min-h-screen">
      <HomePageSeoHead />
      <PageLoader />
      <ScrollProgress />
      <Navbar />
      {/* Section order: Hero → Problem recognition → Science/cells → How it works → Experts → Why Us → Stats → Lead magnet → Pricing → FAQ → Referral → Footer */}
      <Hero />
      <BuiltForYou />
      <ProblemSection />
      <HowItWorks />
      <Experts />
      <Comparison />
      <StatsSection />
      <LeadMagnet />
      <PricingSection hasFullPlan={hasFullPlan} />
      <FAQ />
      <ReferralBanner />
      <SitelinkDiscovery />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}
