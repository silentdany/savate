'use client'

import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  valeur: number
  onChange: (v: number) => void
  pas?: number
  min?: number
  max?: number
  suffixe?: string
  label: string
  /** Sous-titre discret, ex. « dernière fois : 22 kg ». */
  rappel?: string
  decimales?: number
  /** Affichage personnalise (ex. 120 -> « 2:00 »). */
  formatValeur?: (v: number) => string
}

/**
 * Saisie chiffree sans clavier. Appui maintenu = repetition acceleree, sinon
 * passer de 0 a 40 kg demanderait quarante taps.
 */
export function Stepper({
  valeur,
  onChange,
  pas = 1,
  min = 0,
  max = 999,
  suffixe,
  label,
  rappel,
  decimales = 0,
  formatValeur,
}: Props) {
  const timers = useRef<{ delai?: number; repet?: number }>({})
  // Valeur courante pendant une repetition : le prop `valeur` n'a pas encore
  // ete rafraichi entre deux crans. Renseigne dans le handler, jamais au rendu.
  const valeurRef = useRef(valeur)

  const arrondi = useCallback(
    (v: number) => {
      const f = Math.pow(10, decimales)
      return Math.min(max, Math.max(min, Math.round(v * f) / f))
    },
    [decimales, max, min]
  )

  const stop = useCallback(() => {
    if (timers.current.delai) window.clearTimeout(timers.current.delai)
    if (timers.current.repet) window.clearInterval(timers.current.repet)
    timers.current = {}
  }, [])

  useEffect(() => stop, [stop])

  const demarrer = (delta: number) => {
    valeurRef.current = valeur
    const cran = () => {
      const suivant = arrondi(valeurRef.current + delta)
      valeurRef.current = suivant
      onChange(suivant)
    }
    cran()
    stop()
    timers.current.delai = window.setTimeout(() => {
      timers.current.repet = window.setInterval(cran, 90)
    }, 450)
  }

  const classeBouton =
    'flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface-3 ' +
    'text-ink active:bg-accent active:text-on-accent disabled:opacity-30'

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[17px] font-semibold text-ink-2">{label}</span>
        {rappel && <span className="truncate text-[16px] text-ink-3">{rappel}</span>}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Diminuer ${label}`}
          className={classeBouton}
          disabled={valeur <= min}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            demarrer(-pas)
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
        >
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        <output className={cn('flex-1 text-center text-5xl font-extrabold tracking-tight')}>
          {formatValeur ? formatValeur(valeur) : valeur.toFixed(decimales)}
          {suffixe && <span className="ml-1 text-2xl font-bold text-ink-3">{suffixe}</span>}
        </output>

        <button
          type="button"
          aria-label={`Augmenter ${label}`}
          className={classeBouton}
          disabled={valeur >= max}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            demarrer(pas)
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onPointerLeave={stop}
        >
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
