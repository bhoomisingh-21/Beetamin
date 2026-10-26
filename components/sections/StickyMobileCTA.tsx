"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function StickyMobileCTA() {
  const { isSignedIn } = useUser();
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<Element | null>(null);

  useEffect(() => {
    heroRef.current =
      document.querySelector("#hero") ?? document.querySelector("section:first-of-type");

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
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-[#E4DFD4] bg-[#F6F3EC]/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href="/assessment"
        className="flex w-full items-center justify-center rounded-full bg-[#2A5340] py-3.5 text-sm font-semibold text-white"
      >
        Take Your Free Assessment →
      </Link>
    </div>
  );
}
