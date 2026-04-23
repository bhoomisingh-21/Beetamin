"use client";

import { useEffect, useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, SignOutButton } from "@clerk/nextjs";

// Clerk users are ALWAYS regular patients.
// Nutritionists use Supabase auth and have their own dashboard navbar — not this component.
const NAV_LINKS = [
  { label: "How it Works", href: "#how-it-works" },
  { label: "Our Experts", href: "#experts" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoaded, isSignedIn } = useUser();

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
        className={`sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-white/5 transition-shadow duration-300 overflow-x-hidden ${
          scrolled ? "shadow-[0_4px_24px_rgba(0,0,0,0.6)]" : "shadow-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <Leaf className="text-emerald-500" size={20} />
            <span className="text-white font-bold text-base md:text-xl">TheBeetamin</span>
          </a>

          {/* Center nav links */}
          <ul className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  className="text-gray-300 text-sm hover:text-emerald-400 transition-colors duration-200"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Right: auth buttons */}
          <div className="flex items-center gap-3 md:gap-4">
            {isLoaded && (
              <div className="hidden md:flex items-center gap-3">
                {!isSignedIn ? (
                  <>
                    <a
                      href="/sign-in"
                      className="text-gray-300 hover:text-white text-sm font-medium transition"
                    >
                      Log In
                    </a>
                    <a
                      href="/sign-up"
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full px-5 py-2 text-sm transition-all duration-200 hover:scale-105"
                    >
                      Sign Up
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="/booking/profile"
                      className="text-gray-300 hover:text-white text-sm font-medium transition"
                    >
                      My Profile
                    </a>
                    <a
                      href="/booking/dashboard"
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full px-5 py-2 text-sm transition-all duration-200 hover:scale-105"
                    >
                      My Sessions
                    </a>
                  </>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button
              className="md:hidden text-gray-300 hover:text-white transition-colors p-1"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
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
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-6 h-14 border-b border-white/10">
              <a href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                <Leaf className="text-emerald-500" size={20} />
                <span className="text-white font-bold text-base">TheBeetamin</span>
              </a>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="text-gray-300 hover:text-white transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center px-6">
              {/* Nav links */}
              <ul className="space-y-0 mb-6">
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
                      className="block text-white text-xl font-semibold py-4 border-b border-white/10 hover:text-emerald-400 transition-colors text-center"
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
                      className="block w-full text-center border border-white/20 text-white font-bold rounded-full px-6 py-4 text-base hover:bg-white/5 transition"
                    >
                      Log In
                    </a>
                    <a
                      href="/sign-up"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center bg-emerald-500 text-black font-bold rounded-full px-6 py-4 text-base hover:bg-emerald-400 transition"
                    >
                      Sign Up
                    </a>
                  </>
                )}

                {isLoaded && isSignedIn && (
                  <>
                    <a
                      href="/booking/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center border border-white/20 text-white font-bold rounded-full px-6 py-4 text-base hover:bg-white/5 transition"
                    >
                      My Profile
                    </a>
                    <a
                      href="/booking/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center bg-emerald-500 text-black font-bold rounded-full px-6 py-4 text-base hover:bg-emerald-400 transition"
                    >
                      My Sessions
                    </a>
                    <SignOutButton redirectUrl="/">
                      <button
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-center text-gray-500 text-sm py-2 hover:text-white transition"
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
