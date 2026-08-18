'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Bouton } from '@/components/ui/Bouton'
import { Stepper } from '@/components/ui/Stepper'
import { cn } from '@/lib/cn'
import {
  MOTIF_AVERTISSEMENT,
  MOTIF_FIN,
  MOTIF_FIN_SEANCE,
  amorcerAudio,
  bipAvertissement,
  bipFin,
  bipFinSeance,
  vibrer,
} from '@/lib/audio'
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
import { type ConfigRounds, dureeTotaleMs, phaseA, signauxDe } from '@/lib/rounds'

type Props = {
  config: ConfigRounds
  setConfig: (maj: (c: ConfigRounds) => ConfigRounds) => void
  /**
   * Etat du chrono pilote par le parent : il survit ainsi a un aller-retour
   * vers un autre exercice, sans repartir de zero en pleine serie.
   */
  chrono: EtatChrono
  setChrono: (maj: (c: EtatChrono) => EtatChrono) => void
  son: boolean
  vibration: boolean
  /** Rounds reellement effectues, remontes en continu pour la sauvegarde. */
  onRoundsFaitsChange: (n: number) => void
}

export function TimerRounds({
  config,
  setConfig,
  chrono,
  setChrono,
  son,
  vibration,
  onRoundsFaitsChange,
}: Props) {
  const { declencher, reinit } = useSignaux()
  const now = useTicker(chrono.statut === 'marche')

  const ecoule = ecouleMs(chrono, now)
  const phase = phaseA(ecoule, config)
  const totalMs = dureeTotaleMs(config)
  const signaux = useMemo(() => signauxDe(config), [config])

  const enMarche = chrono.statut === 'marche'
  const demarree = chrono.statut !== 'pret'
  const termine = phase.type === 'fini'

  // Remonte les rounds faits au parent, qui les persiste.
  const dernierRemonte = useRef(-1)
  useEffect(() => {
    if (phase.roundsFaits !== dernierRemonte.current) {
      dernierRemonte.current = phase.roundsFaits
      onRoundsFaitsChange(phase.roundsFaits)
    }
  }, [phase.roundsFaits, onRoundsFaitsChange])

  // Bips et vibrations. Les instants sont absolus, derives des timestamps :
  // au retour d'un verrouillage d'ecran, les signaux depasses sont consommes
  // sans etre rejoues en rafale (cf. useSignaux).
  useEffect(() => {
    if (!enMarche || chrono.debutMs === null) return
    const origine = chrono.debutMs - chrono.cumulMs
    for (const s of signaux) {
      declencher(s.cle, origine + s.instantMs, now, () => {
        if (s.genre === 'avertissement') {
          if (son) bipAvertissement()
          if (vibration) vibrer(MOTIF_AVERTISSEMENT)
        } else if (s.genre === 'fin') {
          if (son) bipFin()
          if (vibration) vibrer(MOTIF_FIN)
        } else {
          if (son) bipFinSeance()
          if (vibration) vibrer(MOTIF_FIN_SEANCE)
        }
      })
    }
  }, [now, enMarche, chrono.debutMs, chrono.cumulMs, signaux, son, vibration, declencher])

  // Fige le chrono a l'instant exact de la fin, pas au tick suivant.
  useEffect(() => {
    if (termine && chrono.statut === 'marche') {
      setChrono(() => ({ statut: 'pause', debutMs: null, cumulMs: totalMs }))
    }
  }, [termine, chrono.statut, totalMs, setChrono])

  const lancer = useCallback(() => {
    amorcerAudio() // filet de securite : on est dans un vrai geste utilisateur
    setChrono((c) => demarrer(c))
  }, [setChrono])

  const toutRemettreAZero = useCallback(() => {
    setChrono(reinitialiser)
    reinit()
    dernierRemonte.current = -1
    onRoundsFaitsChange(0)
  }, [reinit, onRoundsFaitsChange, setChrono])

  /** Saute a la phase suivante en deplacant le curseur de temps, pas l'horloge. */
  const phaseSuivante = useCallback(() => {
    const cible = Math.min(totalMs, ecoule + phase.restantMs)
    setChrono((c) =>
      c.statut === 'marche'
        ? { statut: 'marche', debutMs: Date.now(), cumulMs: cible }
        : { ...c, cumulMs: cible }
    )
  }, [ecoule, phase.restantMs, totalMs, setChrono])

  // ---- Configuration, avant le premier depart ----------------------------
  if (!demarree) {
    return (
      <div className="space-y-3">
        <Stepper
          label="Rounds"
          valeur={config.nbRounds}
          onChange={(v) => setConfig((c) => ({ ...c, nbRounds: v }))}
          min={1}
          max={20}
        />
        <Stepper
          label="Durée d’un round"
          valeur={config.roundSec}
          onChange={(v) => setConfig((c) => ({ ...c, roundSec: v }))}
          pas={15}
          min={30}
          max={600}
          formatValeur={formatDuree}
        />
        <Stepper
          label="Repos"
          valeur={config.reposSec}
          onChange={(v) => setConfig((c) => ({ ...c, reposSec: v }))}
          pas={15}
          min={15}
          max={300}
          formatValeur={formatDuree}
        />
        <p className="px-1 text-center text-[16px] text-ink-3">
          Total {formatDuree(dureeTotaleMs(config) / 1000)} pour {config.nbRounds} rounds
        </p>
      </div>
    )
  }

  // ---- Timer en cours ----------------------------------------------------
  const travail = phase.type === 'travail'
  const derniereLigneDroite = phase.restantMs <= 10_000 && !termine

  return (
    <div
      className={cn(
        'rounded-card border-2 p-5 transition-colors',
        termine
          ? 'border-ok/50 bg-ok/10'
          : travail
            ? 'border-accent bg-accent-soft'
            : 'border-repos bg-repos-soft'
      )}
    >
      <div className="flex items-baseline justify-between">
        <p
          className={cn(
            'text-xl font-extrabold uppercase tracking-[0.16em]',
            termine ? 'text-ok' : travail ? 'text-accent' : 'text-repos'
          )}
        >
          {termine ? 'Terminé' : travail ? 'Travail' : 'Repos'}
        </p>
        <p className="text-xl font-bold text-ink-2">
          Round {Math.min(phase.round, config.nbRounds)}
          <span className="text-ink-3"> / {config.nbRounds}</span>
        </p>
      </div>

      <output
        className={cn(
          'mt-2 block text-center text-8xl font-extrabold leading-none tracking-tight',
          termine ? 'text-ok' : travail ? 'text-accent' : 'text-repos',
          derniereLigneDroite && enMarche && 'animate-beat'
        )}
      >
        {termine ? formatDuree(0) : formatDuree(phase.restantMs / 1000)}
      </output>

      <div className="mt-4 flex gap-1.5" aria-hidden>
        {Array.from({ length: config.nbRounds }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full',
              i < phase.roundsFaits
                ? 'bg-ok'
                : i === phase.roundsFaits && !termine
                  ? travail
                    ? 'bg-accent'
                    : 'bg-repos'
                  : 'bg-surface-3'
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[16px] text-ink-3">
        {phase.roundsFaits} round{phase.roundsFaits > 1 ? 's' : ''} fait
        {phase.roundsFaits > 1 ? 's' : ''} — {formatDuree(ecoule / 1000)} sur{' '}
        {formatDuree(totalMs / 1000)}
      </p>

      <div className="mt-5 space-y-3">
        {termine ? (
          <Bouton variante="secondaire" pleineLargeur onClick={toutRemettreAZero}>
            Relancer une série
          </Bouton>
        ) : (
          <>
            <div className="flex gap-3">
              <Bouton
                variante={enMarche ? 'secondaire' : travail ? 'primaire' : 'repos'}
                pleineLargeur
                onClick={() => (enMarche ? setChrono((c) => mettreEnPause(c)) : lancer())}
              >
                {enMarche ? 'Pause' : 'Reprendre'}
              </Bouton>
              <Bouton variante="secondaire" className="shrink-0 px-5" onClick={phaseSuivante}>
                {travail ? 'Finir le round' : 'Reprendre'}
              </Bouton>
            </div>
            <Bouton variante="fantome" taille="md" pleineLargeur onClick={toutRemettreAZero}>
              Remettre la série à zéro
            </Bouton>
          </>
        )}
      </div>
    </div>
  )
}
