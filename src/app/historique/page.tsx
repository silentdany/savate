'use client'

import { useMemo, useState } from 'react'
import { GraphiqueBarres, GraphiqueLigne, type Point } from '@/components/charts/Graphiques'
import { Entete, EtatVide, PastilleStatut, Squelette } from '@/components/ui/divers'
import { cn } from '@/lib/cn'
import { TYPES, agregerParSemaine, dureeReelleMin } from '@/lib/agregats'
import { useEtat, useLogs, useMonte, usePlan } from '@/lib/hooks'
import { LIBELLE_TYPE, pluriel, templateParId } from '@/lib/progression'
import type { TypeSeance } from '@/lib/types'

// Palette de series validee pour fond sombre : bande de clarte, plancher de
// chroma, separation CVD toutes paires et contraste >= 3:1 sur --color-surface.
const SERIE_ROUNDS = '#d95926'
const SERIE_RPE = '#3987e5'
const SERIE_VOLUME = '#199e70'

export default function PageHistorique() {
  const monte = useMonte()
  const plan = usePlan()
  const etat = useEtat()
  const logs = useLogs()
  const [filtre, setFiltre] = useState<TypeSeance | 'tous'>('tous')

  const agregats = useMemo(
    () => (plan && logs ? agregerParSemaine(logs, plan) : []),
    [plan, logs]
  )

  if (!monte || !plan || !etat || !logs) {
    return (
      <main className="px-5 pt-safe">
        <div className="h-16" />
        <Squelette lignes={4} />
      </main>
    )
  }

  const visibles = logs.filter((l) => {
    if (filtre === 'tous') return true
    return templateParId(plan, l.seanceTemplateId)?.type === filtre
  })

  const pts = (cle: 'rounds' | 'rpeMoyen' | 'volumeKg'): Point[] =>
    agregats.map((a) => ({
      semaine: a.semaine,
      valeur: cle === 'rpeMoyen' ? a.rpeMoyen : a[cle] > 0 ? a[cle] : null,
    }))

  const aDesDonnees = logs.length > 0

  return (
    <main className="pb-8">
      <Entete titre="Historique" sous={pluriel(logs.length, 'séance')} />

      {!aDesDonnees ? (
        <div className="px-5 pt-4">
          <EtatVide
            titre="Rien à afficher pour l’instant"
            texte="Les séances loggées apparaissent ici, avec leur durée, leur RPE et leur agrégation par semaine."
          />
        </div>
      ) : (
        <>
          <section className="px-5 pt-2">
            <h2 className="mb-2 px-1 text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
              Progression
            </h2>
            <div className="space-y-4">
            <GraphiqueBarres
              titre="Rounds cumulés"
              unite="rounds"
              donnees={pts('rounds')}
              couleur={SERIE_ROUNDS}
              semaineCourante={etat.semaineCourante}
            />
            <GraphiqueLigne
              titre="RPE moyen"
              unite="/ 10"
              donnees={pts('rpeMoyen')}
              couleur={SERIE_RPE}
              semaineCourante={etat.semaineCourante}
              min={1}
              max={10}
              format={(v) => v.toFixed(1)}
            />
            <GraphiqueBarres
              titre="Volume de renfo"
              unite="kg soulevés"
              donnees={pts('volumeKg')}
              couleur={SERIE_VOLUME}
              semaineCourante={etat.semaineCourante}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} t` : String(Math.round(v)))}
            />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="px-5 pb-2 text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
              Séances
            </h2>

            <ul className="flex list-none gap-2 overflow-x-auto px-5 pb-3" aria-label="Filtrer par type">
              {TYPES.map((t) => (
                <li key={t.valeur}>
                  <button
                    type="button"
                    aria-pressed={filtre === t.valeur}
                    onClick={() => setFiltre(t.valeur)}
                    className={cn(
                      'min-h-14 whitespace-nowrap rounded-full border px-5 text-[16px] font-semibold',
                      filtre === t.valeur
                        ? 'border-accent bg-accent text-on-accent'
                        : 'border-line bg-surface text-ink-2 active:bg-surface-2'
                    )}
                  >
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>

            {visibles.length === 0 ? (
              <div className="px-5">
                <EtatVide titre="Aucune séance de ce type" texte="Change de filtre pour voir le reste." />
              </div>
            ) : (
              <ul className="space-y-2 px-5">
                {visibles.map((log) => {
                  const template = templateParId(plan, log.seanceTemplateId)
                  const duree = dureeReelleMin(log)
                  return (
                    <li
                      key={log.id}
                      className="rounded-2xl border border-line bg-surface px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[18px] font-semibold">
                            {template?.nom ?? log.seanceTemplateId}
                          </p>
                          <p className="mt-0.5 text-[16px] text-ink-3">
                            {new Intl.DateTimeFormat('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            }).format(new Date(log.dateDebut))}{' '}
                            · semaine {log.semaine}
                            {template && ` · ${LIBELLE_TYPE[template.type]}`}
                          </p>
                        </div>
                        <PastilleStatut statut={log.statut} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[16px] text-ink-2">
                        <span>{duree !== null ? `${duree} min` : 'durée inconnue'}</span>
                        <span>{log.rpe ? `RPE ${log.rpe}/10` : 'RPE non noté'}</span>
                        <span>{pluriel(log.entrees.filter((e) => e.fait).length, 'exercice')}</span>
                      </div>
                      {log.gene && log.gene.length > 0 && (
                        <p className="mt-2 text-[16px] font-semibold text-warn">
                          Gêne :{' '}
                          {log.gene.map((g) => `${g.zone} ${g.niveau}/3`).join(', ')}
                        </p>
                      )}
                      {log.note && (
                        <p className="mt-2 text-[16px] leading-snug text-ink-2">« {log.note} »</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
