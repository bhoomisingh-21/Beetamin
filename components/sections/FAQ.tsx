"use client";

import { useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  {
    q: "How is Beetamin different from other nutrition apps?",
    a: "Beetamin pairs you with a real certified nutritionist — not an algorithm. Every plan is built from scratch for your body, goals, and medical history, then reviewed by a doctor before it reaches you.",
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
    q: "Is the ₹2,999 plan a one-time payment or a subscription?",
    a: "It's a one-time payment that covers 3 full months — including all expert sessions, your personalised plan, fortnightly check-ins, and WhatsApp support. No recurring charges.",
  },
];

const AVATARS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-14 sm:py-16 px-4 sm:px-6 overflow-x-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-start">

        {/* LEFT */}
        <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
          <h2 className="text-gray-900 font-black text-3xl sm:text-4xl md:text-5xl leading-tight">
            Common <br />
            <span className="text-[#00E676]">Questions</span>
          </h2>

          <p className="text-gray-500 mt-3 text-sm sm:text-base max-w-md mx-auto lg:mx-0">
            Everything you need to know about your journey.
          </p>

          {/* Support Card */}
          <div className="mt-6 sm:mt-8 bg-white border border-gray-100 shadow-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-auto lg:mx-0">
            <div className="flex justify-center -space-x-3">
              {AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Support"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>

            <p className="text-gray-900 font-semibold text-base sm:text-lg mt-4 sm:mt-5 text-center">
              Still have questions?
            </p>
            <p className="text-gray-500 text-sm mt-1 mb-4 sm:mb-5 text-center">
              Talk to our team anytime.
            </p>

            <button className="w-full bg-[#010810] text-white rounded-full py-3 font-semibold flex items-center justify-center gap-2 hover:bg-black transition text-sm sm:text-base">
              <MessageCircle size={17} />
              Chat with Us
            </button>
          </div>
        </div>

        {/* RIGHT */}
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
                    <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-500 text-sm leading-relaxed text-center lg:text-left">
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