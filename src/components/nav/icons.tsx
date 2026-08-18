type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function IconAujourdhui({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.5 8.8 15.4 12l-4.9 3.2z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconPlan({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 14h4M7.5 17.2h7" />
    </svg>
  )
}

export function IconHistorique({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.2 12a8.8 8.8 0 1 0 2.6-6.2" />
      <path d="M3 4.2v4.2h4.2" />
      <path d="M12 7.6V12l3 1.9" />
    </svg>
  )
}

export function IconReglages({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h11M19 7h1M4 17h3M11 17h9M4 12h7M15 12h5" />
      <circle cx="17" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
      <circle cx="13" cy="12" r="2" />
    </svg>
  )
}
