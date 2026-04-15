// RootLayout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.className} bg-[#010803] text-white overflow-x-hidden`}>
        {/* Announcement banner */}
        <div className="bg-[#051109] text-[#22C55E] text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] text-center py-2 border-b border-white/5 uppercase px-4">
          ⚠️ Silent Deficiency Alert: 88% of chronic fatigue begins with undetected nutrient gaps
        </div>

        {children}
      </body>
    </html>
  );
}
