'use client'

import { useState } from 'react'
import { Bouton } from '@/components/ui/Bouton'
import { Curseur } from '@/components/ui/Curseur'
import { cn } from '@/lib/cn'
import type { NiveauGene, Plan, ZoneGene } from '@/lib/types'

const ZONES: { zone: ZoneGene; label: string }[] = [
  { zone: 'aine', label: 'Aine / adducteurs' },
  { zone: 'ischio', label: 'Ischio-jambiers' },
  { zone: 'genou', label: 'Genou' },
  { zone: 'cheville', label: 'Cheville' },
  { zone: 'dos', label: 'Dos' },
  { zone: 'epaule', label: 'Épaule' },
]

const RPE_LIBELLE = [
  '',
  'Très facile',
  'Facile',
  'Modéré',
  'Un peu dur',
  'Dur',
  'Assez dur',
  'Très dur',
  'Très très dur',
  'Presque maximal',
  'Maximal',
] as const

const NIVEAU_LIBELLE = ['aucune', 'légère', 'nette', 'forte'] as const

const CLASSE_NIVEAU = [
  'border-line bg-surface-2 text-ink-3',
  'border-warn/40 bg-warn/10 text-warn',
  'border-accent/50 bg-accent-soft text-accent',
  'border-danger/60 bg-danger-soft text-danger',
] as const

export type ResultatCloture = {
  rpe: number
  gene: { zone: ZoneGene; niveau: NiveauGene }[]
  note?: string
}

type Props = {
  plan: Plan
  nomSeance: string
  exercicesFaits: number
  exercicesTotal: number
  dureeMin: number
  onTerminer: (r: ResultatCloture) => void
  onRetour: () => void
}

export function ClotureSeance({
  plan,
  nomSeance,
  exercicesFaits,
  exercicesTotal,
  dureeMin,
  onTerminer,
  onRetour,
}: Props) {
  const [rpe, setRpe] = useState(6)
  const [genes, setGenes] = useState<Partial<Record<ZoneGene, 0 | NiveauGene>>>({})
  const [noteVisible, setNoteVisible] = useState(false)
  const [note, setNote] = useState('')

  const genesDeclarees = ZONES.map((z) => ({ zone: z.zone, niveau: genes[z.zone] ?? 0 })).filter(
    (g): g is { zone: ZoneGene; niveau: NiveauGene } => g.niveau > 0
  )
  const alertes = genesDeclarees.filter((g) => g.niveau === 3)

  return (
    <main className="pb-40">
      <header className="px-5 pt-safe">
        <p className="text-[16px] font-bold uppercase tracking-[0.14em] text-ink-3">
          Fin de séance
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{nomSeance}</h1>
        <p className="mt-1 text-[17px] text-ink-2">
          {exercicesFaits} exercice(s) sur {exercicesTotal} · {dureeMin} min
        </p>
      </header>

      <section className="mt-7 px-5">
        <h2 className="text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
          Difficulté ressentie
        </h2>
        <div className="mt-3 rounded-card border border-line bg-surface p-5">
          <div className="flex items-baseline justify-center gap-3">
            <output className="text-7xl font-extrabold leading-none tracking-tight text-accent">
              {rpe}
            </output>
            <span className="text-2xl font-bold text-ink-3">/ 10</span>
          </div>
          <p className="mt-1 text-center text-xl font-semibold">{RPE_LIBELLE[rpe]}</p>
          <div className="mt-4">
            <Curseur valeur={rpe} onChange={setRpe} min={1} max={10} label="Difficulté ressentie" />
          </div>
          <div className="flex justify-between px-1 text-[16px] text-ink-3">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
          Une gêne quelque part ?
        </h2>
        <p className="mt-1 text-[16px] text-ink-3">
          Tape une zone pour monter d’un cran : légère, nette, forte.
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {ZONES.map(({ zone, label }) => {
            const niveau = genes[zone] ?? 0
            return (
              <li key={zone}>
                <button
                  type="button"
                  onClick={() =>
                    setGenes((g) => ({ ...g, [zone]: (((niveau + 1) % 4) as 0 | NiveauGene) }))
                  }
                  aria-label={`${label}, gêne ${NIVEAU_LIBELLE[niveau]}`}
                  className={cn(
                    'flex min-h-[4.5rem] w-full flex-col items-start justify-center gap-1 rounded-2xl border px-4 text-left transition-colors',
                    CLASSE_NIVEAU[niveau]
                  )}
                >
                  <span className="text-[17px] font-semibold leading-tight">{label}</span>
                  <span className="text-[16px] font-medium opacity-90">
                    {NIVEAU_LIBELLE[niveau]}
                    {niveau > 0 && ` · ${niveau}/3`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {alertes.length > 0 && (
          <div className="mt-4 space-y-3">
            {alertes.map((a) => {
              const seuil = plan.seuilsVigilance.find((s) => s.zone === a.zone)
              if (!seuil) return null
              return (
                <div
                  key={a.zone}
                  className="rounded-2xl border border-danger/50 bg-danger-soft px-4 py-4"
                >
                  <p className="flex items-center gap-2 text-[16px] font-bold uppercase tracking-[0.1em] text-danger">
                    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                      <path
                        d="M12 4.5 21 20H3z M12 10v4.5 M12 17.2v.1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Seuil de vigilance
                  </p>
                  <p className="mt-2 text-[17px] leading-relaxed text-ink">{seuil.seuil}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-7 px-5">
        {noteVisible ? (
          <>
            <label htmlFor="note" className="text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
              Note
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              autoFocus
              className="mt-2 w-full rounded-2xl border border-line bg-surface p-4 text-[17px] text-ink outline-none focus-visible:border-accent"
              placeholder="Ce qui a marché, ce qui a coincé…"
            />
          </>
        ) : (
          <Bouton variante="fantome" taille="md" pleineLargeur onClick={() => setNoteVisible(true)}>
            Ajouter une note (facultatif)
          </Bouton>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md">
        <div className="pointer-events-none h-10 bg-gradient-to-t from-bg via-bg/85 to-transparent" />
        <div
          className="space-y-2 bg-bg px-5 pt-1"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <Bouton
            variante="primaire"
            taille="xl"
            pleineLargeur
            onClick={() => {
              const r: ResultatCloture = { rpe, gene: genesDeclarees }
              const propre = note.trim()
              if (propre) r.note = propre
              onTerminer(r)
            }}
          >
            Terminer la séance
          </Bouton>
          <Bouton variante="fantome" taille="md" pleineLargeur onClick={onRetour}>
            Revenir aux exercices
          </Bouton>
        </div>
      </div>
    </main>
  )
}
