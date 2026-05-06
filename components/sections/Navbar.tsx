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
  { label: "How it Works", href: "#how-it-works" },
  { label: "Why Us", href: "#comparison" },
  { label: "Our Experts", href: "#experts" },
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
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 overflow-x-hidden"
        aria-label="Primary"
      >
        <div className="mx-auto max-w-7xl px-3 pt-3 pb-2 sm:px-4 md:px-6 lg:px-8 md:pt-4 md:pb-3">
          <div
            className={`relative flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 shadow-2xl shadow-black/40 transition-[box-shadow,background-color,border-color] duration-300 md:px-5 md:py-3 ${
              scrolled
                ? "border-white/[0.12] bg-zinc-950/85 backdrop-blur-2xl supports-[backdrop-filter]:bg-zinc-950/70 ring-1 ring-white/[0.06]"
                : "border-white/[0.08] bg-zinc-950/60 backdrop-blur-xl supports-[backdrop-filter]:bg-zinc-950/45 ring-1 ring-white/[0.04]"
            }`}
          >
            {/* Top hairline accent */}
            <div
              className="pointer-events-none absolute inset-x-4 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent opacity-80"
              aria-hidden
            />

            {/* Logo */}
            <a
              href="/"
              className="group flex shrink-0 items-center gap-2.5 rounded-xl outline-offset-4 focus-visible:outline focus-visible:outline-emerald-500/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500/15 to-emerald-600/5 ring-1 ring-emerald-400/20 transition-transform duration-300 group-hover:ring-emerald-400/35 md:h-10 md:w-10">
                <Leaf
                  className="text-emerald-400 transition-transform duration-300 group-hover:scale-105"
                  size={18}
                  strokeWidth={2}
                />
              </span>
              <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-[17px] font-semibold tracking-tight text-transparent md:text-xl">
                TheBeetamin
              </span>
            </a>

            {/* Center nav links */}
            <ul className="hidden md:flex flex-1 items-center justify-center gap-0.5">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="group relative rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:text-white"
                  >
                    <span className="relative z-10">{label}</span>
                    <span
                      className="absolute inset-x-2 bottom-1.5 h-px scale-x-0 bg-gradient-to-r from-transparent via-emerald-400/90 to-transparent transition-transform duration-300 group-hover:scale-x-100"
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
                        className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
                      >
                        Log In
                      </a>
                      <a
                        href="/sign-up"
                        className="relative overflow-hidden rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_-4px_rgba(16,185,129,0.45)] transition-[transform,box-shadow,filter] duration-200 hover:from-emerald-300 hover:to-emerald-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_12px_32px_-4px_rgba(16,185,129,0.55)] active:translate-y-[0.5px]"
                      >
                        Sign Up
                      </a>
                    </>
                  ) : (
                    <>
                      {walletBal != null && walletBal > 0 ? (
                        <Link
                          href="/dashboard/referral"
                          className="hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[13px] font-semibold tabular-nums text-emerald-300 ring-1 ring-emerald-400/15 backdrop-blur-sm transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/15 md:inline-flex"
                          title="Wallet balance"
                        >
                          <Wallet size={12} className="opacity-90" aria-hidden />
                          ₹{walletBal}
                        </Link>
                      ) : null}
                      <a
                        href="/profile"
                        className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
                      >
                        My Profile
                      </a>
                      <a
                        href="/sessions"
                        className="relative overflow-hidden rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_24px_-4px_rgba(16,185,129,0.45)] transition-[transform,box-shadow,filter] duration-200 hover:from-emerald-300 hover:to-emerald-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_12px_32px_-4px_rgba(16,185,129,0.55)] active:translate-y-[0.5px]"
                      >
                        My Sessions
                      </a>
                    </>
                  )}
                </div>
              )}

              {/* Hamburger */}
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[999] flex flex-col bg-zinc-950/98 backdrop-blur-2xl md:hidden"
          >
            <div className="flex h-[4.25rem] items-center justify-between border-b border-white/[0.08] bg-zinc-950/50 px-5">
              <a
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setMenuOpen(false)}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500/15 to-emerald-600/5 ring-1 ring-emerald-400/20">
                  <Leaf className="text-emerald-400" size={18} strokeWidth={2} />
                </span>
                <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-[17px] font-semibold tracking-tight text-transparent">
                  TheBeetamin
                </span>
              </a>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
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
                      className="block border-b border-white/[0.06] py-4 text-center text-xl font-semibold tracking-tight text-white transition-colors hover:text-emerald-300"
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
                      className="block w-full rounded-2xl border border-white/[0.12] bg-white/[0.03] px-6 py-4 text-center text-[17px] font-semibold text-white ring-1 ring-white/[0.04] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      Log In
                    </a>
                    <a
                      href="/sign-up"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-4 text-center text-[17px] font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_-8px_rgba(16,185,129,0.55)] transition-[filter,box-shadow] hover:from-emerald-300 hover:to-emerald-500"
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
                        className="mb-1 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 text-[15px] font-semibold tabular-nums text-emerald-300 ring-1 ring-emerald-400/15"
                      >
                        <Wallet size={16} aria-hidden />
                        ₹{walletBal} wallet
                      </Link>
                    ) : null}
                    <a
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-2xl border border-white/[0.12] bg-white/[0.03] px-6 py-4 text-center text-[17px] font-semibold text-white ring-1 ring-white/[0.04] transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      My Profile
                    </a>
                    <a
                      href="/sessions"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-4 text-center text-[17px] font-semibold text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_-8px_rgba(16,185,129,0.55)] transition-[filter,box-shadow] hover:from-emerald-300 hover:to-emerald-500"
                    >
                      My Sessions
                    </a>
                    <SignOutButton redirectUrl="/">
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full py-3 text-center text-[15px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
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
