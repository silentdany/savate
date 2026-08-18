'use client'

import { useEffect } from 'react'
import { changerSemaine } from '@/lib/db'
import { useEtat, usePlan, useReglages } from '@/lib/hooks'

const SEPT_JOURS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Avance de la semaine, uniquement si le reglage est actif.
 *
 * On incremente de 1 a partir de `dateDebutSemaine`, on ne recalcule jamais la
 * semaine depuis la date de debut du plan : sinon une semaine sautee ou
 * rejouee decalerait tout le reste du plan.
 */
export function AvanceAutoSemaine() {
  const plan = usePlan()
  const etat = useEtat()
  const reglages = useReglages()

  useEffect(() => {
    if (!plan || !etat || !reglages.avanceSemaineAuto) return
    if (etat.semaineCourante >= plan.nbSemaines) return

    const verifier = () => {
      const debut = new Date(etat.dateDebutSemaine).getTime()
      if (!Number.isFinite(debut)) return
      if (Date.now() - debut < SEPT_JOURS_MS) return
      void changerSemaine(1, plan.nbSemaines)
    }

    verifier()
    const onVisible = () => document.visibilityState === 'visible' && verifier()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [plan, etat, reglages.avanceSemaineAuto])

  return null
}
