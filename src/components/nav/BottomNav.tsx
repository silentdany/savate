'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { IconAujourdhui, IconHistorique, IconPlan, IconReglages } from './icons'

const ONGLETS = [
  { href: '/', label: 'Séance', Icon: IconAujourdhui },
  { href: '/plan', label: 'Plan', Icon: IconPlan },
  { href: '/historique', label: 'Suivi', Icon: IconHistorique },
  { href: '/reglages', label: 'Réglages', Icon: IconReglages },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-stretch pb-[env(safe-area-inset-bottom)]">
        {ONGLETS.map(({ href, label, Icon }) => {
          const actif = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  'flex h-[4.75rem] min-w-0 flex-col items-center justify-center gap-1 transition-colors',
                  actif ? 'text-accent' : 'text-ink-3 active:text-ink-2'
                )}
              >
                <Icon className="size-7 shrink-0" />
                <span className="w-full truncate px-0.5 text-center text-[16px] font-semibold tracking-[-0.045em]">
                  {label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
