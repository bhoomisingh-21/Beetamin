"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "How is Beetamin different from other nutrition apps?",
    a: "TheBeetamin connects you with certified nutritionists who build plans from your assessment, goals, and medical history — reviewed by a doctor before delivery.",
  },
  {
    q: "Do I need to do blood tests before starting?",
    a: "No blood tests required upfront. We start with a comprehensive health assessment and symptom questionnaire. Your nutritionist may recommend specific tests later as part of your protocol.",
  },
  {
    q: "What happens after I complete the free assessment?",
    a: "You'll receive an instant summary of your likely nutrient gaps. A nutritionist will then reach out within 24 hours to schedule your 1-on-1 consultation call.",
  },
  {
    q: "Is the ₹3,999 plan a one-time payment or a subscription?",
    a: "It's a one-time payment that covers 3 full months — including all expert sessions, your personalised plan, fortnightly check-ins, and WhatsApp support. No recurring charges.",
  },
  {
    q: "What is your refund policy?",
    a: "If you're unsatisfied after your first session, contact us at hi@thebeetamin.com within 7 days of purchase for a full refund. No questions asked.",
  },
  {
    q: "Who exactly will be my nutritionist?",
    a: "After purchase, you'll be matched with one of our certified nutritionists based on your assessment results and health goals. You'll see their full profile — including their specialty, experience, and credentials — before your first session.",
  },
];


export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14 sm:py-16 px-4 sm:px-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-gray-900 font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
            Common{" "}
            <span className="text-[#00E676]">Questions</span>
          </h2>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            Everything you need to know about your journey. Still unsure?{" "}
            <a href="mailto:hi@thebeetamin.com" className="text-emerald-600 hover:underline font-medium">
              Email us
            </a>
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="p-4 sm:p-5 flex justify-between items-start gap-3 sm:gap-4">
                <p className="text-gray-900 font-semibold text-sm sm:text-base leading-snug text-center lg:text-left w-full">
                  {faq.q}
                </p>
                <ChevronDown
                  size={17}
                  className={`text-gray-400 transition-transform duration-300 shrink-0 mt-0.5 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-500 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}