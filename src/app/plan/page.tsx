'use client'

import { useState } from 'react'
import { ApercuSeance } from '@/components/ApercuSeance'
import { Feuille } from '@/components/ui/Feuille'
import { Carte, Entete, PastilleType, Squelette } from '@/components/ui/divers'
import { cn } from '@/lib/cn'
import { useEtat, useLogs, useMonte, usePlan } from '@/lib/hooks'
import {
  LIBELLE_TYPE,
  dureeCible,
  parametresSemaine,
  templateParId,
} from '@/lib/progression'
import type { ParametresSemaine, SeanceLog, SeanceTemplate } from '@/lib/types'

type EtatSeance = 'fait' | 'partiel' | 'saute' | 'a_venir' | 'manque'

const LIBELLE_ETAT: Record<EtatSeance, string> = {
  fait: 'Fait',
  partiel: 'Partiel',
  saute: 'Sautée',
  a_venir: 'À venir',
  manque: 'Non faite',
}

const CLASSE_ETAT: Record<EtatSeance, string> = {
  fait: 'border-ok/40 bg-ok/15 text-ok',
  partiel: 'border-warn/40 bg-warn/15 text-warn',
  saute: 'border-line bg-surface-2 text-ink-3',
  a_venir: 'border-line bg-surface-2 text-ink-3',
  manque: 'border-danger/30 bg-danger-soft text-danger',
}

function etatDe(
  logs: readonly SeanceLog[],
  semaine: number,
  templateId: string,
  semaineCourante: number
): EtatSeance {
  const pertinents = logs.filter((l) => l.semaine === semaine && l.seanceTemplateId === templateId)
  if (pertinents.some((l) => l.statut === 'terminee')) return 'fait'
  if (pertinents.some((l) => l.statut === 'partielle' || l.statut === 'convertie_mobilite'))
    return 'partiel'
  if (pertinents.some((l) => l.statut === 'en_cours')) return 'partiel'
  if (pertinents.some((l) => l.statut === 'sautee')) return 'saute'
  return semaine < semaineCourante ? 'manque' : 'a_venir'
}

export default function PagePlan() {
  const monte = useMonte()
  const plan = usePlan()
  const etat = useEtat()
  const logs = useLogs()
  const [depliee, setDepliee] = useState<number | null>(null)
  const [apercu, setApercu] = useState<{ t: SeanceTemplate; p: ParametresSemaine } | null>(null)

  if (!monte || !plan || !etat || !logs) {
    return (
      <main className="px-5 pt-safe">
        <div className="h-16" />
        <Squelette lignes={4} />
      </main>
    )
  }

  const semaineOuverte = depliee ?? etat.semaineCourante

  return (
    <main className="pb-8">
      <Entete titre="Plan" sous={`${plan.nbSemaines} semaines`} />
      <p className="px-5 pb-4 text-[17px] text-ink-2">{plan.nom}</p>

      <div className="space-y-3 px-5">
        {plan.progression.map((ligne) => {
          const p = parametresSemaine(plan, ligne.semaine, etat.semainesAllegees)
          const ouverte = semaineOuverte === ligne.semaine
          const courante = etat.semaineCourante === ligne.semaine
          const seances = plan.jours
            .map((j) => ({ jour: j, template: templateParId(plan, j.seanceId) }))
            .filter((x): x is { jour: typeof x.jour; template: SeanceTemplate } => !!x.template)

          return (
            <Carte
              key={ligne.semaine}
              className={cn('p-0 overflow-hidden', courante && 'border-accent/60')}
            >
              <button
                type="button"
                onClick={() => setDepliee(ouverte ? -1 : ligne.semaine)}
                aria-expanded={ouverte}
                className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left active:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-xl font-extrabold tracking-tight">
                      Semaine {ligne.semaine}
                    </span>
                    {courante && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[16px] font-bold text-on-accent">
                        en cours
                      </span>
                    )}
                    {p.allegee && (
                      <span className="rounded-full border border-warn/40 bg-warn/15 px-2.5 py-0.5 text-[16px] font-semibold text-warn">
                        allégée
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-[17px] text-ink-2">
                    {p.bfRounds} rounds · {p.bfIntensitePct[0]}–{p.bfIntensitePct[1]} %{' '}
                    {p.coupsHautsAutorises ? '· coups hauts' : '· sans coups hauts'} · {p.renfoTours}{' '}
                    tours
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={cn('size-7 shrink-0 text-ink-3 transition-transform', ouverte && 'rotate-180')}
                  aria-hidden
                >
                  <path
                    d="m6 9.5 6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {ouverte && (
                <div className="border-t border-line px-5 py-4">
                  {ligne.note && (
                    <p className="mb-4 text-[17px] leading-relaxed text-ink-2">{ligne.note}</p>
                  )}
                  <p className="mb-3 text-[16px] text-ink-3">
                    <span className="font-semibold text-ink-2">Cardio :</span> {p.cardioFormat}
                  </p>
                  <ul className="space-y-2">
                    {seances.map(({ jour, template }) => {
                      const e = etatDe(logs, ligne.semaine, template.id, etat.semaineCourante)
                      return (
                        <li key={`${jour.jour}-${template.id}`}>
                          <button
                            type="button"
                            onClick={() => setApercu({ t: template, p })}
                            className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-left active:bg-surface-3"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[18px] font-semibold">
                                {template.nom}
                              </span>
                              <span className="mt-0.5 block text-[16px] text-ink-3">
                                {LIBELLE_TYPE[template.type]} · ~{dureeCible(template, p)} min
                                {jour.optionnel && ' · optionnelle'}
                              </span>
                            </span>
                            <span
                              className={cn(
                                'shrink-0 rounded-full border px-3 py-1 text-[16px] font-semibold',
                                CLASSE_ETAT[e]
                              )}
                            >
                              {LIBELLE_ETAT[e]}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </Carte>
          )
        })}
      </div>

      <Feuille
        ouverte={apercu !== null}
        onOpenChange={(v) => !v && setApercu(null)}
        titre={apercu?.t.nom ?? ''}
        description={
          apercu
            ? `Semaine ${apercu.p.semaine} · ~${dureeCible(apercu.t, apercu.p)} min · lecture seule`
            : undefined
        }
      >
        {apercu && (
          <>
            <div className="mb-5">
              <PastilleType type={apercu.t.type}>{LIBELLE_TYPE[apercu.t.type]}</PastilleType>
            </div>
            <ApercuSeance template={apercu.t} parametres={apercu.p} />
            <div className="h-6" />
          </>
        )}
      </Feuille>
    </main>
  )
}
