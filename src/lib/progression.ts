import type {
  Bloc,
  BlocSeance,
  Exercice,
  JourPlan,
  ParametresSemaine,
  Plan,
  SeanceTemplate,
  TypeSeance,
} from '@/lib/types'

// ---------------------------------------------------------------------------
//  Parametres de la semaine
// ---------------------------------------------------------------------------

/**
 * Applique la table de progression, puis le mode allege : un cran de moins sur
 * les rounds BF et sur les tours de renfo. C'est la soupape prevue par le plan
 * pour une semaine chargee, elle ne decale jamais la semaine courante.
 */
export function parametresSemaine(
  plan: Plan,
  semaine: number,
  semainesAllegees: readonly number[]
): ParametresSemaine {
  const ligne =
    plan.progression.find((p) => p.semaine === semaine) ??
    plan.progression[plan.progression.length - 1]

  if (!ligne) {
    throw new Error('Plan sans table de progression : verifie le fichier de seed.')
  }

  const allegee = semainesAllegees.includes(semaine)
  return {
    ...ligne,
    semaine,
    bfRounds: allegee ? Math.max(2, ligne.bfRounds - 1) : ligne.bfRounds,
    renfoTours: allegee ? Math.max(1, ligne.renfoTours - 1) : ligne.renfoTours,
    allegee,
    brut: { bfRounds: ligne.bfRounds, renfoTours: ligne.renfoTours },
  }
}

export const templateParId = (plan: Plan, id: string | null | undefined) =>
  id ? plan.seances.find((s) => s.id === id) : undefined

export const jourDuPlan = (plan: Plan, jour: number): JourPlan | undefined =>
  plan.jours.find((j) => j.jour === jour)

export const seanceMobilite = (plan: Plan) => templateParId(plan, plan.seanceMobiliteId)

// ---------------------------------------------------------------------------
//  Textes dynamiques
// ---------------------------------------------------------------------------

/**
 * Les consignes du seed peuvent contenir des jetons resolus a l'affichage :
 * {rounds} {tours} {intensite} {cardioFormat}. Ca evite de dupliquer une
 * consigne par semaine dans le fichier de contenu.
 */
export function resoudreTexte(texte: string | undefined, p: ParametresSemaine): string | undefined {
  if (!texte) return texte
  return texte
    .replace(/\{rounds\}/g, String(p.bfRounds))
    .replace(/\{tours\}/g, String(p.renfoTours))
    .replace(/\{intensite\}/g, `${p.bfIntensitePct[0]} a ${p.bfIntensitePct[1]} %`)
    .replace(/\{cardioFormat\}/g, p.cardioFormat)
}

export function formatDuree(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function formatDureeLongue(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')}`
  return `${m} min`
}

export const LIBELLE_TYPE: Record<TypeSeance, string> = {
  bf: 'Boxe française',
  renfo: 'Renforcement',
  cardio: 'Cardio',
  mobilite: 'Mobilité',
}

export const LIBELLE_BLOC: Record<Bloc, string> = {
  echauffement: 'Échauffement',
  technique: 'Technique',
  sac: 'Sac',
  intensite: 'Intensité',
  retour_au_calme: 'Retour au calme',
  circuit: 'Circuit',
}

export const CLASSE_TYPE: Record<TypeSeance, string> = {
  bf: 'text-bf',
  renfo: 'text-renfo',
  cardio: 'text-cardio',
  mobilite: 'text-mobilite',
}

export const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const
export const JOURS_LONGS = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const

// ---------------------------------------------------------------------------
//  Deroule d'une seance
// ---------------------------------------------------------------------------

/** Un exercice tel qu'il sera reellement propose, une fois la semaine appliquee. */
export type Etape = {
  /** Cle unique dans le deroule : exercice + tour de circuit. */
  cle: string
  exercice: Exercice
  bloc: Bloc
  blocTitre: string
  /** Rang du bloc dans la seance, 1-based. */
  blocRang: number
  blocsTotal: number
  /** Circuit uniquement. */
  tour?: number
  toursTotal?: number
  /** Mesure `rounds` : nombre de rounds vise pour la semaine. */
  roundsCible?: number
  consigne?: string
}

/** Retire les exercices que la semaine n'autorise pas encore. */
export function exercicesVisibles(bloc: BlocSeance, p: ParametresSemaine): Exercice[] {
  return bloc.exercices.filter((e) => !e.requiertCoupsHauts || p.coupsHautsAutorises)
}

export function blocsVisibles(template: SeanceTemplate, p: ParametresSemaine): BlocSeance[] {
  return template.blocs
    .map((b) => ({ ...b, exercices: exercicesVisibles(b, p) }))
    .filter((b) => b.exercices.length > 0)
}

/**
 * Deroule complet : circuits deplies en tours, exercices filtres, consignes
 * resolues, cibles de rounds injectees depuis la progression.
 */
export function construireEtapes(template: SeanceTemplate, p: ParametresSemaine): Etape[] {
  const blocs = blocsVisibles(template, p)
  const blocsTotal = blocs.length
  const etapes: Etape[] = []

  blocs.forEach((bloc, i) => {
    const toursTotal = bloc.toursSuitProgression ? p.renfoTours : 1
    for (let tour = 1; tour <= toursTotal; tour++) {
      for (const exercice of bloc.exercices) {
        const etape: Etape = {
          cle: toursTotal > 1 ? `${exercice.id}#${tour}` : exercice.id,
          exercice,
          bloc: bloc.bloc,
          blocTitre: bloc.titre,
          blocRang: i + 1,
          blocsTotal,
        }
        if (toursTotal > 1) {
          etape.tour = tour
          etape.toursTotal = toursTotal
        }
        if (exercice.mesure === 'rounds') etape.roundsCible = p.bfRounds
        const consigne = resoudreTexte(exercice.consigne, p)
        if (consigne) etape.consigne = consigne
        etapes.push(etape)
      }
    }
  })

  return etapes
}

/** Duree cible affichee, ajustee au nombre de tours reellement programmes. */
export function dureeCible(template: SeanceTemplate, p: ParametresSemaine): number {
  const aDesTours = template.blocs.some((b) => b.toursSuitProgression)
  if (!aDesTours) return template.dureeCibleMin
  const reference = 3 // la duree cible du seed est ecrite pour 3 tours
  const ratio = 0.55 + 0.45 * (p.renfoTours / reference)
  return Math.round(template.dureeCibleMin * ratio)
}

/** Compte de rounds programmes, pour l'agregat "rounds par semaine". */
export function roundsProgrammes(template: SeanceTemplate, p: ParametresSemaine): number {
  return construireEtapes(template, p).filter((e) => e.exercice.mesure === 'rounds').length * p.bfRounds
}

/** Cible d'un exercice, en une ligne lisible d'un coup d'oeil. */
export function libelleCible(exercice: Exercice, roundsCible?: number): string {
  const c = exercice.cible
  switch (exercice.mesure) {
    case 'rounds':
      return `${roundsCible ?? c?.series ?? 3} rounds`
    case 'duree': {
      const sec = c?.dureeSec ?? 60
      return sec >= 60 ? `${formatDuree(sec)} min` : `${sec} s`
    }
    case 'reps': {
      if (c?.series && c.series > 1 && c.reps) return `${c.series} × ${c.reps} reps`
      return `${c?.reps ?? 10} reps`
    }
    case 'reps_charge': {
      if (c?.series && c.series > 1 && c.reps) return `${c.series} × ${c.reps} reps + charge`
      return `${c?.reps ?? 10} reps + charge`
    }
    case 'check':
      return 'à cocher'
  }
}

export const LIBELLE_MESURE: Record<import('@/lib/types').Mesure, string> = {
  duree: 'Durée',
  reps: 'Répétitions',
  reps_charge: 'Répétitions et charge',
  rounds: 'Rounds',
  check: 'Fait ou non',
}
