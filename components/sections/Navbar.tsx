"use client";

import { useEffect, useState } from "react";
import { Leaf, Menu, Wallet, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { getWalletBalanceClerk } from "@/lib/referral";

// Clerk users are ALWAYS regular patients.
// Nutritionists use Supabase auth and have their own dashboard navbar — not this component.
const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Us", href: "#comparison" },
  { label: "Our Experts", href: "#experts" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
];



export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletBal, setWalletBal] = useState<number | null>(null);
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) {
      setWalletBal(null);
      return;
    }
    let cancelled = false;
    getWalletBalanceClerk()
      .then((w) => {
        if (!cancelled) setWalletBal(w);
      })
      .catch(() => {
        if (!cancelled) setWalletBal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <div className="bg-[#1A2E24] px-4 py-2 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#F4F1EA]">
          Free 7-question assessment · Personalised PDF from ₹39
        </p>
      </div>
      <nav
        className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
          scrolled
            ? "border-[#E8E4DC] bg-white/95 backdrop-blur-md"
            : "border-transparent bg-white"
        }`}
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8">
            {/* Logo */}
            <a
              href="/"
              className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-offset-4 focus-visible:outline focus-visible:outline-[#2A5340]/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A5340] transition-transform duration-300 group-hover:bg-[#1F3F30] md:h-10 md:w-10">
                <Leaf
                  className="text-white transition-transform duration-300 group-hover:scale-105"
                  size={18}
                  strokeWidth={2}
                />
              </span>
              <span className="font-serif text-[18px] font-medium tracking-tight text-[#111111] md:text-xl">
                TheBeetamin
              </span>
            </a>

            {/* Center nav links */}
            <ul className="hidden md:flex flex-1 items-center justify-center gap-0.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="group relative rounded-full px-3 py-2 text-sm font-medium text-[#333333] transition-colors duration-200 hover:text-black lg:px-4 lg:text-base"
                  >
                    <span className="relative z-10">{label}</span>
                    <span
                      className="absolute inset-x-2 bottom-1.5 h-px scale-x-0 bg-gradient-to-r from-transparent via-[#2A5340] to-transparent transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden
                    />
                  </a>
                </li>
              ))}
            </ul>

            {/* Right: auth buttons */}
            <div className="flex items-center gap-2 md:gap-3">
              {isLoaded && (
                <div className="hidden md:flex items-center gap-2">
                  {!isSignedIn ? (
                    <>
                      <a
                        href="/sign-in"
                        className="rounded-full px-4 py-2 text-sm font-medium text-[#333333] transition-colors duration-200 hover:bg-[#F4F1EA] hover:text-black"
                      >
                        Log In
                      </a>
                      <a
                        href="/sign-up"
                        className="relative overflow-hidden rounded-full bg-[#2A5340] px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-[#1F3F30] active:translate-y-[0.5px]"
                      >
                        Sign Up
                      </a>
                    </>
                  ) : (
                    <>
                      {walletBal != null && walletBal > 0 ? (
                        <Link
                          href="/dashboard/referral"
                          className="hidden items-center gap-1.5 rounded-full border border-[#2A5340]/20 bg-[#EEF5F0] px-3 py-1 text-[13px] font-semibold tabular-nums text-[#2A5340] md:inline-flex"
                          title="Wallet balance"
                        >
                          <Wallet size={12} className="opacity-90" aria-hidden />
                          ₹{walletBal}
                        </Link>
                      ) : null}
                      <a
                        href="/profile"
                        className="rounded-full px-4 py-2 text-sm font-medium text-[#333333] transition-colors duration-200 hover:bg-[#F4F1EA] hover:text-black"
                      >
                        My Profile
                      </a>
                      <a
                        href="/sessions"
                        className="relative overflow-hidden rounded-full bg-[#2A5340] px-5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-[#1F3F30] active:translate-y-[0.5px]"
                      >
                        My Sessions
                      </a>
                    </>
                  )}
                </div>
              )}

              {/* Hamburger */}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#333333] transition-colors hover:bg-[#F4F1EA] hover:text-black md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} strokeWidth={2} />
              </button>
            </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[999] flex flex-col bg-white md:hidden"
          >
            <div className="flex h-[4.25rem] items-center justify-between border-b border-[#E6E1D6] bg-white px-5">
              <a
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2A5340]">
                  <Leaf className="text-white" size={18} strokeWidth={2} />
                </span>
                <span className="font-serif text-[17px] font-medium tracking-tight text-[#1C1A16]">
                  TheBeetamin
                </span>
              </a>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#333333] transition-colors hover:bg-[#EEF5F0] hover:text-black"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center px-5 pb-8" aria-label="Mobile menu">
              {/* Nav links */}
              <ul className="mb-8 space-y-0">
                {NAV_LINKS.map(({ label, href }, i) => (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, ease: "easeOut" }}
                  >
                    <a
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="block border-b border-[#E6E1D6] py-4 text-center font-serif text-xl font-medium tracking-tight text-[#1C1A16] transition-colors hover:text-[#2A5340]"
                    >
                      {label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, ease: "easeOut" }}
                className="space-y-3"
              >
                {isLoaded && !isSignedIn && (
                  <>
                    <a
                      href="/sign-in"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-full border border-[#E6E1D6] bg-white px-6 py-3.5 text-center text-[17px] font-semibold text-[#1C1A16] transition-colors hover:border-[#2A5340]/30"
                    >
                      Log In
                    </a>
                    <a
                      href="/sign-up"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-full bg-[#2A5340] px-6 py-3.5 text-center text-[17px] font-semibold text-white transition hover:bg-[#1F3F30]"
                    >
                      Sign Up
                    </a>
                  </>
                )}

                {isLoaded && isSignedIn && (
                  <>
                    {walletBal != null && walletBal > 0 ? (
                      <Link
                        href="/dashboard/referral"
                        onClick={() => setMenuOpen(false)}
                        className="mb-1 flex items-center justify-center gap-2 rounded-full border border-[#2A5340]/20 bg-[#EEF5F0] px-4 py-3.5 text-[15px] font-semibold tabular-nums text-[#2A5340]"
                      >
                        <Wallet size={16} aria-hidden />
                        ₹{walletBal} wallet
                      </Link>
                    ) : null}
                    <a
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-full border border-[#E6E1D6] bg-white px-6 py-3.5 text-center text-[17px] font-semibold text-[#1C1A16]"
                    >
                      My Profile
                    </a>
                    <a
                      href="/sessions"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-full bg-[#2A5340] px-6 py-3.5 text-center text-[17px] font-semibold text-white hover:bg-[#1F3F30]"
                    >
                      My Sessions
                    </a>
                    <SignOutButton redirectUrl="/">
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full py-3 text-center text-[15px] font-medium text-[#4A4A4A] transition-colors hover:text-black"
                      >
                        Log Out
                      </button>
                    </SignOutButton>
                  </>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
