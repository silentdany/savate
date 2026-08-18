'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Variante = 'primaire' | 'secondaire' | 'fantome' | 'danger' | 'repos'
type Taille = 'md' | 'lg' | 'xl'

const VARIANTES: Record<Variante, string> = {
  primaire: 'bg-accent text-on-accent active:bg-accent/85',
  secondaire: 'bg-surface-2 text-ink border border-line active:bg-surface-3',
  fantome: 'bg-transparent text-ink-2 active:bg-surface-2',
  danger: 'bg-danger-soft text-danger border border-danger/40 active:bg-danger/25',
  repos: 'bg-repos text-on-accent active:bg-repos/85',
}

const TAILLES: Record<Taille, string> = {
  // 56px est le plancher absolu du cahier des charges.
  md: 'min-h-14 px-5 text-[17px]',
  lg: 'min-h-16 px-6 text-[19px]',
  xl: 'min-h-[4.5rem] px-6 text-[21px]',
}

export type BoutonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  taille?: Taille
  pleineLargeur?: boolean
}

export const Bouton = forwardRef<HTMLButtonElement, BoutonProps>(function Bouton(
  { variante = 'secondaire', taille = 'lg', pleineLargeur, className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold',
        'transition-[background-color,transform] duration-100 active:scale-[0.985]',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTES[variante],
        TAILLES[taille],
        pleineLargeur && 'w-full',
        className
      )}
      {...props}
    />
  )
})
