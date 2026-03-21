interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 28, className }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      className={className}
      aria-label="WeddingPro logo"
    >
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#e2c97e" />
          <stop offset="50%"  stopColor="#c9a854" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="56" height="56" rx="11" fill="#18181b" />
      {/* Border */}
      <rect width="56" height="56" rx="11" fill="none" stroke="#3f3f46" strokeWidth="1.2" />

      {/* W — Great Vibes (loaded globally via layout) */}
      <text
        x="28"
        y="43"
        fontFamily="'Great Vibes', cursive, serif"
        fontSize="42"
        fill="url(#logoGold)"
        textAnchor="middle"
      >
        W
      </text>
    </svg>
  );
}
