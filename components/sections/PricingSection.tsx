"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { FullPlanBookingLink } from "@/components/payment/FullPlanBookingLink";
import { UpgradePlanButton } from "@/components/payment/UpgradePlanButton";

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
    <section className="bg-[#050B0D] py-16 sm:py-24 px-4 sm:px-6 overflow-x-hidden" id="pricing">

      <div className="text-center">
        <h2 className="text-white font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-[1.2]">
          Your 90-Day Recovery Plan
        </h2>
        <p className="text-white font-semibold text-lg sm:text-xl mt-1">
          One Price, No Subscription
        </p>
        <p className="text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg">
          Transparent pricing. No hidden fees. Just results.
        </p>
      </div>

      {/* ₹39 starter banner */}
      <div className="max-w-5xl mx-auto mt-10 sm:mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/20 rounded-2xl px-6 py-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-white font-bold text-sm">Just want to know your deficiencies?</p>
              <p className="text-gray-400 text-xs mt-0.5">Take the free assessment → get your 12-page personalised PDF report for <span className="text-emerald-400 font-bold">₹39</span></p>
            </div>
          </div>
          <a
            href="/assessment"
            className="shrink-0 bg-[#00E676] text-black font-bold rounded-full px-5 py-2.5 text-sm hover:bg-[#00c864] transition-all whitespace-nowrap"
          >
            Start Free Assessment →
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-white border-2 border-[#00E676] rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute -top-px -right-px bg-[#00E676] text-black text-[9px] sm:text-[10px] font-bold px-4 sm:px-6 py-2 rounded-tr-[1.4rem] sm:rounded-tr-[1.8rem] rounded-bl-xl sm:rounded-bl-2xl tracking-widest uppercase">
            Most Popular
          </div>

          <p className="text-xl sm:text-2xl font-black text-gray-900 mb-4 sm:mb-6">
            The Core Transformation
          </p>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl sm:text-5xl font-black text-gray-900">₹3,999</span>
            <span className="text-gray-400 text-lg sm:text-xl line-through">₹9,999</span>
          </div>

          <p className="text-gray-500 text-sm mb-6 sm:mb-8">
            Comprehensive 3-month metabolic reset.
          </p>

          <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">
            {CORE_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-[#00E676] shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </li>
            ))}
          </ul>

          {!isLoaded ? (
            <button
              type="button"
              disabled
              className="w-full bg-[#00E676]/70 text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 cursor-wait"
            >
              Loading…
            </button>
          ) : isSignedIn && hasFullPlan ? (
            <Link
              href="/booking"
              className="w-full bg-[#00E676] text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-[#00cf6a] transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <LayoutDashboard size={16} />
              Manage My Booking
            </Link>
          ) : isSignedIn && !hasFullPlan ? (
            <FullPlanBookingLink className="w-full bg-[#00E676] text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-[#00cf6a] transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2">
              Get Started — ₹3,999
            </FullPlanBookingLink>
          ) : (
            <a
              href="/sign-up?redirect_after_auth=%2Fbooking"
              className="w-full bg-[#00E676] text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-[#00cf6a] transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2 text-center"
            >
              Get Started Now
            </a>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
            {[
              "🔒 Secure Payment",
              "📱 UPI, Cards, Net Banking",
              "🔄 No auto-renewal",
            ].map((badge) => (
              <span
                key={badge}
                className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1 font-medium"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Guarantee badge */}
          <div className="mt-5 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <span className="text-xl shrink-0">🛡️</span>
            <div>
              <p className="font-bold text-emerald-800 text-sm">7-Day Satisfaction Guarantee</p>
              <p className="text-emerald-700 text-xs mt-0.5 leading-snug">
                If you&apos;re not satisfied after your first session, we&apos;ll refund your full payment. No questions asked.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative bg-white border border-gray-200 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-10 flex flex-col shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00E676] to-green-300 rounded-t-full" />

          <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
            Single Booster
          </p>

          <p className="text-4xl sm:text-5xl font-black text-gray-900 mb-2">₹499</p>

          <p className="text-gray-500 text-sm mb-6 sm:mb-8">
            Individual focused consultation session.
          </p>

          <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-grow">
            {BOOSTER_FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </li>
            ))}
          </ul>

          {isLoaded && isSignedIn ? (
            <UpgradePlanButton
              mode="booster"
              className="w-full bg-emerald-500 text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-emerald-400 transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              Book a Single Session — ₹499
            </UpgradePlanButton>
          ) : (
            <Link
              href="/sessions"
              className="w-full bg-emerald-500 text-black font-bold py-4 sm:py-5 rounded-xl sm:rounded-2xl hover:bg-emerald-400 transition-all duration-200 text-sm sm:text-base flex items-center justify-center gap-2 text-center"
            >
              Book a Single Session — ₹499
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
