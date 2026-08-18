'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { useSyncExternalStore } from 'react'
import {
  db,
  derniereSaisieParExercice,
  lireEtat,
  lireLog,
  lireLogs,
  lireLogsSemaine,
  lirePlan,
  lireReglages,
  lireSeanceEnCours,
  REGLAGES_DEFAUT,
} from '@/lib/db'
import { useHorloge } from '@/lib/chrono'
import { parametresSemaine } from '@/lib/progression'
import type { EntreeExercice, ParametresSemaine, Plan } from '@/lib/types'

export const usePlan = () => useLiveQuery(lirePlan, [])
export const useEtat = () => useLiveQuery(lireEtat, [])
export const useReglages = () => useLiveQuery(lireReglages, []) ?? REGLAGES_DEFAUT
export const useLogs = () => useLiveQuery(lireLogs, [])
export const useLog = (id: string) => useLiveQuery(() => lireLog(id), [id])
export const useSeanceEnCours = () => useLiveQuery(lireSeanceEnCours, [])
export const useLogsSemaine = (semaine: number | undefined) =>
  useLiveQuery(() => (semaine === undefined ? [] : lireLogsSemaine(semaine)), [semaine])

export const useDernieresSaisies = (seanceTemplateId: string | undefined) =>
  useLiveQuery(
    () =>
      seanceTemplateId
        ? derniereSaisieParExercice(seanceTemplateId)
        : Promise.resolve<Record<string, EntreeExercice>>({}),
    [seanceTemplateId]
  )

/** Nombre total de seances loggees, pour distinguer "vide" de "pas encore charge". */
export const useNbLogs = () => useLiveQuery(() => db().logs.count(), [])

export type Contexte = {
  plan: Plan
  semaineCourante: number
  parametres: ParametresSemaine
  semainesAllegees: number[]
}

/** Plan + semaine courante + parametres appliques, en une seule lecture. */
export function useContexte(): Contexte | undefined {
  const plan = usePlan()
  const etat = useEtat()
  if (!plan || !etat) return undefined
  return {
    plan,
    semaineCourante: etat.semaineCourante,
    parametres: parametresSemaine(plan, etat.semaineCourante, etat.semainesAllegees),
    semainesAllegees: etat.semainesAllegees,
  }
}

const AUCUN_ABONNEMENT = () => () => {}

/**
 * Vrai apres l'hydratation. Garde-fou contre tout acces SSR a IndexedDB, et
 * contre les differences serveur/client (dates, window.location). Ecrit avec
 * useSyncExternalStore plutot qu'un setState dans un effet : le rendu serveur
 * et le premier rendu client renvoient false, donc aucun ecart d'hydratation.
 */
export function useMonte() {
  return useSyncExternalStore(
    AUCUN_ABONNEMENT,
    () => true,
    () => false
  )
}

export { useHorloge }
