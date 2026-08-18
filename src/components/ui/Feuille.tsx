'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'

type Props = {
  ouverte: boolean
  onOpenChange: (v: boolean) => void
  titre: string
  description?: string
  children: React.ReactNode
  className?: string
}

/** Panneau qui monte du bas : le contenu reste sous le pouce. */
export function Feuille({ ouverte, onOpenChange, titre, description, children, className }: Props) {
  return (
    <Dialog.Root open={ouverte} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[88dvh] w-full max-w-md overflow-y-auto',
            'rounded-t-3xl border-t border-line bg-surface px-5 pt-3 pb-safe',
            className
          )}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-surface-3" aria-hidden />
          <Dialog.Title className="text-2xl font-bold tracking-tight">{titre}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-[17px] text-ink-2">{description}</Dialog.Description>
          ) : (
            <Dialog.Description className="sr-only">{titre}</Dialog.Description>
          )}
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
