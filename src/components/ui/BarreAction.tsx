'use client'

import { usePathname } from 'next/navigation'

/**
 * Barre d'action collee en bas, au-dessus de la nav : le bouton principal doit
 * tomber sous le pouce, jamais en haut de l'ecran.
 */
export function BarreAction({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const auDessusDeLaNav = !pathname.startsWith('/seance/')
  return (
    <div
      className="fixed inset-x-0 z-30"
      style={{
        bottom: auDessusDeLaNav ? 'calc(4.75rem + env(safe-area-inset-bottom))' : '0px',
      }}
    >
      <div className="pointer-events-none h-10 bg-gradient-to-t from-bg via-bg/85 to-transparent" />
      <div
        className="mx-auto max-w-md bg-bg px-5 pt-1"
        style={{ paddingBottom: auDessusDeLaNav ? '0.75rem' : 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {children}
      </div>
    </div>
  )
}
