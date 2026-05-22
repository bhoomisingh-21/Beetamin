/** Navbar-style icon mark for favicons (ImageResponse / OG). */
export function BeetaminIconMark({ boxSize }: { boxSize: number }) {
  const pad = Math.round(boxSize * 0.16)
  const inner = boxSize - pad * 2
  const leaf = Math.round(inner * 0.55)

  return (
    <div
      style={{
        width: boxSize,
        height: boxSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#010803',
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: Math.round(inner * 0.22),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.35)',
        }}
      >
        <svg
          width={leaf}
          height={leaf}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#34d399"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 18 2c1 2 2 4.5 2 8a6 6 0 0 1-9 10z" />
          <path d="M12 20c0-4-1.5-6-3-8" />
        </svg>
      </div>
    </div>
  )
}
