'use client'

import { useEffect } from 'react'
import { Bouton } from '@/components/ui/Bouton'
import { MOTIF_FIN, bipFin, vibrer } from '@/lib/audio'
import {
  type EtatChrono,
  demarrer,
  ecouleMs,
  mettreEnPause,
  reinitialiser,
  useSignaux,
  useTicker,
} from '@/lib/chrono'
import { formatDuree } from '@/lib/progression'
import { cn } from '@/lib/cn'

type Props = {
  dureeSec: number
  /** Etat pilote par le parent : survit a un aller-retour entre exercices. */
  chrono: EtatChrono
  setChrono: (maj: (c: EtatChrono) => EtatChrono) => void
  son: boolean
  vibration: boolean
  /** Appele une fois le compte a rebours arrive a zero. */
  onFini: (ecouleSec: number) => void
  /** Remonte le temps reellement ecoule, meme si on valide avant la fin. */
  onEcouleChange?: (sec: number) => void
}

/** Timer simple d'un exercice a duree : depart, pause, et on peut valider avant la fin. */
export function TimerDuree({
  dureeSec,
  chrono,
  setChrono,
  son,
  vibration,
  onFini,
  onEcouleChange,
}: Props) {
  const { declencher, reinit } = useSignaux()
  const now = useTicker(chrono.statut === 'marche')

  const ecoule = ecouleMs(chrono, now)
  const restantMs = Math.max(0, dureeSec * 1000 - ecoule)
  const fini = restantMs === 0 && chrono.statut !== 'pret'
  const progression = dureeSec > 0 ? Math.min(1, ecoule / (dureeSec * 1000)) : 0

  useEffect(() => {
    onEcouleChange?.(Math.round(ecoule / 1000))
  }, [ecoule, onEcouleChange])

  useEffect(() => {
    if (chrono.statut !== 'marche' || chrono.debutMs === null) return
    const finPrevue = chrono.debutMs + (dureeSec * 1000 - chrono.cumulMs)
    declencher('fin', finPrevue, now, () => {
      if (son) bipFin()
      if (vibration) vibrer(MOTIF_FIN)
    })
    if (now >= finPrevue) {
      setChrono((c) => mettreEnPause(c, finPrevue))
      onFini(dureeSec)
    }
  }, [now, chrono, dureeSec, son, vibration, declencher, onFini, setChrono])

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="relative mb-5 h-2 overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn('h-full rounded-full transition-[width] duration-100', fini ? 'bg-ok' : 'bg-accent')}
          style={{ width: `${progression * 100}%` }}
        />
      </div>

      <output
        className={cn(
          'block text-center text-7xl font-extrabold leading-none tracking-tight',
          fini && 'text-ok'
        )}
        aria-live="off"
      >
        {formatDuree(restantMs / 1000)}
      </output>
      <p className="mt-2 text-center text-[16px] text-ink-3">
        sur {formatDuree(dureeSec)} — {formatDuree(ecoule / 1000)} écoulé
      </p>

      <div className="mt-5 flex gap-3">
        {chrono.statut === 'marche' ? (
          <Bouton
            variante="secondaire"
            pleineLargeur
            onClick={() => setChrono((c) => mettreEnPause(c))}
          >
            Pause
          </Bouton>
        ) : (
          <Bouton
            variante="primaire"
            pleineLargeur
            onClick={() => setChrono((c) => demarrer(fini ? reinitialiser() : c))}
          >
            {chrono.statut === 'pret' ? 'Départ' : fini ? 'Refaire' : 'Reprendre'}
          </Bouton>
        )}
        {chrono.statut !== 'pret' && !fini && (
          <Bouton
            variante="fantome"
            className="shrink-0"
            onClick={() => {
              setChrono(reinitialiser)
              reinit()
            }}
          >
            Remettre à zéro
          </Bouton>
        )}
      </div>
    </div>
  )
}
