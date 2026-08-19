'use client'

import Dexie, { type Table } from 'dexie'
import { PLAN } from '@/lib/seed/plan-savate'
import type {
  EntreeExercice,
  EtatPlan,
  Plan,
  Reglages,
  SeanceLog,
  StatutSeance,
  ZoneGene,
  NiveauGene,
} from '@/lib/types'

export const REGLAGES_DEFAUT: Reglages = {
  id: 'reglages',
  roundSecDefaut: 120,
  reposSecDefaut: 60,
  son: true,
  vibration: true,
  avanceSemaineAuto: false,
}

class BfDojoDb extends Dexie {
  plans!: Table<Plan, string>
  logs!: Table<SeanceLog, string>
  etat!: Table<EtatPlan, string>
  reglages!: Table<Reglages, string>

  constructor() {
    // Le nom de la base reste 'bf-dojo' malgre le renommage de l'app en
    // « Savate » : le changer creerait une base vide a cote et rendrait
    // orphelines toutes les seances deja loggees sur l'appareil.
    super('bf-dojo')
    this.version(1).stores({
      plans: 'id',
      logs: 'id, planId, seanceTemplateId, semaine, statut, dateDebut, [seanceTemplateId+dateDebut]',
      etat: 'planId',
      reglages: 'id',
    })

    // Dexie attend cette promesse avant de laisser passer la moindre requete :
    // aucun ecran ne peut donc lire une base non semee.
    this.on('ready', () => this.semer() as unknown as void)
  }

  /**
   * Le contenu du plan est reecrit a chaque demarrage depuis le fichier de
   * seed : editer `plan-savate.ts` suffit a changer l'app. Les donnees
   * utilisateur (logs, etat, reglages) ne sont creees que si absentes.
   */
  private async semer() {
    await this.plans.put(PLAN)

    const etat = await this.etat.get(PLAN.id)
    if (!etat) {
      await this.etat.put({
        planId: PLAN.id,
        semaineCourante: 1,
        dateDebutSemaine: debutDeSemaine(new Date()).toISOString(),
        semainesAllegees: [],
      })
    }

    const reglages = await this.reglages.get('reglages')
    if (!reglages) await this.reglages.put(REGLAGES_DEFAUT)
  }
}

let instance: BfDojoDb | null = null

/** Instanciation paresseuse : rien ne doit toucher IndexedDB pendant le SSR. */
export function db(): BfDojoDb {
  if (!instance) instance = new BfDojoDb()
  return instance
}

// ---------------------------------------------------------------------------
//  Dates
// ---------------------------------------------------------------------------

/** Lundi = 1 ... dimanche = 7, comme `JourPlan.jour`. */
export function jourIso(d: Date): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const j = d.getDay()
  return (j === 0 ? 7 : j) as 1 | 2 | 3 | 4 | 5 | 6 | 7
}

export function debutDeSemaine(d: Date): Date {
  const copie = new Date(d)
  copie.setHours(0, 0, 0, 0)
  copie.setDate(copie.getDate() - (jourIso(copie) - 1))
  return copie
}

// ---------------------------------------------------------------------------
//  Lectures
// ---------------------------------------------------------------------------

export const lirePlan = () => db().plans.get(PLAN.id)
export const lireEtat = () => db().etat.get(PLAN.id)
export const lireReglages = () => db().reglages.get('reglages')

export const lireLog = (id: string) => db().logs.get(id)

export function lireLogs() {
  return db().logs.orderBy('dateDebut').reverse().toArray()
}

export function lireLogsSemaine(semaine: number) {
  return db().logs.where('semaine').equals(semaine).toArray()
}

/** Seance laissee en plan : l'ecran Aujourd'hui doit proposer de la reprendre. */
export async function lireSeanceEnCours(): Promise<SeanceLog | undefined> {
  const enCours = await db().logs.where('statut').equals('en_cours').toArray()
  return enCours.sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))[0]
}

/**
 * Derniere valeur saisie pour un exercice, dans une seance du meme template.
 * Sert a pre-remplir reps et charge : au dojo on ne retape pas ses charges.
 */
export async function derniereSaisie(
  seanceTemplateId: string,
  exerciceId: string
): Promise<EntreeExercice | undefined> {
  const logs = await db().logs.where('seanceTemplateId').equals(seanceTemplateId).toArray()
  const candidats = logs
    .filter((l) => l.statut !== 'en_cours' && l.statut !== 'sautee')
    .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut))

  for (const log of candidats) {
    const entree = log.entrees.find((e) => e.exerciceId === exerciceId && e.fait)
    if (entree && (entree.reps !== undefined || entree.chargeKg !== undefined)) return entree
  }
  return undefined
}

/** Toutes les dernieres saisies d'un template, en une passe. */
export async function derniereSaisieParExercice(
  seanceTemplateId: string
): Promise<Record<string, EntreeExercice>> {
  const logs = await db().logs.where('seanceTemplateId').equals(seanceTemplateId).toArray()
  const candidats = logs
    .filter((l) => l.statut !== 'en_cours' && l.statut !== 'sautee')
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)) // du plus ancien au plus recent

  const out: Record<string, EntreeExercice> = {}
  for (const log of candidats) {
    for (const e of log.entrees) {
      if (!e.fait) continue
      if (e.reps === undefined && e.chargeKg === undefined) continue
      out[e.exerciceId] = e // le plus recent ecrase
    }
  }
  return out
}

// ---------------------------------------------------------------------------
//  Ecritures
// ---------------------------------------------------------------------------

function nouvelId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Le log est ecrit en base des le demarrage, en `en_cours`, puis mis a jour a
 * chaque exercice valide. Tuer l'app en pleine seance ne perd donc rien.
 */
export async function demarrerSeance(seanceTemplateId: string, semaine: number): Promise<string> {
  const log: SeanceLog = {
    id: nouvelId(),
    planId: PLAN.id,
    seanceTemplateId,
    semaine,
    dateDebut: new Date().toISOString(),
    statut: 'en_cours',
    entrees: [],
  }
  await db().logs.add(log)
  return log.id
}

/** Cle d'une entree : un exercice, eventuellement par tour de circuit. */
const memeEntree = (a: EntreeExercice, exerciceId: string, tour?: number) =>
  a.exerciceId === exerciceId && (a.tour ?? null) === (tour ?? null)

export async function enregistrerEntree(logId: string, entree: EntreeExercice) {
  await db().transaction('rw', db().logs, async () => {
    const log = await db().logs.get(logId)
    if (!log) return
    const entrees = log.entrees.filter((e) => !memeEntree(e, entree.exerciceId, entree.tour))
    entrees.push(entree)
    await db().logs.update(logId, { entrees })
  })
}

export async function retirerEntree(logId: string, exerciceId: string, tour?: number) {
  await db().transaction('rw', db().logs, async () => {
    const log = await db().logs.get(logId)
    if (!log) return
    await db().logs.update(logId, {
      entrees: log.entrees.filter((e) => !memeEntree(e, exerciceId, tour)),
    })
  })
}

export async function cloturerSeance(
  logId: string,
  cloture: {
    statut: StatutSeance
    rpe?: number
    gene?: { zone: ZoneGene; niveau: NiveauGene }[]
    note?: string
  }
) {
  const patch: Partial<SeanceLog> = {
    statut: cloture.statut,
    dateFin: new Date().toISOString(),
  }
  if (cloture.rpe !== undefined) patch.rpe = cloture.rpe
  if (cloture.gene !== undefined) patch.gene = cloture.gene
  if (cloture.note !== undefined) patch.note = cloture.note
  await db().logs.update(logId, patch)
}

export async function supprimerLog(logId: string) {
  await db().logs.delete(logId)
}

export async function majEtat(patch: Partial<EtatPlan>) {
  await db().transaction('rw', db().etat, async () => {
    const courant = await db().etat.get(PLAN.id)
    if (!courant) return
    await db().etat.put({ ...courant, ...patch, planId: PLAN.id })
  })
}

/**
 * La semaine courante ne se deduit JAMAIS de la date de debut du plan : une
 * semaine sautee ou allegee decalerait tout le reste. Elle se change ici, et
 * seulement ici.
 */
export async function changerSemaine(delta: number, nbSemaines: number) {
  await db().transaction('rw', db().etat, async () => {
    const courant = await db().etat.get(PLAN.id)
    if (!courant) return
    const cible = Math.min(nbSemaines, Math.max(1, courant.semaineCourante + delta))
    if (cible === courant.semaineCourante) return
    await db().etat.put({
      ...courant,
      semaineCourante: cible,
      dateDebutSemaine: debutDeSemaine(new Date()).toISOString(),
    })
  })
}

export async function basculerAllegee(semaine: number) {
  await db().transaction('rw', db().etat, async () => {
    const courant = await db().etat.get(PLAN.id)
    if (!courant) return
    const deja = courant.semainesAllegees.includes(semaine)
    await db().etat.put({
      ...courant,
      semainesAllegees: deja
        ? courant.semainesAllegees.filter((s) => s !== semaine)
        : [...courant.semainesAllegees, semaine].sort((a, b) => a - b),
    })
  })
}

export async function majReglages(patch: Partial<Omit<Reglages, 'id'>>) {
  await db().transaction('rw', db().reglages, async () => {
    const courant = (await db().reglages.get('reglages')) ?? REGLAGES_DEFAUT
    await db().reglages.put({ ...courant, ...patch, id: 'reglages' })
  })
}

export async function remiseAZero() {
  await db().transaction('rw', db().logs, db().etat, db().reglages, async () => {
    await db().logs.clear()
    await db().etat.clear()
    await db().reglages.clear()
  })
  await db().etat.put({
    planId: PLAN.id,
    semaineCourante: 1,
    dateDebutSemaine: debutDeSemaine(new Date()).toISOString(),
    semainesAllegees: [],
  })
  await db().reglages.put(REGLAGES_DEFAUT)
}
