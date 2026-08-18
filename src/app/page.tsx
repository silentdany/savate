'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { amorcerAudio } from '@/lib/audio'
import { demarrerSeance } from '@/lib/db'
import { useContexte, useHorloge, useLogsSemaine, useMonte, useSeanceEnCours } from '@/lib/hooks'
import { CLASSE_TYPE, LIBELLE_TYPE, dureeCible, pluriel, templateParId } from '@/lib/progression'
import { resumeParametres, seancesFaites, suggererSeance } from '@/lib/seance-du-jour'
import type { RaisonSuggestion } from '@/lib/seance-du-jour'
import { InviteInstallation } from '@/components/InviteInstallation'
import { Bouton } from '@/components/ui/Bouton'
import { BarreAction } from '@/components/ui/BarreAction'
import { Carte, PastilleType, Squelette } from '@/components/ui/divers'
import { cn } from '@/lib/cn'

const RAISON: Record<RaisonSuggestion, string> = {
  jour: 'Prévu aujourd’hui',
  rattrapage: 'À rattraper',
  mobilite: 'Jour de repos',
  tout_fait: 'Semaine bouclée',
}

export default function Aujourdhui() {
  const monte = useMonte()
  const router = useRouter()
  const ctx = useContexte()
  const logsSemaine = useLogsSemaine(ctx?.semaineCourante)
  const enCours = useSeanceEnCours()
  const maintenant = useHorloge(30_000)
  const [lancement, setLancement] = useState(false)

  if (!monte || !ctx || logsSemaine === undefined) {
    return (
      <main className="px-5 pt-safe">
        <div className="h-10" />
        <Squelette lignes={2} />
      </main>
    )
  }

  const { plan, parametres, semaineCourante } = ctx
  const suggestion = suggererSeance(plan, logsSemaine)
  const faites = new Set(seancesFaites(logsSemaine))
  const templateEnCours = enCours ? templateParId(plan, enCours.seanceTemplateId) : undefined

  const dateLisible = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(maintenant))

  const demarrer = async (templateId: string) => {
    if (lancement) return
    setLancement(true)
    // Amorce audio dans le geste utilisateur : sans ca, plus aucun bip ensuite.
    amorcerAudio()
    try {
      const id = await demarrerSeance(templateId, semaineCourante)
      router.push(`/seance/${id}`)
    } catch {
      setLancement(false)
    }
  }

  const reprendre = () => {
    if (!enCours) return
    amorcerAudio()
    router.push(`/seance/${enCours.id}`)
  }

  // Jours de la semaine, pour les pastilles « fait / à venir ».
  const pastilles = plan.jours
    .filter((j) => j.seanceId)
    .map((j) => {
      const t = templateParId(plan, j.seanceId)
      return t ? { template: t, optionnel: j.optionnel, fait: faites.has(t.id) } : null
    })
    .filter((x): x is { template: NonNullable<ReturnType<typeof templateParId>>; optionnel: boolean; fait: boolean } => x !== null)

  return (
    <main className="pb-40">
      <header className="px-5 pt-safe">
        <div className="flex items-center gap-2">
          <p className="text-[16px] font-bold uppercase tracking-[0.14em] text-accent">
            Semaine {semaineCourante} sur {plan.nbSemaines}
          </p>
          {parametres.allegee && (
            <span className="rounded-full border border-warn/40 bg-warn/15 px-2.5 py-0.5 text-[16px] font-semibold text-warn">
              allégée
            </span>
          )}
        </div>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight first-letter:uppercase">{dateLisible}</h1>
      </header>

      <div className="mt-5 space-y-4 px-5">
        {enCours && templateEnCours && (
          <button
            type="button"
            onClick={reprendre}
            className="w-full rounded-card border-2 border-accent bg-accent-soft p-5 text-left active:scale-[0.99]"
          >
            <p className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-[0.12em] text-accent">
              <span className="size-2.5 animate-beat rounded-full bg-accent" />
              Séance en cours
            </p>
            <p className="mt-2 text-2xl font-bold">{templateEnCours.nom}</p>
            <p className="mt-1 text-[17px] text-ink-2">
              Commencée{' '}
              {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
                new Date(enCours.dateDebut)
              )}
              {' — '}
              {pluriel(enCours.entrees.filter((e) => e.fait).length, 'exercice')} déjà validé
              {enCours.entrees.filter((e) => e.fait).length > 1 ? 's' : ''}
            </p>
            <p className="mt-3 text-[18px] font-bold text-accent">Reprendre →</p>
          </button>
        )}

        {suggestion ? (
          <Carte className="p-0">
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <PastilleType type={suggestion.template.type}>
                {LIBELLE_TYPE[suggestion.template.type]}
              </PastilleType>
              <span className="text-[17px] font-semibold text-ink-2">
                ~{dureeCible(suggestion.template, parametres)} min
              </span>
            </div>

            <div className="px-5 pt-3">
              <p className="text-[16px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                {RAISON[suggestion.raison]}
              </p>
              <h2
                className={cn(
                  'mt-1 text-[28px] font-extrabold leading-tight tracking-tight',
                  CLASSE_TYPE[suggestion.template.type]
                )}
              >
                {suggestion.template.nom}
              </h2>
            </div>

            <dl className="mt-4 divide-y divide-line border-y border-line">
              {resumeParametres(suggestion.template, parametres).map((p) => (
                <div key={p.label} className="flex items-baseline justify-between gap-4 px-5 py-3">
                  <dt className="text-[17px] text-ink-2">{p.label}</dt>
                  <dd
                    className={cn(
                      'text-right text-[18px] font-bold',
                      p.alerte ? 'text-warn' : 'text-ink'
                    )}
                  >
                    {p.valeur}
                  </dd>
                </div>
              ))}
            </dl>

            {parametres.note && (
              <p className="px-5 py-4 text-[17px] leading-relaxed text-ink-2">{parametres.note}</p>
            )}
          </Carte>
        ) : (
          <Carte>
            <p className="text-[17px] text-ink-2">
              Aucune séance configurée dans le plan. Vérifie le fichier de seed.
            </p>
          </Carte>
        )}

        <section>
          <h2 className="mb-3 px-1 text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
            Cette semaine
          </h2>
          <ul className="flex flex-wrap gap-2">
            {pastilles.map(({ template, optionnel, fait }) => (
              <li key={template.id}>
                <span
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-[16px] font-semibold',
                    fait
                      ? 'border-ok/40 bg-ok/15 text-ok'
                      : 'border-line bg-surface text-ink-3'
                  )}
                >
                  {fait ? (
                    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="size-2 rounded-full bg-current opacity-50" />
                  )}
                  {template.nom.split('—')[0]?.trim()}
                  {optionnel && !fait && <span className="text-ink-3">(opt.)</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <InviteInstallation />

        {suggestion && suggestion.template.id !== plan.seanceMobiliteId && (
          <Bouton
            variante="fantome"
            taille="md"
            pleineLargeur
            onClick={() => demarrer(plan.seanceMobiliteId)}
          >
            Plutôt 15 min de mobilité
          </Bouton>
        )}
      </div>

      {suggestion && (
        <BarreAction>
          <Bouton
            variante="primaire"
            taille="xl"
            pleineLargeur
            disabled={lancement}
            onClick={() => demarrer(suggestion.template.id)}
          >
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
              <path d="M8 5.5 19 12 8 18.5z" fill="currentColor" />
            </svg>
            Démarrer
          </Bouton>
        </BarreAction>
      )}
    </main>
  )
}
