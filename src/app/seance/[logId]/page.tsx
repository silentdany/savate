import type { Metadata } from 'next'

import { Runner } from '@/components/runner/Runner'
import { SENTINELLE_SEANCE } from '@/lib/routes'

/**
 * Cette page ne lit jamais ses `params` : le runner recupere le logId depuis
 * l'URL, cote client. Le shell prerendu ci-dessous vaut donc pour toutes les
 * seances, ce qui permet au service worker d'en servir une copie unique et de
 * demarrer une seance en mode avion.
 */
export const metadata: Metadata = { title: 'Séance — Savate' }

export function generateStaticParams() {
  return [{ logId: SENTINELLE_SEANCE }]
}

export default function PageSeance() {
  return <Runner />
}
