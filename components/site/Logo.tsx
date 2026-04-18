type LogoSize = 'sm' | 'md' | 'lg'

export function Logo({ size = 'md' }: { size?: LogoSize }) {
  const s = {
    sm: { the: 12, main: 24, pencil: 9 },
    md: { the: 15, main: 32, pencil: 12 },
    lg: { the: 20, main: 48, pencil: 18 },
  }[size]

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1, userSelect: 'none' }}>
      <span
        style={{
          fontFamily: "'Baloo 2',cursive",
          fontSize: s.the,
          fontWeight: 800,
          color: '#FFAAA5',
          lineHeight: 1,
          marginBottom: -2,
        }}
      >
        The
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: "'Baloo 2',cursive",
            fontSize: s.main,
            fontWeight: 800,
            color: '#FFD166',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          K
        </span>
        <svg width={s.pencil} height={s.main * 0.88} viewBox="0 0 20 48" style={{ margin: `0 ${s.main * 0.025}px`, flexShrink: 0 }}>
          <rect x="5" y="0" width="10" height="7" rx="3.5" fill="#6ECDC8" />
          <rect x="5" y="7" width="10" height="31" rx="2" fill="#FFAAA5" />
          <polygon points="5,38 15,38 10,48" fill="#FFD166" />
        </svg>
        <span
          style={{
            fontFamily: "'Baloo 2',cursive",
            fontSize: s.main,
            fontWeight: 800,
            color: '#FFD166',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          ddle
        </span>
      </div>
    </div>
  )
}
