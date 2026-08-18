'use client'

/**
 * Bips du timer.
 *
 * Les navigateurs mobiles refusent de jouer un son qui ne descend pas d'un
 * geste utilisateur. On amorce donc l'AudioContext au tap sur « Démarrer »
 * (voir 5.3 du cahier des charges) : sans cette amorce, les bips de fin de
 * round resteraient muets une fois la seance lancee.
 *
 * Aucun fichier audio : tout est synthetise, donc rien a telecharger et rien a
 * mettre en cache pour le mode hors ligne.
 */

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null

function contexte(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const C: Ctor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
  if (!C) return null
  try {
    ctx = new C()
  } catch {
    return null
  }
  return ctx
}

/** A appeler dans le handler d'un vrai tap, jamais dans un effet. */
export function amorcerAudio(): void {
  const c = contexte()
  if (!c) return
  void c.resume().catch(() => {})
  // Amorce silencieuse : un buffer d'un echantillon suffit a debloquer iOS.
  try {
    const buffer = c.createBuffer(1, 1, c.sampleRate)
    const source = c.createBufferSource()
    source.buffer = buffer
    source.connect(c.destination)
    source.start(0)
  } catch {
    /* sans importance : le resume() suffit sur la plupart des moteurs */
  }
}

export function audioPret(): boolean {
  return ctx !== null && ctx.state === 'running'
}

function ton(freqHz: number, dureeMs: number, debutOffsetMs = 0, volume = 0.35) {
  const c = contexte()
  if (!c) return
  if (c.state === 'suspended') void c.resume().catch(() => {})
  const t0 = c.currentTime + debutOffsetMs / 1000
  const t1 = t0 + dureeMs / 1000

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(freqHz, t0)
  // Enveloppe courte : un creneau brut claque et sature les petits haut-parleurs.
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t1)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t1 + 0.02)
}

/** Bip d'avertissement, 10 s avant la fin d'un round. */
export function bipAvertissement() {
  ton(880, 140)
}

/** Double bip de fin de round ou de repos. */
export function bipFin() {
  ton(1320, 170, 0)
  ton(1320, 220, 230)
}

/** Trois tons descendants : la seance de rounds est finie. */
export function bipFinSeance() {
  ton(1046, 180, 0)
  ton(880, 180, 200)
  ton(660, 380, 400)
}

export function vibrer(motif: number | number[]) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(motif)
  } catch {
    /* certains navigateurs exposent l'API sans la supporter */
  }
}

export const MOTIF_AVERTISSEMENT = 120
export const MOTIF_FIN = [180, 90, 180]
export const MOTIF_FIN_SEANCE = [200, 100, 200, 100, 400]
