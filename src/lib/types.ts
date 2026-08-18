/**
 * Modele de donnees BF Dojo.
 *
 * Contraintes issues du cahier des charges :
 *  - identifiants stables et timestamps ISO partout, pour qu'une synchro
 *    Supabase puisse se brancher plus tard sans reecrire le modele ;
 *  - aucun etat derive stocke : tout ce qui se recalcule (seances faites,
 *    progression, agregats) est calcule a la lecture, jamais persiste.
 */

export type TypeSeance = 'bf' | 'renfo' | 'cardio' | 'mobilite'

export type Bloc =
  | 'echauffement'
  | 'technique'
  | 'sac'
  | 'intensite'
  | 'retour_au_calme'
  | 'circuit'

export type Mesure = 'duree' | 'reps' | 'reps_charge' | 'rounds' | 'check'

export type ZoneGene = 'aine' | 'ischio' | 'cheville' | 'epaule' | 'genou' | 'dos'

export type NiveauGene = 1 | 2 | 3

export type Jour = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type Exercice = {
  id: string
  nom: string
  mesure: Mesure
  /** Texte court affiche sous le nom, en seance. */
  consigne?: string
  cible?: {
    series?: number
    reps?: number
    dureeSec?: number
    reposSec?: number
  }
  /** Le nombre de rounds / tours vient de la progression de la semaine. */
  suitProgression?: boolean
  /** Exercice retire quand les coups hauts ne sont pas encore autorises. */
  requiertCoupsHauts?: boolean
}

export type BlocSeance = {
  bloc: Bloc
  titre: string
  exercices: Exercice[]
  /** Circuit : le bloc est repete `renfoTours` fois (progression de la semaine). */
  toursSuitProgression?: boolean
}

export type SeanceTemplate = {
  id: string
  nom: string
  type: TypeSeance
  dureeCibleMin: number
  blocs: BlocSeance[]
}

export type ProgressionSemaine = {
  semaine: number
  bfRounds: number
  bfIntensitePct: [number, number]
  coupsHautsAutorises: boolean
  renfoTours: number
  cardioFormat: string
  note?: string
}

export type JourPlan = { jour: Jour; seanceId: string | null; optionnel: boolean }

export type Plan = {
  id: string
  nom: string
  nbSemaines: number
  seances: SeanceTemplate[]
  progression: ProgressionSemaine[]
  jours: JourPlan[]
  /** Regles a afficher quand une gene de niveau 3 est declaree. */
  seuilsVigilance: { zone: ZoneGene; seuil: string }[]
  /** Id de la seance servant de soupape (mobilite courte). */
  seanceMobiliteId: string
  avertissement?: string
}

export type EntreeExercice = {
  exerciceId: string
  fait: boolean
  /** Numero de tour dans un circuit (1..n). Absent hors circuit. */
  tour?: number
  reps?: number
  chargeKg?: number
  dureeSec?: number
  roundsFaits?: number
}

export type StatutSeance =
  | 'en_cours'
  | 'terminee'
  | 'partielle'
  | 'convertie_mobilite'
  | 'sautee'

export type SeanceLog = {
  id: string
  planId: string
  seanceTemplateId: string
  semaine: number
  dateDebut: string
  dateFin?: string
  statut: StatutSeance
  /** 1 a 10, saisi en fin de seance. */
  rpe?: number
  entrees: EntreeExercice[]
  gene?: { zone: ZoneGene; niveau: NiveauGene }[]
  note?: string
}

export type EtatPlan = {
  planId: string
  semaineCourante: number
  dateDebutSemaine: string
  /**
   * Semaines basculees en mode allege (rounds et tours reduits d'un cran).
   * Stocke par semaine et non globalement : une semaine allegee doit le rester
   * dans l'historique.
   */
  semainesAllegees: number[]
}

export type Reglages = {
  id: 'reglages'
  roundSecDefaut: number
  reposSecDefaut: number
  son: boolean
  vibration: boolean
  /** Si vrai, la semaine avance seule apres 7 jours ; sinon, uniquement a la main. */
  avanceSemaineAuto: boolean
}

/** Parametres de la semaine, apres application eventuelle du mode allege. */
export type ParametresSemaine = ProgressionSemaine & {
  allegee: boolean
  /** Valeurs de la table de progression avant allegement, pour affichage. */
  brut: { bfRounds: number; renfoTours: number }
}

/** Forme du fichier d'export / import JSON. */
export type Sauvegarde = {
  format: 'bf-dojo'
  version: 1
  exporteLe: string
  plan: Plan
  etat: EtatPlan
  reglages: Reglages
  logs: SeanceLog[]
  /** Derive, present pour lisibilite du fichier ; ignore a l'import. */
  seancesFaitesCetteSemaine?: string[]
}
