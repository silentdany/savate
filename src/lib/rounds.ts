/**
 * Sequence d'un enchainement de rounds, decrite comme une fonction pure du
 * temps ecoule. Aucun etat intermediaire n'est memorise : au retour d'un
 * verrouillage d'ecran, il suffit de rappeler `phaseA()` avec le temps ecoule
 * recalcule depuis les timestamps pour retomber sur la bonne phase.
 *
 * Enchainement : travail 1, repos 1, travail 2, ... travail N. Pas de repos
 * apres le dernier round.
 */
export type ConfigRounds = {
  roundSec: number
  reposSec: number
  nbRounds: number
}

export type TypePhase = 'travail' | 'repos' | 'fini'

export type Phase = {
  type: TypePhase
  /** Numero du round en cours (1-based). Pour un repos : le round qui vient de finir. */
  round: number
  /** Temps restant dans la phase, en ms. */
  restantMs: number
  /** Duree totale de la phase, en ms. */
  dureeMs: number
  /** Rounds de travail integralement termines. */
  roundsFaits: number
}

export function dureeTotaleMs(c: ConfigRounds): number {
  const n = Math.max(1, c.nbRounds)
  return n * c.roundSec * 1000 + (n - 1) * c.reposSec * 1000
}

export function phaseA(ecouleMs: number, c: ConfigRounds): Phase {
  const n = Math.max(1, c.nbRounds)
  const travailMs = c.roundSec * 1000
  const reposMs = c.reposSec * 1000
  const cycleMs = travailMs + reposMs
  const total = dureeTotaleMs(c)

  if (ecouleMs >= total) {
    return { type: 'fini', round: n, restantMs: 0, dureeMs: 0, roundsFaits: n }
  }

  const index = cycleMs > 0 ? Math.floor(ecouleMs / cycleMs) : 0
  const dansCycle = cycleMs > 0 ? ecouleMs - index * cycleMs : ecouleMs

  if (dansCycle < travailMs) {
    return {
      type: 'travail',
      round: index + 1,
      restantMs: travailMs - dansCycle,
      dureeMs: travailMs,
      roundsFaits: index,
    }
  }
  return {
    type: 'repos',
    round: index + 1,
    restantMs: cycleMs - dansCycle,
    dureeMs: reposMs,
    roundsFaits: index + 1,
  }
}

export type Signal = { cle: string; instantMs: number; genre: 'avertissement' | 'fin' | 'fin_seance' }

/** Instants (en temps ecoule) de tous les bips de la sequence. */
export function signauxDe(c: ConfigRounds, avertissementSec = 10): Signal[] {
  const n = Math.max(1, c.nbRounds)
  const travailMs = c.roundSec * 1000
  const reposMs = c.reposSec * 1000
  const cycleMs = travailMs + reposMs
  const signaux: Signal[] = []

  for (let i = 0; i < n; i++) {
    const debutTravail = i * cycleMs
    const finTravail = debutTravail + travailMs
    if (c.roundSec > avertissementSec + 5) {
      signaux.push({
        cle: `avert-travail-${i + 1}`,
        instantMs: finTravail - avertissementSec * 1000,
        genre: 'avertissement',
      })
    }
    if (i === n - 1) {
      signaux.push({ cle: 'fin-seance', instantMs: finTravail, genre: 'fin_seance' })
    } else {
      signaux.push({ cle: `fin-travail-${i + 1}`, instantMs: finTravail, genre: 'fin' })
      const finRepos = finTravail + reposMs
      if (c.reposSec > avertissementSec + 5) {
        signaux.push({
          cle: `avert-repos-${i + 1}`,
          instantMs: finRepos - avertissementSec * 1000,
          genre: 'avertissement',
        })
      }
      signaux.push({ cle: `fin-repos-${i + 1}`, instantMs: finRepos, genre: 'fin' })
    }
  }
  return signaux
}
