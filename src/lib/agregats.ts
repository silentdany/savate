import type { Plan, SeanceLog, TypeSeance } from '@/lib/types'

export type AgregatSemaine = {
  semaine: number
  /** Rounds reellement effectues, toutes seances confondues. */
  rounds: number
  /** Moyenne des RPE declares ; null si aucune seance notee. */
  rpeMoyen: number | null
  /** Tonnage de renfo : somme des reps x charge. */
  volumeKg: number
  seances: number
}

const COMPTE = new Set(['terminee', 'partielle', 'convertie_mobilite'])

/** Duree reelle d'une seance en minutes, ou null si elle n'a pas ete cloturee. */
export function dureeReelleMin(log: SeanceLog): number | null {
  if (!log.dateFin) return null
  const ms = new Date(log.dateFin).getTime() - new Date(log.dateDebut).getTime()
  if (!Number.isFinite(ms) || ms <= 0) return null
  return Math.round(ms / 60000)
}

export function volumeDeLog(log: SeanceLog): number {
  return log.entrees.reduce((total, e) => {
    if (!e.fait || !e.chargeKg || !e.reps) return total
    return total + e.reps * e.chargeKg
  }, 0)
}

export function roundsDeLog(log: SeanceLog): number {
  return log.entrees.reduce((total, e) => total + (e.fait ? (e.roundsFaits ?? 0) : 0), 0)
}

/** Une ligne par semaine du plan, y compris les semaines vides. */
export function agregerParSemaine(logs: readonly SeanceLog[], plan: Plan): AgregatSemaine[] {
  return Array.from({ length: plan.nbSemaines }, (_, i) => {
    const semaine = i + 1
    const dedans = logs.filter((l) => l.semaine === semaine && COMPTE.has(l.statut))
    const rpes = dedans.map((l) => l.rpe).filter((r): r is number => typeof r === 'number')
    return {
      semaine,
      rounds: dedans.reduce((t, l) => t + roundsDeLog(l), 0),
      rpeMoyen: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null,
      volumeKg: dedans.reduce((t, l) => t + volumeDeLog(l), 0),
      seances: dedans.length,
    }
  })
}

export const TYPES: { valeur: TypeSeance | 'tous'; label: string }[] = [
  { valeur: 'tous', label: 'Toutes' },
  { valeur: 'bf', label: 'BF' },
  { valeur: 'renfo', label: 'Renfo' },
  { valeur: 'cardio', label: 'Cardio' },
  { valeur: 'mobilite', label: 'Mobilité' },
]
