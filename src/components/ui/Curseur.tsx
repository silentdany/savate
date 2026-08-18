'use client'

import * as Slider from '@radix-ui/react-slider'

type Props = {
  valeur: number
  onChange: (v: number) => void
  min: number
  max: number
  pas?: number
  label: string
}

/** Curseur a grosse poignee : reglable au pouce, gants compris. */
export function Curseur({ valeur, onChange, min, max, pas = 1, label }: Props) {
  return (
    <Slider.Root
      className="relative flex h-14 w-full touch-none select-none items-center"
      value={[valeur]}
      onValueChange={([v]) => v !== undefined && onChange(v)}
      min={min}
      max={max}
      step={pas}
    >
      <Slider.Track className="relative h-3 w-full grow rounded-full bg-surface-3">
        <Slider.Range className="absolute h-full rounded-full bg-accent" />
      </Slider.Track>
      <Slider.Thumb aria-label={label} className="block size-14 rounded-full border-4 border-bg bg-accent shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-accent/40" />
    </Slider.Root>
  )
}
