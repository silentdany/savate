'use client'

import { cn } from '@/lib/cn'
import type { StatutSeance, TypeSeance } from '@/lib/types'

const FOND_TYPE: Record<TypeSeance, string> = {
  bf: 'bg-bf/15 text-bf border-bf/30',
  renfo: 'bg-renfo/15 text-renfo border-renfo/30',
  cardio: 'bg-cardio/15 text-cardio border-cardio/30',
  mobilite: 'bg-mobilite/15 text-mobilite border-mobilite/30',
}

export function PastilleType({ type, children }: { type: TypeSeance; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[16px] font-semibold',
        FOND_TYPE[type]
      )}
    >
      {children}
    </span>
  )
}

export const LIBELLE_STATUT: Record<StatutSeance, string> = {
  en_cours: 'En cours',
  terminee: 'Terminée',
  partielle: 'Partielle',
  convertie_mobilite: 'Mobilité',
  sautee: 'Sautée',
}

const FOND_STATUT: Record<StatutSeance, string> = {
  en_cours: 'bg-accent/20 text-accent border-accent/40',
  terminee: 'bg-ok/15 text-ok border-ok/30',
  partielle: 'bg-warn/15 text-warn border-warn/30',
  convertie_mobilite: 'bg-mobilite/15 text-mobilite border-mobilite/30',
  sautee: 'bg-surface-3 text-ink-3 border-line',
}

export function PastilleStatut({ statut }: { statut: StatutSeance }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[16px] font-semibold',
        FOND_STATUT[statut]
      )}
    >
      {LIBELLE_STATUT[statut]}
    </span>
  )
}

export function Carte({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-card border border-line bg-surface p-5', className)}>{children}</div>
  )
}

export function EtatVide({
  titre,
  texte,
  action,
}: {
  titre: string
  texte: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <p className="text-xl font-bold">{titre}</p>
      <p className="mx-auto mt-2 max-w-xs text-[17px] leading-relaxed text-ink-2">{texte}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Squelette({ lignes = 3 }: { lignes?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: lignes }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
      ))}
    </div>
  )
}

export function Entete({ titre, sous }: { titre: string; sous?: string }) {
  return (
    <header className="px-5 pt-safe pb-2">
      {sous && (
        <p className="text-[16px] font-semibold uppercase tracking-[0.12em] text-ink-3">{sous}</p>
      )}
      <h1 className="mt-1 text-4xl font-extrabold tracking-tight">{titre}</h1>
    </header>
  )
}

export function LigneInfo({ label, valeur }: { label: string; valeur: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-[17px] text-ink-2">{label}</span>
      <span className="text-right text-[17px] font-semibold">{valeur}</span>
    </div>
  )
}
