import { jourIso } from '@/lib/db'
import { jourDuPlan, seanceMobilite, templateParId } from '@/lib/progression'
import type { Jour, ParametresSemaine, Plan, SeanceLog, SeanceTemplate } from '@/lib/types'

export type RaisonSuggestion =
  | 'jour' // la seance prevue aujourd'hui
  | 'rattrapage' // rien aujourd'hui (ou deja fait) : prochaine seance non faite
  | 'mobilite' // tout est fait, ou jour de repos : soupape 15 min
  | 'tout_fait'

export type Suggestion = {
  template: SeanceTemplate
  raison: RaisonSuggestion
  jourPrevu?: Jour
  optionnel: boolean
}

const COMPTE_COMME_FAITE = new Set(['terminee', 'partielle', 'convertie_mobilite'])

/** Ids des seances deja realisees dans la semaine (derive des logs, jamais stocke). */
export function seancesFaites(logsSemaine: readonly SeanceLog[]): string[] {
  return [
    ...new Set(logsSemaine.filter((l) => COMPTE_COMME_FAITE.has(l.statut)).map((l) => l.seanceTemplateId)),
  ]
}

/**
 * Repond a la seule question de l'ecran d'accueil : qu'est-ce que je fais
 * maintenant. Ordre de priorite :
 *   1. la seance prevue aujourd'hui si elle n'est pas deja faite ;
 *   2. sinon la prochaine seance non faite de la semaine, jours suivants
 *      d'abord puis jours passes (rattrapage) ;
 *   3. sinon la mobilite de 15 min.
 */
export function suggererSeance(
  plan: Plan,
  logsSemaine: readonly SeanceLog[],
  aujourdhui: Date = new Date()
): Suggestion | undefined {
  const jour = jourIso(aujourdhui)
  const faites = new Set(seancesFaites(logsSemaine))

  const duJour = jourDuPlan(plan, jour)
  const templateDuJour = templateParId(plan, duJour?.seanceId)
  if (templateDuJour && !faites.has(templateDuJour.id)) {
    return { template: templateDuJour, raison: 'jour', jourPrevu: jour, optionnel: duJour?.optionnel ?? false }
  }

  // Jours suivants puis jours passes, en excluant le jour courant deja traite.
  const ordre: Jour[] = []
  for (let i = 1; i <= 6; i++) ordre.push((((jour - 1 + i) % 7) + 1) as Jour)

  for (const j of ordre) {
    const jp = jourDuPlan(plan, j)
    const t = templateParId(plan, jp?.seanceId)
    if (!t || faites.has(t.id)) continue
    if (t.id === plan.seanceMobiliteId) continue // garde la mobilite en dernier recours
    return { template: t, raison: 'rattrapage', jourPrevu: j, optionnel: jp?.optionnel ?? false }
  }

  const mobilite = seanceMobilite(plan)
  if (!mobilite) return undefined
  return {
    template: mobilite,
    raison: faites.size > 0 ? 'tout_fait' : 'mobilite',
    optionnel: true,
  }
}

/** Les 2 a 3 chiffres de la semaine qui comptent pour cette seance. */
export function resumeParametres(
  template: SeanceTemplate,
  p: ParametresSemaine
): { label: string; valeur: string; alerte?: boolean }[] {
  switch (template.type) {
    case 'bf':
      return [
        { label: 'Rounds', valeur: String(p.bfRounds) },
        { label: 'Intensité', valeur: `${p.bfIntensitePct[0]}–${p.bfIntensitePct[1]} %` },
        {
          label: 'Coups hauts',
          valeur: p.coupsHautsAutorises ? 'autorisés' : 'interdits',
          alerte: !p.coupsHautsAutorises,
        },
      ]
    case 'renfo':
      return [
        { label: 'Tours de circuit', valeur: String(p.renfoTours) },
        { label: 'Semaine', valeur: p.allegee ? 'allégée' : 'normale', alerte: p.allegee },
      ]
    case 'cardio':
      return [{ label: 'Format', valeur: p.cardioFormat }]
    case 'mobilite':
      return [{ label: 'Rythme', valeur: 'libre, sans forcer' }]
  }
}
