'use client'

import { db, lireEtat, lireLogs, lirePlan, lireReglages, REGLAGES_DEFAUT } from '@/lib/db'
import type { Sauvegarde, SeanceLog } from '@/lib/types'

const STATUTS = new Set([
  'en_cours',
  'terminee',
  'partielle',
  'convertie_mobilite',
  'sautee',
])

export async function construireSauvegarde(): Promise<Sauvegarde> {
  const [plan, etat, reglages, logs] = await Promise.all([
    lirePlan(),
    lireEtat(),
    lireReglages(),
    lireLogs(),
  ])
  if (!plan || !etat) throw new Error('Base non initialisee')

  // Champ derive, present pour la lisibilite du fichier. Ignore a l'import :
  // la verite reste la liste des logs.
  const faites = logs
    .filter((l) => l.semaine === etat.semaineCourante && l.statut !== 'sautee')
    .map((l) => l.seanceTemplateId)

  return {
    format: 'savate',
    version: 1,
    exporteLe: new Date().toISOString(),
    plan,
    etat,
    reglages: reglages ?? REGLAGES_DEFAUT,
    logs,
    seancesFaitesCetteSemaine: [...new Set(faites)],
  }
}

export function nomFichierSauvegarde(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `savate-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`
}

export async function exporterJson() {
  const sauvegarde = await construireSauvegarde()
  const contenu = JSON.stringify(sauvegarde, null, 2)
  const blob = new Blob([contenu], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichierSauvegarde()
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Laisse au navigateur le temps de demarrer le telechargement.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return contenu.length
}

function estLogValide(x: unknown): x is SeanceLog {
  if (typeof x !== 'object' || x === null) return false
  const l = x as Record<string, unknown>
  return (
    typeof l.id === 'string' &&
    typeof l.planId === 'string' &&
    typeof l.seanceTemplateId === 'string' &&
    typeof l.semaine === 'number' &&
    typeof l.dateDebut === 'string' &&
    typeof l.statut === 'string' &&
    STATUTS.has(l.statut) &&
    Array.isArray(l.entrees)
  )
}

export type ResultatImport = { logs: number; semaineCourante: number }

/**
 * Remplace integralement les donnees utilisateur. Le plan n'est PAS importe :
 * son contenu vient toujours du fichier de seed, ce qui garantit qu'editer le
 * seed reste le seul moyen de changer le plan.
 */
export async function importerJson(texte: string): Promise<ResultatImport> {
  let brut: unknown
  try {
    brut = JSON.parse(texte)
  } catch {
    throw new Error('Fichier illisible : ce n est pas du JSON valide.')
  }
  if (typeof brut !== 'object' || brut === null) throw new Error('Fichier vide ou invalide.')

  const s = brut as Partial<Sauvegarde>
  // 'bf-dojo' est l'ancien identifiant : les exports d'avant le renommage
  // doivent continuer a se reimporter.
  if (s.format !== 'savate' && s.format !== 'bf-dojo') {
    throw new Error('Ce fichier ne vient pas de l’app Savate.')
  }
  if (s.version !== 1) throw new Error(`Version de sauvegarde non geree (${String(s.version)}).`)
  if (!Array.isArray(s.logs)) throw new Error('Sauvegarde sans liste de seances.')

  const logs = s.logs.filter(estLogValide)
  if (logs.length !== s.logs.length) {
    throw new Error(`${s.logs.length - logs.length} seance(s) illisible(s) dans le fichier.`)
  }

  const plan = await lirePlan()
  const planId = plan?.id ?? logs[0]?.planId ?? 'savate-retour-8s'

  await db().transaction('rw', db().logs, db().etat, db().reglages, async () => {
    await db().logs.clear()
    if (logs.length) await db().logs.bulkAdd(logs)

    if (s.etat) {
      await db().etat.put({
        planId,
        semaineCourante: s.etat.semaineCourante,
        dateDebutSemaine: s.etat.dateDebutSemaine,
        semainesAllegees: Array.isArray(s.etat.semainesAllegees) ? s.etat.semainesAllegees : [],
      })
    }
    if (s.reglages) {
      await db().reglages.put({ ...REGLAGES_DEFAUT, ...s.reglages, id: 'reglages' })
    }
  })

  const etat = await lireEtat()
  return { logs: logs.length, semaineCourante: etat?.semaineCourante ?? 1 }
}
