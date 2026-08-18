'use client'

import { blocsVisibles, libelleCible, resoudreTexte } from '@/lib/progression'
import type { ParametresSemaine, SeanceTemplate } from '@/lib/types'

/** Prévisualisation en lecture seule d'une séance, semaine appliquée. */
export function ApercuSeance({
  template,
  parametres,
}: {
  template: SeanceTemplate
  parametres: ParametresSemaine
}) {
  const blocs = blocsVisibles(template, parametres)

  return (
    <div className="space-y-6">
      {blocs.map((bloc, i) => {
        const tours = bloc.toursSuitProgression ? parametres.renfoTours : 1
        return (
          <section key={`${bloc.bloc}-${i}`}>
            <h3 className="flex items-baseline gap-2 text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
              <span>{bloc.titre}</span>
              {tours > 1 && <span className="text-accent">× {tours} tours</span>}
            </h3>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {bloc.exercices.map((ex) => {
                const consigne = resoudreTexte(ex.consigne, parametres)
                return (
                  <li key={ex.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[18px] font-semibold leading-snug">{ex.nom}</p>
                      {consigne && (
                        <p className="mt-0.5 text-[16px] leading-snug text-ink-3">{consigne}</p>
                      )}
                    </div>
                    <span className="shrink-0 whitespace-nowrap pt-0.5 text-[16px] font-bold text-ink-2">
                      {libelleCible(ex, parametres.bfRounds)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
