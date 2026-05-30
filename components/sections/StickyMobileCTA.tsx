"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function StickyMobileCTA() {
  const { isSignedIn } = useUser();
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<Element | null>(null);

  useEffect(() => {
    heroRef.current = document.querySelector("section[class*='bg-\\[#010d06\\]']") ??
      document.querySelector("section:first-of-type");

    if (!heroRef.current) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  if (isSignedIn) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 px-4 py-3 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href="/assessment"
        className="flex items-center justify-center w-full bg-[#00E676] text-black font-bold rounded-full py-3.5 text-sm shadow-lg"
      >
        Start Free Assessment →
      </Link>
    </div>
  );
}
