type Props = {
  variant?: "light" | "dark";
  className?: string;
};

const TRUST_BADGES = [
  "🔒 Secure",
  "📱 UPI, Cards, Net Banking",
  "🔄 No auto-renewal",
] as const;

export function PaymentTrustBlock({ variant = "light", className = "" }: Props) {
  const isDark = variant === "dark";

  return (
    <div className={className}>
      <div className="flex flex-nowrap items-center justify-start gap-2 overflow-x-auto scrollbar-hide">
        {TRUST_BADGES.map((badge) => (
          <span
            key={badge}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap ${
              isDark
                ? "text-white/70 bg-white/5 border border-white/10"
                : "text-gray-500 bg-gray-100"
            }`}
          >
            {badge}
          </span>
        ))}
      </div>

      <div
        className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
          isDark
            ? "bg-emerald-950/40 border border-emerald-500/20"
            : "bg-emerald-50 border border-emerald-200"
        }`}
      >
        <span className="text-xl shrink-0" aria-hidden>
          🛡️
        </span>
        <div>
          <p
            className={`font-bold text-sm ${
              isDark ? "text-emerald-300" : "text-emerald-800"
            }`}
          >
            7-Day Satisfaction Guarantee
          </p>
          <p
            className={`text-xs mt-0.5 leading-snug ${
              isDark ? "text-emerald-400/80" : "text-emerald-700"
            }`}
          >
            If you&apos;re not satisfied after your first session, we&apos;ll refund your
            full payment. No questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}
