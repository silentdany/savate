'use client'

import { cn } from '@/lib/cn'

type Props = {
  actif: boolean
  onChange: (v: boolean) => void
  titre: string
  description?: string
  disabled?: boolean
}

/** Interrupteur pleine ligne : toute la rangee est la zone de tap. */
export function Bascule({ actif, onChange, titre, description, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={cn(
        'flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left',
        'active:bg-surface-2 disabled:opacity-40'
      )}
    >
      <span className="min-w-0">
        <span className="block text-[18px] font-semibold">{titre}</span>
        {description && <span className="mt-0.5 block text-[16px] text-ink-2">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-9 w-16 shrink-0 rounded-full transition-colors',
          actif ? 'bg-accent' : 'bg-surface-3'
        )}
      >
        <span
          className={cn(
            'absolute top-1 size-7 rounded-full bg-white transition-[left] duration-150',
            actif ? 'left-8' : 'left-1'
          )}
        />
      </span>
    </button>
  )
}
