'use client'

import { useCallback, useRef, useSyncExternalStore } from 'react'

/**
 * Primitive de chronometrage.
 *
 * Piege numero un du cahier des charges : le temps ne doit JAMAIS etre
 * accumule dans un setInterval. Un compteur incremental derive, et il se fige
 * quand l'onglet passe en arriere-plan (les timers sont brides). Ici, l'etat
 * ne contient que des timestamps ; le temps ecoule est une fonction pure de
 * `Date.now()`. Le setInterval ne sert qu'a redessiner.
 */
export type EtatChrono = {
  statut: 'pret' | 'marche' | 'pause' | 'fini'
  /** Timestamp du dernier depart. */
  debutMs: number | null
  /** Temps deja ecoule lors des periodes de marche precedentes. */
  cumulMs: number
}

export const CHRONO_INITIAL: EtatChrono = { statut: 'pret', debutMs: null, cumulMs: 0 }

export function ecouleMs(e: EtatChrono, now: number): number {
  if (e.statut === 'marche' && e.debutMs !== null) return e.cumulMs + Math.max(0, now - e.debutMs)
  return e.cumulMs
}

export function demarrer(e: EtatChrono, now = Date.now()): EtatChrono {
  if (e.statut === 'marche') return e
  return { statut: 'marche', debutMs: now, cumulMs: e.cumulMs }
}

export function mettreEnPause(e: EtatChrono, now = Date.now()): EtatChrono {
  if (e.statut !== 'marche') return e
  return { statut: 'pause', debutMs: null, cumulMs: ecouleMs(e, now) }
}

export function reinitialiser(): EtatChrono {
  return { ...CHRONO_INITIAL }
}

/**
 * Horloge partagee par toute l'app. Elle vit au niveau du module, hors du rendu :
 * les instantanes lus par useSyncExternalStore sont ainsi de simples lectures de
 * variable, et non des appels a Date.now() pendant le rendu.
 */
let instant = Date.now()

/**
 * Redessine tant que `actif`. Redessine aussi au retour au premier plan : c'est
 * ce qui rattrape l'affichage apres un verrouillage d'ecran, sans jamais toucher
 * au temps lui-meme, toujours recalcule depuis les timestamps.
 */
export function useTicker(actif: boolean, intervalMs = 100): number {
  const abonner = useCallback(
    (prevenir: () => void) => {
      if (!actif) return () => {}
      const battre = () => {
        instant = Date.now()
        prevenir()
      }
      battre()
      const id = window.setInterval(battre, intervalMs)
      document.addEventListener('visibilitychange', battre)
      window.addEventListener('focus', battre)
      window.addEventListener('pageshow', battre)
      return () => {
        window.clearInterval(id)
        document.removeEventListener('visibilitychange', battre)
        window.removeEventListener('focus', battre)
        window.removeEventListener('pageshow', battre)
      }
    },
    [actif, intervalMs]
  )

  return useSyncExternalStore(
    abonner,
    () => instant,
    () => instant
  )
}

/** Horloge basse frequence : chronos "temps ecoule" hors timer de round. */
export function useHorloge(intervalMs = 1000): number {
  return useTicker(true, intervalMs)
}

/**
 * Declencheur de signaux : joue un evenement une seule fois, quand son
 * instant est depasse. Un evenement rate de plus de `toleranceMs` (app en
 * arriere-plan, ecran verrouille) est marque comme consomme mais pas joue :
 * mieux vaut aucun bip qu'une rafale de bips perimes au deverrouillage.
 */
export function useSignaux(toleranceMs = 3000) {
  const joues = useRef(new Set<string>())

  const declencher = useCallback(
    (cle: string, instantMs: number, now: number, action: () => void) => {
      if (joues.current.has(cle)) return
      if (now < instantMs) return
      joues.current.add(cle)
      if (now - instantMs <= toleranceMs) action()
    },
    [toleranceMs]
  )

  const reinit = useCallback(() => joues.current.clear(), [])
  const oublier = useCallback((cle: string) => joues.current.delete(cle), [])

  return { declencher, reinit, oublier }
}
