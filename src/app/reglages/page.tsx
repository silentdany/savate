'use client'

import { useRef, useState } from 'react'
import { Bascule } from '@/components/ui/Bascule'
import { Bouton } from '@/components/ui/Bouton'
import { Feuille } from '@/components/ui/Feuille'
import { Stepper } from '@/components/ui/Stepper'
import { Carte, Entete, Squelette } from '@/components/ui/divers'
import { MOTIF_FIN, amorcerAudio, bipFin, vibrer } from '@/lib/audio'
import { exporterJson, importerJson } from '@/lib/backup'
import { basculerAllegee, changerSemaine, majReglages, remiseAZero } from '@/lib/db'
import { useEtat, useLogs, useMonte, usePlan, useReglages } from '@/lib/hooks'
import { formatDuree, parametresSemaine } from '@/lib/progression'

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="px-5">
      <h2 className="mb-2 px-1 text-[16px] font-bold uppercase tracking-[0.12em] text-ink-3">
        {titre}
      </h2>
      <Carte className="p-2">{children}</Carte>
    </section>
  )
}

export default function PageReglages() {
  const monte = useMonte()
  const plan = usePlan()
  const etat = useEtat()
  const logs = useLogs()
  const reglages = useReglages()
  const fichierRef = useRef<HTMLInputElement>(null)

  const [message, setMessage] = useState<{ ton: 'ok' | 'erreur'; texte: string } | null>(null)
  const [confirmation, setConfirmation] = useState(false)
  const [etapeRaz, setEtapeRaz] = useState<1 | 2>(1)

  if (!monte || !plan || !etat || !logs) {
    return (
      <main className="px-5 pt-safe">
        <div className="h-16" />
        <Squelette lignes={4} />
      </main>
    )
  }

  const p = parametresSemaine(plan, etat.semaineCourante, etat.semainesAllegees)

  const surExport = async () => {
    try {
      await exporterJson()
      setMessage({ ton: 'ok', texte: `Export généré (${logs.length} séance(s)).` })
    } catch (e) {
      setMessage({ ton: 'erreur', texte: e instanceof Error ? e.message : 'Export impossible.' })
    }
  }

  const surImport = async (fichier: File) => {
    try {
      const resultat = await importerJson(await fichier.text())
      setMessage({
        ton: 'ok',
        texte: `${resultat.logs} séance(s) importée(s), semaine ${resultat.semaineCourante}.`,
      })
    } catch (e) {
      setMessage({ ton: 'erreur', texte: e instanceof Error ? e.message : 'Import impossible.' })
    }
  }

  return (
    <main className="space-y-6 pb-10">
      <Entete titre="Réglages" />

      <Section titre="Semaine courante">
        <div className="px-2 pb-2">
          <div className="flex items-center gap-4 py-3">
            <button
              type="button"
              aria-label="Semaine précédente"
              disabled={etat.semaineCourante <= 1}
              onClick={() => changerSemaine(-1, plan.nbSemaines)}
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface-3 active:bg-accent active:text-on-accent disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <output className="flex-1 text-center">
              <span className="block text-5xl font-extrabold tracking-tight">
                {etat.semaineCourante}
              </span>
              <span className="mt-1 block text-[16px] text-ink-3">sur {plan.nbSemaines}</span>
            </output>
            <button
              type="button"
              aria-label="Semaine suivante"
              disabled={etat.semaineCourante >= plan.nbSemaines}
              onClick={() => changerSemaine(1, plan.nbSemaines)}
              className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface-3 active:bg-accent active:text-on-accent disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <p className="px-1 pb-2 text-[16px] leading-relaxed text-ink-3">
            La semaine ne se recalcule jamais toute seule à partir de la date de début du plan :
            sauter une semaine ne décale donc rien.
          </p>
        </div>
        <Bascule
          actif={p.allegee}
          onChange={() => basculerAllegee(etat.semaineCourante)}
          titre={`Semaine ${etat.semaineCourante} allégée`}
          description={
            p.allegee
              ? `${p.bfRounds} rounds et ${p.renfoTours} tours au lieu de ${p.brut.bfRounds} et ${p.brut.renfoTours}`
              : 'Un cran de moins sur les rounds et les tours de renfo'
          }
        />
        <Bascule
          actif={reglages.avanceSemaineAuto}
          onChange={(v) => majReglages({ avanceSemaineAuto: v })}
          titre="Avancer la semaine automatiquement"
          description="Passe à la semaine suivante 7 jours après le dernier changement"
        />
      </Section>

      <Section titre="Timer par défaut">
        <div className="space-y-3 p-2">
          <Stepper
            label="Durée d’un round"
            valeur={reglages.roundSecDefaut}
            onChange={(v) => majReglages({ roundSecDefaut: v })}
            pas={15}
            min={30}
            max={600}
            formatValeur={formatDuree}
          />
          <Stepper
            label="Durée du repos"
            valeur={reglages.reposSecDefaut}
            onChange={(v) => majReglages({ reposSecDefaut: v })}
            pas={15}
            min={15}
            max={300}
            formatValeur={formatDuree}
          />
        </div>
      </Section>

      <Section titre="Signaux">
        <Bascule
          actif={reglages.son}
          onChange={(v) => majReglages({ son: v })}
          titre="Son"
          description="Bip à 10 s de la fin, double bip à la fin du round"
        />
        <Bascule
          actif={reglages.vibration}
          onChange={(v) => majReglages({ vibration: v })}
          titre="Vibration"
          description="Toujours en plus du son, jamais à la place"
        />
        <div className="p-2">
          <Bouton
            variante="secondaire"
            taille="md"
            pleineLargeur
            onClick={() => {
              amorcerAudio()
              if (reglages.son) bipFin()
              if (reglages.vibration) vibrer(MOTIF_FIN)
            }}
          >
            Tester le signal
          </Bouton>
        </div>
      </Section>

      <Section titre="Données">
        <div className="space-y-3 p-2">
          <Bouton variante="secondaire" pleineLargeur onClick={surExport}>
            Exporter en JSON
          </Bouton>
          <Bouton variante="secondaire" pleineLargeur onClick={() => fichierRef.current?.click()}>
            Importer un JSON
          </Bouton>
          <input
            ref={fichierRef}
            type="file"
            accept="application/json,.json"
            aria-label="Fichier de sauvegarde JSON à importer"
            tabIndex={-1}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) void surImport(f)
            }}
          />
          <Bouton
            variante="danger"
            pleineLargeur
            onClick={() => {
              setEtapeRaz(1)
              setConfirmation(true)
            }}
          >
            Tout remettre à zéro
          </Bouton>
          <p className="px-2 pb-1 text-[16px] leading-relaxed text-ink-3">
            {logs.length} séance(s) enregistrée(s). L’import remplace intégralement les données
            existantes. Le contenu du plan, lui, vient toujours du fichier de seed.
          </p>
        </div>
      </Section>

      {message && (
        <div className="px-5">
          <p
            className={`rounded-2xl border px-4 py-3 text-[17px] ${
              message.ton === 'ok'
                ? 'border-ok/40 bg-ok/10 text-ok'
                : 'border-danger/40 bg-danger-soft text-danger'
            }`}
            role="status"
          >
            {message.texte}
          </p>
        </div>
      )}

      {plan.avertissement && (
        <p className="px-6 pb-6 text-[16px] leading-relaxed text-ink-3">{plan.avertissement}</p>
      )}

      <Feuille
        ouverte={confirmation}
        onOpenChange={(v) => {
          setConfirmation(v)
          if (!v) setEtapeRaz(1)
        }}
        titre={etapeRaz === 1 ? 'Tout remettre à zéro ?' : 'Dernière confirmation'}
        description={
          etapeRaz === 1
            ? `${logs.length} séance(s), la semaine courante et les réglages seront effacés. Le plan est conservé.`
            : 'Cette action est définitive et rien n’est synchronisé ailleurs. Exporte d’abord si tu hésites.'
        }
      >
        <div className="space-y-3 pb-4">
          {etapeRaz === 1 ? (
            <>
              <Bouton variante="danger" pleineLargeur onClick={() => setEtapeRaz(2)}>
                Continuer
              </Bouton>
              <Bouton variante="fantome" pleineLargeur onClick={() => setConfirmation(false)}>
                Annuler
              </Bouton>
            </>
          ) : (
            <>
              <Bouton
                variante="danger"
                pleineLargeur
                onClick={async () => {
                  await remiseAZero()
                  setConfirmation(false)
                  setEtapeRaz(1)
                  setMessage({ ton: 'ok', texte: 'Données effacées.' })
                }}
              >
                Oui, tout effacer
              </Bouton>
              <Bouton variante="secondaire" pleineLargeur onClick={() => setEtapeRaz(1)}>
                Revenir en arrière
              </Bouton>
            </>
          )}
        </div>
      </Feuille>
    </main>
  )
}
