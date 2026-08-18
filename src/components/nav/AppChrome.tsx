'use client'

import { usePathname } from 'next/navigation'
import { AvanceAutoSemaine } from '@/components/AvanceAutoSemaine'
import { BottomNav } from './BottomNav'

/**
 * Le runner de seance prend tout l'ecran : pas de nav basse, on ne veut pas
 * d'un tap parasite a cote du bouton "suivant" en pleine serie.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const immersif = pathname.startsWith('/seance/')

  return (
    <>
      <AvanceAutoSemaine />
      <div className={immersif ? 'min-h-dvh' : 'min-h-dvh pb-[calc(4.75rem+env(safe-area-inset-bottom))]'}>
        {children}
      </div>
      {!immersif && <BottomNav />}
    </>
  )
}
