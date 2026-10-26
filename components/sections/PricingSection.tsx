"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { FullPlanBookingLink } from "@/components/payment/FullPlanBookingLink";

const CORE_FEATURES = [
  "6 Expert Nutrition Sessions",
  "3 Months Validity",
  "Doctor-reviewed guidance",
  "Personalized vitamin plan",
];

const BOOSTER_FEATURES = [
  "1 Expert Session",
  "30 Min Duration",
  "Doctor-reviewed guidance",
  "Try one session before committing to the full plan.",
];

type Props = {
  /** Server-verified — do not infer from client state alone. */
  hasFullPlan: boolean;
};

export default function PricingSection({ hasFullPlan }: Props) {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <section className="scroll-mt-20 overflow-x-hidden bg-[#F6F3EC] px-4 py-12 sm:px-6 sm:py-24" id="pricing">

      <div className="text-center">
        <h2 className="font-serif text-3xl font-medium leading-[1.2] tracking-tight text-[#1C1A16] sm:text-4xl md:text-5xl">
          Your 90-Day Recovery Plan
        </h2>
        <p className="mt-2 font-serif text-lg italic text-[#2A5340] sm:text-xl">
          One Price, No Subscription
        </p>
        <p className="mx-auto mt-4 max-w-5xl px-2 text-sm leading-relaxed text-[#333333] sm:mt-5 sm:text-base md:whitespace-nowrap md:leading-[1.85]">
          Most clients choose the full programme —{" "}
          <span className="font-semibold text-[#2A5340]">₹3,999 one-time</span>, 6 sessions, 90
          days. Includes a{" "}
          <Link href="/deficiency-recovery-report" className="text-[#2A5340] underline-offset-2 hover:underline">
            personalised deficiency report
          </Link>
          . No subscription.
        </p>
      </div>

      <div className="max-w-5xl mx-auto mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col rounded-[1.5rem] bg-[#2A5340] p-6 text-white shadow-[0_24px_60px_rgba(42,83,64,0.28)] transition-all duration-300 hover:-translate-y-1 sm:rounded-[2rem] sm:p-10"
        >
          <div className="absolute -right-px -top-px rounded-bl-xl rounded-tr-[1.4rem] bg-[#C4A35A] px-4 py-2 text-[9px] font-semibold uppercase tracking-widest text-[#1A2E24] sm:rounded-bl-2xl sm:rounded-tr-[1.8rem] sm:px-6 sm:text-[10px]">
            Most Popular
          </div>

          <p className="mb-4 font-serif text-xl font-medium text-white sm:mb-6 sm:text-2xl">
            The Core Transformation
          </p>

          <div className="mb-2 flex items-baseline gap-3">
            <span className="font-serif text-4xl font-medium text-white sm:text-5xl">₹3,999</span>
            <span className="text-lg text-white/50 line-through sm:text-xl">₹9,999</span>
          </div>

          <p className="mb-2 text-sm text-[#E8E4DC]">
            Our flagship programme — 6 live sessions over 90 days.
          </p>
          <p className="mb-6 text-xs font-semibold text-[#C5D4CB] sm:mb-8">
            Best value · One-time payment · Doctor-reviewed plan
          </p>

          <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">
            {CORE_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="shrink-0 text-[#C5D4CB]" />
                <span className="text-sm text-white">{item}</span>
              </li>
            ))}
          </ul>

          {!isLoaded ? (
            <button
              type="button"
              disabled
              className="flex w-full cursor-wait items-center justify-center gap-2 rounded-full bg-white/70 py-4 text-sm font-semibold text-[#2A5340] sm:py-5 sm:text-base"
            >
              Loading…
            </button>
          ) : isSignedIn && hasFullPlan ? (
            <Link
              href="/booking"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-sm font-semibold text-[#2A5340] transition-all duration-200 hover:bg-[#F6F3EC] sm:py-5 sm:text-base"
            >
              <LayoutDashboard size={16} />
              Manage My Booking
            </Link>
          ) : isSignedIn && !hasFullPlan ? (
            <FullPlanBookingLink className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-sm font-semibold text-[#2A5340] transition-all duration-200 hover:bg-[#F6F3EC] sm:py-5 sm:text-base">
              Book 90-Day Plan — ₹3,999
            </FullPlanBookingLink>
          ) : (
            <a
              href="/sign-up?redirect_after_auth=%2Fbooking%2Fcheckout"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-center text-sm font-semibold text-[#2A5340] transition-all duration-200 hover:bg-[#F6F3EC] sm:py-5 sm:text-base"
            >
              Book 90-Day Plan — ₹3,999
            </a>
          )}

          {/* Trust badges — single row */}
          <div className="flex flex-nowrap items-center justify-center gap-2 mt-4 overflow-x-auto scrollbar-hide">
            {[
              "🔒 Secure",
              "📱 UPI, Cards, Net Banking",
              "🔄 No auto-renewal",
            ].map((badge) => (
              <span
                key={badge}
                className="shrink-0 whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-[#E8E4DC]"
              >
                {badge}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-white border border-gray-200 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 flex flex-col shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute left-0 right-0 top-0 h-1 rounded-t-full bg-[#2A5340]/30" />

          <p className="mb-4 font-serif text-xl font-medium text-[#1C1A16] sm:mb-6 sm:text-2xl">
            Single Booster
          </p>

          <p className="mb-2 font-serif text-4xl font-medium text-[#1C1A16] sm:text-5xl">₹499</p>

          <p className="mb-6 text-sm text-[#333333] sm:mb-8">
            Individual focused consultation session.
          </p>

          <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">
            {BOOSTER_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="shrink-0 text-[#2A5340]" />
                <span className="text-sm text-[#1A1A1A]">{item}</span>
              </li>
            ))}
          </ul>

          {isLoaded && isSignedIn ? (
            <FullPlanBookingLink
              plan="booster"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2A5340] py-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1F3F30] sm:py-5 sm:text-base"
            >
              Book a Single Session — ₹499
            </FullPlanBookingLink>
          ) : (
            <a
              href="/sign-up?redirect_after_auth=%2Fbooking%2Fcheckout%3Fplan%3Dbooster"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2A5340] py-4 text-center text-sm font-semibold text-white transition-all duration-200 hover:bg-[#1F3F30] sm:py-5 sm:text-base"
            >
              Book a Single Session — ₹499
            </a>
          )}
        </motion.div>
      </div>
    </section>
  );
}
