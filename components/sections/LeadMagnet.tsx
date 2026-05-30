"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Mail } from "lucide-react";

export default function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* fail silently */
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <section className="bg-[#f0fdf4] py-14 sm:py-20 px-4 sm:px-6 overflow-x-hidden">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-6">
            <BookOpen size={24} className="text-emerald-600" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
            Get Your Free Deficiency Starter Guide
          </h2>

          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            A 12-page PDF covering the top 4 deficiencies in India, their symptoms, and the best Indian foods to fix them.{" "}
            <span className="font-semibold text-emerald-700">Free, instantly.</span>
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-3 bg-emerald-600 text-white font-semibold rounded-2xl px-8 py-4 text-base shadow-lg">
              ✅ Check your inbox! Your guide is on its way.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#00E676] text-black font-bold rounded-xl px-6 py-3.5 text-sm hover:bg-[#00c864] transition-all disabled:opacity-60 whitespace-nowrap shadow-md"
              >
                {loading ? "Sending…" : "Send me the free guide"}
              </button>
            </form>
          )}

          <p className="text-gray-400 text-xs mt-4">
            No spam. Unsubscribe anytime. Used only to send your guide.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
