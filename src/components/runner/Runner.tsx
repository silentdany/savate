'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ClotureSeance, type ResultatCloture } from '@/components/runner/ClotureSeance'
import { TimerDuree } from '@/components/runner/TimerDuree'
import { TimerRounds } from '@/components/timer/TimerRounds'
import { Bouton } from '@/components/ui/Bouton'
import { Feuille } from '@/components/ui/Feuille'
import { Stepper } from '@/components/ui/Stepper'
import { Squelette } from '@/components/ui/divers'
import { cn } from '@/lib/cn'
import { CHRONO_INITIAL, type EtatChrono } from '@/lib/chrono'
import { cloturerSeance, demarrerSeance, enregistrerEntree } from '@/lib/db'
import {
  useDernieresSaisies,
  useEtat,
  useHorloge,
  useLog,
  useMonte,
  usePlan,
  useReglages,
} from '@/lib/hooks'
import {
  type Etape,
  construireEtapes,
  formatDuree,
  libelleCible,
  parametresSemaine,
  templateParId,
} from '@/lib/progression'
import type { ConfigRounds } from '@/lib/rounds'
import type { EntreeExercice } from '@/lib/types'
import { SENTINELLE_SEANCE } from '@/lib/routes'
import { useWakeLock } from '@/lib/wakelock'

type Valeurs = { reps?: number; chargeKg?: number; dureeSec?: number; roundsFaits?: number }

const formatCharge = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

/**
 * Le composant est monte par une page SERVEUR qui n'a besoin d'aucun `params` :
 * le HTML de la route est donc identique pour tous les logId, prerendu au build
 * et servi depuis le cache du service worker meme hors ligne (cf. public/sw.js).
 * L'identifiant est lu dans l'URL reelle, jamais dans le payload RSC.
 */
const TITRE = 'Séance — BF Dojo'

export function Runner() {
  const monte = useMonte()
  const chemin = usePathname()

  // Next perd le <title> quand on entre dans cette route dynamique par une
  // navigation client (il n'est correct que sur un chargement direct). On le
  // repose donc ici : sans ca, l'onglet et la liste des applis restent vides.
  useEffect(() => {
    document.title = TITRE
  }, [])

  // Hors ligne, le service worker sert le shell prerendu sous l'id sentinelle :
  // le routeur se croit alors sur /seance/_ alors que l'URL porte le vrai id.
  // Dans ce seul cas on relit window.location, qui, lui, ne ment jamais.
  const source =
    monte && chemin === `/seance/${SENTINELLE_SEANCE}` ? window.location.pathname : chemin
  const brut = monte ? (source.match(/^\/seance\/([^/?#]+)/)?.[1] ?? null) : null
  const logId = brut ? decodeURIComponent(brut) : null

  if (!logId || logId === SENTINELLE_SEANCE) return <ChargementSeance />
  return <RunnerSeance key={logId} logId={logId} />
}

function ChargementSeance() {
  return (
    <main className="px-5 pt-safe">
      <div className="h-16" />
      <Squelette lignes={3} />
    </main>
  )
}

function RunnerSeance({ logId }: { logId: string }) {
  const router = useRouter()
  const monte = useMonte()

  const log = useLog(logId)
  const plan = usePlan()
  const etat = useEtat()
  const reglages = useReglages()
  const dernieres = useDernieresSaisies(log?.seanceTemplateId)
  const maintenant = useHorloge(1000)

  // `null` tant que l'utilisateur n'a pas bouge le curseur : on suit alors la
  // position de reprise, recalculee depuis les entrees deja enregistrees.
  const [indexChoisi, setIndexChoisi] = useState<number | null>(null)
  const [valeurs, setValeurs] = useState<Record<string, Valeurs>>({})
  const [chronos, setChronos] = useState<Record<string, EtatChrono>>({})
  const [configs, setConfigs] = useState<Record<string, ConfigRounds>>({})
  const [phase, setPhase] = useState<'exercices' | 'cloture'>('exercices')
  const [feuilleQuitter, setFeuilleQuitter] = useState(false)
  const [feuilleMobilite, setFeuilleMobilite] = useState(false)
  const swipe = useRef<{ x: number; y: number } | null>(null)

  // L'ecran ne doit jamais s'eteindre pendant une seance active.
  useWakeLock(monte && !!log && log.statut === 'en_cours')

  const template = plan && log ? templateParId(plan, log.seanceTemplateId) : undefined
  const parametres =
    plan && log && etat ? parametresSemaine(plan, log.semaine, etat.semainesAllegees) : undefined
  const etapes = useMemo(
    () => (template && parametres ? construireEtapes(template, parametres) : []),
    [template, parametres]
  )

  const entreeDe = useCallback(
    (e: Etape): EntreeExercice | undefined =>
      log?.entrees.find(
        (x) => x.exerciceId === e.exercice.id && (x.tour ?? null) === (e.tour ?? null)
      ),
    [log]
  )

  // Reprise : premier exercice non encore traite.
  const indexReprise = useMemo(() => {
    if (!log || etapes.length === 0) return 0
    const i = etapes.findIndex(
      (e) =>
        !log.entrees.some(
          (x) => x.exerciceId === e.exercice.id && (x.tour ?? null) === (e.tour ?? null)
        )
    )
    return i === -1 ? etapes.length - 1 : i
  }, [log, etapes])

  const index = indexChoisi ?? indexReprise
  const etape = etapes[index]

  const valeursCourantes: Valeurs = useMemo(() => {
    if (!etape) return {}
    const dejaSaisi = valeurs[etape.cle]
    if (dejaSaisi) return dejaSaisi
    const existante = entreeDe(etape)
    const derniere = dernieres?.[etape.exercice.id]
    const cible = etape.exercice.cible
    return {
      reps: existante?.reps ?? derniere?.reps ?? cible?.reps ?? 10,
      chargeKg: existante?.chargeKg ?? derniere?.chargeKg ?? 0,
      dureeSec: existante?.dureeSec ?? 0,
      roundsFaits: existante?.roundsFaits ?? 0,
    }
  }, [etape, valeurs, entreeDe, dernieres])

  const majValeurs = useCallback(
    (cle: string, patch: Valeurs) => {
      setValeurs((v) => ({ ...v, [cle]: { ...(v[cle] ?? valeursCourantes), ...patch } }))
    },
    [valeursCourantes]
  )

  const chronoDe = (cle: string) => chronos[cle] ?? CHRONO_INITIAL
  const setChronoDe = useCallback(
    (cle: string) => (maj: (c: EtatChrono) => EtatChrono) =>
      setChronos((m) => ({ ...m, [cle]: maj(m[cle] ?? CHRONO_INITIAL) })),
    []
  )

  const configDe = useCallback(
    (e: Etape): ConfigRounds =>
      configs[e.cle] ?? {
        roundSec: reglages.roundSecDefaut,
        reposSec: reglages.reposSecDefaut,
        nbRounds: e.roundsCible ?? 3,
      },
    [configs, reglages.roundSecDefaut, reglages.reposSecDefaut]
  )

  const aller = useCallback(
    (delta: number) => {
      setIndexChoisi(Math.min(etapes.length - 1, Math.max(0, index + delta)))
    },
    [etapes.length, index]
  )

  const avancer = useCallback(() => {
    if (index >= etapes.length - 1) setPhase('cloture')
    else setIndexChoisi(index + 1)
  }, [index, etapes.length])

  const enregistrer = useCallback(
    async (fait: boolean) => {
      if (!etape) return
      const v = valeursCourantes
      const entree: EntreeExercice = { exerciceId: etape.exercice.id, fait }
      if (etape.tour !== undefined) entree.tour = etape.tour
      if (fait) {
        const m = etape.exercice.mesure
        if (m === 'reps' || m === 'reps_charge') entree.reps = v.reps ?? 0
        if (m === 'reps_charge') entree.chargeKg = v.chargeKg ?? 0
        if (m === 'duree') entree.dureeSec = v.dureeSec || etape.exercice.cible?.dureeSec || 0
        if (m === 'rounds') entree.roundsFaits = v.roundsFaits ?? 0
      }
      await enregistrerEntree(logId, entree)
      avancer()
    },
    [etape, valeursCourantes, logId, avancer]
  )

  const terminer = useCallback(
    async (r: ResultatCloture) => {
      const traitees = etapes.filter((e) => entreeDe(e)?.fait).length
      await cloturerSeance(logId, {
        statut: traitees === etapes.length ? 'terminee' : 'partielle',
        ...r,
      })
      router.replace('/')
    },
    [etapes, entreeDe, logId, router]
  )

  const convertirEnMobilite = useCallback(async () => {
    if (!plan || !log) return
    await cloturerSeance(logId, { statut: 'convertie_mobilite' })
    const nouveau = await demarrerSeance(plan.seanceMobiliteId, log.semaine)
    setFeuilleMobilite(false)
    router.replace(`/seance/${nouveau}`)
  }, [plan, log, logId, router])

  // ---- Etats de chargement / erreur -------------------------------------
  if (!monte || log === undefined || !plan || !etat) {
    return (
      <main className="px-5 pt-safe">
        <div className="h-16" />
        <Squelette lignes={3} />
      </main>
    )
  }

  if (log === null || !template || !parametres || etapes.length === 0) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-xl font-bold">Séance introuvable</p>
        <p className="text-[17px] text-ink-2">
          Ce log n’existe plus, ou le plan a changé et cette séance n’en fait plus partie.
        </p>
        <Bouton variante="primaire" onClick={() => router.replace('/')}>
          Retour à l’accueil
        </Bouton>
      </main>
    )
  }

  const ecouleSeanceSec = Math.max(0, (maintenant - new Date(log.dateDebut).getTime()) / 1000)
  const traitees = etapes.filter((e) => entreeDe(e) !== undefined).length
  const faites = etapes.filter((e) => entreeDe(e)?.fait).length

  if (phase === 'cloture') {
    return (
      <ClotureSeance
        plan={plan}
        nomSeance={template.nom}
        exercicesFaits={faites}
        exercicesTotal={etapes.length}
        dureeMin={Math.round(ecouleSeanceSec / 60)}
        onTerminer={terminer}
        onRetour={() => setPhase('exercices')}
      />
    )
  }

  if (!etape) return null

  const entreeCourante = entreeDe(etape)
  const derniere = dernieres?.[etape.exercice.id]
  const cible = libelleCible(etape.exercice, etape.roundsCible)
  const estCheck = etape.exercice.mesure === 'check'

  const surPointerDown = (e: React.PointerEvent) => {
    const cible = e.target as HTMLElement
    if (cible.closest('button, input, textarea, [role="slider"]')) return
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const surPointerUp = (e: React.PointerEvent) => {
    const depart = swipe.current
    swipe.current = null
    if (!depart) return
    const dx = e.clientX - depart.x
    const dy = e.clientY - depart.y
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return
    aller(dx < 0 ? 1 : -1)
  }

  return (
    <main
      className="flex min-h-dvh flex-col"
      onPointerDown={surPointerDown}
      onPointerUp={surPointerUp}
      onPointerCancel={() => (swipe.current = null)}
    >
      {/* ---- En-tete compact ---- */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 px-4 pt-safe backdrop-blur">
        <div className="flex items-center justify-between gap-2 pb-2">
          <button
            type="button"
            onClick={() => setFeuilleQuitter(true)}
            aria-label="Quitter la séance"
            className="flex size-14 items-center justify-center rounded-2xl text-ink-2 active:bg-surface-2"
          >
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
              <path
                d="m6 6 12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <p className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold text-ink-2">
            {etape.blocTitre}
            <span className="text-ink-3">
              {' '}
              · bloc {etape.blocRang}/{etape.blocsTotal}
            </span>
          </p>

          {/* Soupape du plan : accessible en un tap, jamais dans un menu. */}
          <button
            type="button"
            onClick={() => setFeuilleMobilite(true)}
            className="flex h-14 shrink-0 items-center gap-1.5 rounded-2xl border border-mobilite/40 bg-mobilite/10 px-3 text-[16px] font-bold text-mobilite active:bg-mobilite/20"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                d="M4 8h13l-3-3M20 16H7l3 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Mobilité
          </button>
        </div>

        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${(traitees / etapes.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between py-2 text-[16px] text-ink-3">
          <span>
            Exercice {index + 1} / {etapes.length}
            {etape.tour && (
              <span className="ml-2 font-bold text-accent">
                tour {etape.tour}/{etape.toursTotal}
              </span>
            )}
          </span>
          <time className="font-semibold text-ink-2">{formatDuree(ecouleSeanceSec)}</time>
        </div>
      </header>

      {/* ---- Corps ---- */}
      <div className="flex-1 px-5 pt-6">
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-tight">
          {etape.exercice.nom}
        </h1>
        {etape.consigne && (
          <p className="mt-2 text-[18px] leading-snug text-ink-2">{etape.consigne}</p>
        )}
        <p className="mt-3 inline-flex items-center rounded-full border border-line bg-surface px-3.5 py-1.5 text-[16px] font-bold text-ink-2">
          {cible}
        </p>
        {entreeCourante && (
          <p
            className={cn(
              'mt-3 text-[16px] font-semibold',
              entreeCourante.fait ? 'text-ok' : 'text-ink-3'
            )}
          >
            {entreeCourante.fait ? '✓ Déjà validé — valider à nouveau écrase' : 'Marqué comme passé'}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {etape.exercice.mesure === 'reps' && (
            <Stepper
              label="Répétitions"
              valeur={valeursCourantes.reps ?? 0}
              onChange={(v) => majValeurs(etape.cle, { reps: v })}
              min={0}
              max={500}
              {...(derniere?.reps !== undefined
                ? { rappel: `dernière fois : ${derniere.reps}` }
                : {})}
            />
          )}

          {etape.exercice.mesure === 'reps_charge' && (
            <>
              <Stepper
                label="Répétitions"
                valeur={valeursCourantes.reps ?? 0}
                onChange={(v) => majValeurs(etape.cle, { reps: v })}
                min={0}
                max={500}
                {...(derniere?.reps !== undefined
                  ? { rappel: `dernière fois : ${derniere.reps}` }
                  : {})}
              />
              <Stepper
                label="Charge"
                valeur={valeursCourantes.chargeKg ?? 0}
                onChange={(v) => majValeurs(etape.cle, { chargeKg: v })}
                pas={2.5}
                min={0}
                max={300}
                suffixe="kg"
                formatValeur={formatCharge}
                {...(derniere?.chargeKg !== undefined
                  ? { rappel: `dernière fois : ${formatCharge(derniere.chargeKg)} kg` }
                  : {})}
              />
            </>
          )}

          {etape.exercice.mesure === 'duree' && (
            <TimerDuree
              key={etape.cle}
              dureeSec={etape.exercice.cible?.dureeSec ?? 60}
              chrono={chronoDe(etape.cle)}
              setChrono={setChronoDe(etape.cle)}
              son={reglages.son}
              vibration={reglages.vibration}
              onFini={() => {}}
              onEcouleChange={(sec) => majValeurs(etape.cle, { dureeSec: sec })}
            />
          )}

          {etape.exercice.mesure === 'rounds' && (
            <TimerRounds
              key={etape.cle}
              config={configDe(etape)}
              setConfig={(maj) =>
                setConfigs((c) => ({ ...c, [etape.cle]: maj(configDe(etape)) }))
              }
              chrono={chronoDe(etape.cle)}
              setChrono={setChronoDe(etape.cle)}
              son={reglages.son}
              vibration={reglages.vibration}
              onRoundsFaitsChange={(n) => majValeurs(etape.cle, { roundsFaits: n })}
            />
          )}
        </div>
      </div>

      {/* ---- Barre d'action ---- */}
      <div className="sticky bottom-0 z-20 mt-6 bg-bg px-5 pt-2">
        <div className="pointer-events-none -mt-8 h-8 bg-gradient-to-t from-bg to-transparent" />
        <Bouton
          variante="primaire"
          taille="xl"
          pleineLargeur
          onClick={() => void enregistrer(true)}
        >
          {estCheck ? 'Fait' : 'Valider'}
        </Bouton>
        <div
          className="mt-2 flex gap-2"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <Bouton
            variante="fantome"
            taille="md"
            pleineLargeur
            disabled={index === 0}
            onClick={() => aller(-1)}
          >
            ← Précédent
          </Bouton>
          <Bouton variante="fantome" taille="md" pleineLargeur onClick={() => void enregistrer(false)}>
            Passer →
          </Bouton>
        </div>
      </div>

      {/* ---- Feuilles ---- */}
      <Feuille
        ouverte={feuilleQuitter}
        onOpenChange={setFeuilleQuitter}
        titre="Quitter la séance ?"
        description={`${faites} exercice(s) validé(s) sur ${etapes.length}. Tout est déjà enregistré.`}
      >
        <div className="space-y-3 pb-4">
          <Bouton variante="primaire" pleineLargeur onClick={() => setFeuilleQuitter(false)}>
            Continuer la séance
          </Bouton>
          <Bouton
            variante="secondaire"
            pleineLargeur
            onClick={() => {
              setFeuilleQuitter(false)
              setPhase('cloture')
            }}
          >
            Terminer maintenant
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={() => router.push('/')}>
            Mettre en pause et sortir
          </Bouton>
          <Bouton
            variante="danger"
            pleineLargeur
            onClick={async () => {
              await cloturerSeance(logId, { statut: 'sautee' })
              router.replace('/')
            }}
          >
            Abandonner la séance
          </Bouton>
        </div>
      </Feuille>

      <Feuille
        ouverte={feuilleMobilite}
        onOpenChange={setFeuilleMobilite}
        titre="Passer en mobilité ?"
        description="La séance en cours est close en « convertie en mobilité », et une séance de 15 min de mobilité démarre à la place. C’est la soupape prévue par le plan."
      >
        <div className="space-y-3 pb-4">
          <Bouton variante="primaire" taille="xl" pleineLargeur onClick={() => void convertirEnMobilite()}>
            Oui, mobilité 15 min
          </Bouton>
          <Bouton variante="fantome" pleineLargeur onClick={() => setFeuilleMobilite(false)}>
            Non, je continue
          </Bouton>
        </div>
      </Feuille>
    </main>
  )
}
