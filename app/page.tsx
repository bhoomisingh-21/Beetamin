import { auth } from '@clerk/nextjs/server'
import type { Metadata } from 'next'
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Experts from "@/components/sections/Experts";
import BuiltForYou from "@/components/sections/BuiltForYou";
import ProblemSection from "@/components/sections/ProblemSection";
import Comparison from "@/components/sections/Comparison";
import HowItWorks from "@/components/sections/HowItWorks";
import StatsSection from "@/components/sections/StatsSection";
import PricingSection from "@/components/sections/PricingSection";
import ReferralBanner from "@/components/sections/ReferralBanner";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";
import { HomePageSeoHead } from "@/components/seo/HomePageSeoHead";
import { SitelinkDiscovery } from "@/components/seo/SitelinkDiscovery";
import PageLoader from "@/components/PageLoader";
import ScrollProgress from "@/components/ScrollProgress";
import StickyMobileCTA from "@/components/sections/StickyMobileCTA";
import { hasActiveFullPlanPurchase } from "@/lib/plan-access";

export const metadata: Metadata = {
  title: {
    absolute: 'TheBeetamin — Free Deficiency Assessment + ₹39 PDF Report for India',
  },
  description:
    'Take a free 7-question deficiency assessment. Get a 12-page personalised PDF report covering Vitamin D, Iron, B12 & Omega-3 — with Indian meal plan — for just ₹39. Built for India.',
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
      <Hero />
      <Experts />
      <BuiltForYou />
      <ProblemSection />
      <Comparison />
      <HowItWorks />
      <StatsSection />
      <PricingSection hasFullPlan={hasFullPlan} />
      <ReferralBanner />
      <FAQ />
      <SitelinkDiscovery />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}
