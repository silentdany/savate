'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Trois lectures simples, une serie chacune : pas de legende (le titre nomme la
 * serie), etiquettes directes seulement sur le maximum, valeurs completes au
 * tap et en table repliable. Les couleurs viennent de la palette validee pour
 * fond sombre (contraste >= 3:1, separation CVD verifiee).
 */
export type Point = { semaine: number; valeur: number | null }

type BaseProps = {
  titre: string
  unite: string
  donnees: Point[]
  couleur: string
  semaineCourante: number
  format?: (v: number) => string
}

function Cadre({
  titre,
  unite,
  donnees,
  format,
  selection,
  children,
}: BaseProps & { selection: number | null; children: React.ReactNode }) {
  const [tableVisible, setTableVisible] = useState(false)
  const tableId = useId()
  const fmt = format ?? ((v: number) => String(Math.round(v)))
  const point = donnees.find((d) => d.semaine === selection)
  const renseignees = donnees.filter((d) => d.valeur !== null && d.valeur > 0)

  return (
    <figure className="rounded-card border border-line bg-surface p-4">
      <figcaption className="flex items-baseline justify-between gap-3">
        <h3 className="text-[18px] font-bold tracking-tight">{titre}</h3>
        <span className="shrink-0 text-[16px] text-ink-3">{unite}</span>
      </figcaption>

      <div className="mt-4">{children}</div>

      <p className="mt-3 min-h-6 text-[16px] text-ink-2" role="status">
        {point && point.valeur !== null ? (
          <>
            <span className="font-bold text-ink">Semaine {point.semaine}</span> —{' '}
            {fmt(point.valeur)} {unite}
          </>
        ) : renseignees.length === 0 ? (
          'Pas encore de données.'
        ) : (
          'Touche une barre pour voir la valeur.'
        )}
      </p>

      <button
        type="button"
        onClick={() => setTableVisible((v) => !v)}
        aria-expanded={tableVisible}
        aria-controls={tableId}
        className="mt-1 min-h-14 w-full text-left text-[16px] font-semibold text-ink-3 active:text-ink"
      >
        {tableVisible ? 'Masquer les chiffres' : 'Voir les chiffres'}
      </button>

      <div id={tableId} hidden={!tableVisible}>
        <table className="mt-2 w-full border-collapse text-left">
          <caption className="sr-only">
            {titre} ({unite}), semaine par semaine
          </caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-1 text-[16px] font-semibold text-ink-3">
                Semaine
              </th>
              <th scope="col" className="py-1 text-right text-[16px] font-semibold text-ink-3">
                {unite}
              </th>
            </tr>
          </thead>
          <tbody>
            {donnees.map((d) => (
              <tr key={d.semaine} className="border-b border-line/60">
                <th scope="row" className="py-1 text-[16px] font-normal text-ink-2">
                  {d.semaine}
                </th>
                <td className="py-1 text-right text-[16px] tabular-nums">
                  {d.valeur === null ? '—' : fmt(d.valeur)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

export function GraphiqueBarres(props: BaseProps) {
  const [selection, setSelection] = useState<number | null>(null)
  const { donnees, couleur, semaineCourante, format } = props
  const fmt = format ?? ((v: number) => String(Math.round(v)))
  const max = Math.max(1, ...donnees.map((d) => d.valeur ?? 0))
  // Les barres plafonnent à 88 % de la hauteur : les 12 % du haut sont la
  // réserve de l'étiquette du maximum, qui sinon chevaucherait le titre.
  const PLAFOND = 88
  const indexMax = donnees.findIndex((d) => (d.valeur ?? 0) === max && max > 0)

  return (
    <Cadre {...props} selection={selection}>
      <div className="flex h-40 items-end gap-1">
        {donnees.map((d, i) => {
          const v = d.valeur ?? 0
          const hauteur = max > 0 ? (v / max) * PLAFOND : 0
          const actif = selection === d.semaine
          // Etiquette directe uniquement sur le maximum : jamais un nombre sur
          // chaque barre, ca noie la lecture.
          const etiquette = i === indexMax && v > 0
          return (
            <button
              key={d.semaine}
              type="button"
              onClick={() => setSelection(actif ? null : d.semaine)}
              aria-label={`Semaine ${d.semaine} : ${v > 0 ? fmt(v) : 'aucune donnée'}`}
              data-marque-donnee
              className="relative flex h-full flex-1 cursor-pointer flex-col justify-end"
            >
              {etiquette && (
                // Positionnée en absolu : dans le flux, elle raccourcirait la
                // barre du maximum, qui paraîtrait alors plus basse que les autres.
                <span
                  className="absolute inset-x-0 text-center text-[16px] font-bold text-ink tabular-nums"
                  style={{ bottom: `calc(${Math.max(3, hauteur)}% + 4px)` }}
                >
                  {fmt(v)}
                </span>
              )}
              <span
                className={cn(
                  'block w-full rounded-t-[4px] transition-[height,opacity]',
                  v === 0 && 'bg-surface-3'
                )}
                style={{
                  height: v === 0 ? '3px' : `${Math.max(3, hauteur)}%`,
                  backgroundColor: v === 0 ? undefined : couleur,
                  opacity: selection === null || actif ? 1 : 0.45,
                }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-1 border-t border-line pt-1.5">
        {donnees.map((d) => (
          <span
            key={d.semaine}
            className={cn(
              'flex-1 text-center text-[16px] tabular-nums',
              d.semaine === semaineCourante ? 'font-bold text-ink' : 'text-ink-3'
            )}
          >
            {d.semaine}
          </span>
        ))}
      </div>
    </Cadre>
  )
}

export function GraphiqueLigne(props: BaseProps & { min: number; max: number }) {
  const [selection, setSelection] = useState<number | null>(null)
  const { donnees, couleur, semaineCourante, min, max, format } = props
  const fmt = format ?? ((v: number) => v.toFixed(1))

  const L = donnees.length
  const x = (i: number) => (L > 1 ? (i / (L - 1)) * 100 : 50)
  const y = (v: number) => 100 - ((v - min) / (max - min)) * 100

  // Segments continus : on ne relie jamais deux points par-dessus une semaine
  // sans donnee, ca inventerait une tendance.
  const segments: { i: number; v: number }[][] = []
  let courant: { i: number; v: number }[] = []
  donnees.forEach((d, i) => {
    if (d.valeur === null) {
      if (courant.length) segments.push(courant)
      courant = []
    } else courant.push({ i, v: d.valeur })
  })
  if (courant.length) segments.push(courant)

  return (
    <Cadre {...props} selection={selection}>
      <div className="relative h-40">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          role="presentation"
        >
          {[min, (min + max) / 2, max].map((v) => (
            <line
              key={v}
              x1="0"
              x2="100"
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {segments.map((seg, k) => (
            <polyline
              key={k}
              points={seg.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
              fill="none"
              stroke={couleur}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex">
          {donnees.map((d, i) => (
            <button
              key={d.semaine}
              type="button"
              onClick={() => setSelection(selection === d.semaine ? null : d.semaine)}
              aria-label={`Semaine ${d.semaine} : ${d.valeur === null ? 'aucune donnée' : fmt(d.valeur)}`}
              data-marque-donnee
              className="relative flex-1"
            >
              {d.valeur !== null && (
                <span
                  className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
                  style={{
                    left: `${x(i)}%`,
                    top: `${y(d.valeur)}%`,
                    backgroundColor: couleur,
                    // Anneau de la couleur du fond : separe le point de la ligne.
                    ['--tw-ring-color' as string]: 'var(--color-surface)',
                    transform:
                      selection === d.semaine
                        ? 'translate(-50%,-50%) scale(1.6)'
                        : 'translate(-50%,-50%)',
                  }}
                />
              )}
            </button>
          ))}
        </div>
        <span className="absolute -top-1 right-0 text-[16px] text-ink-3">{max}</span>
        <span className="absolute -bottom-1 right-0 text-[16px] text-ink-3">{min}</span>
      </div>
      <div className="mt-1.5 flex gap-1 border-t border-line pt-1.5">
        {donnees.map((d) => (
          <span
            key={d.semaine}
            className={cn(
              'flex-1 text-center text-[16px] tabular-nums',
              d.semaine === semaineCourante ? 'font-bold text-ink' : 'text-ink-3'
            )}
          >
            {d.semaine}
          </span>
        ))}
      </div>
    </Cadre>
  )
}
