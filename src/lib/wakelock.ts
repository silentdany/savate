'use client'

import { useCallback, useEffect, useRef } from 'react'

type Sentinel = { released: boolean; release: () => Promise<void> }

/**
 * Wake lock d'ecran pour toute la duree d'une seance.
 *
 * Le verrou est systematiquement perdu quand l'onglet passe en arriere-plan ou
 * que l'ecran se verrouille : on le redemande donc a chaque retour au premier
 * plan, plutot que de supposer qu'il a survecu.
 */
export function useWakeLock(actif: boolean): void {
  const sentinelRef = useRef<Sentinel | null>(null)

  const demander = useCallback(async () => {
    if (typeof navigator === 'undefined') return
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } })
      .wakeLock
    if (!wl) return
    if (sentinelRef.current && !sentinelRef.current.released) return
    if (document.visibilityState !== 'visible') return
    try {
      sentinelRef.current = await wl.request('screen')
    } catch {
      // Refus possible (batterie faible, onglet masque) : l'app reste utilisable
      // sans verrou, on retentera au prochain retour au premier plan.
      sentinelRef.current = null
    }
  }, [])

  const relacher = useCallback(async () => {
    const s = sentinelRef.current
    sentinelRef.current = null
    if (s && !s.released) await s.release().catch(() => {})
  }, [])

  useEffect(() => {
    if (!actif) {
      void relacher()
      return
    }
    void demander()
    const onVisibilite = () => {
      if (document.visibilityState === 'visible') void demander()
    }
    document.addEventListener('visibilitychange', onVisibilite)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilite)
      void relacher()
    }
  }, [actif, demander, relacher])
}
