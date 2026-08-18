// Genere les icones PWA a partir d'un SVG inline. Aucune police requise :
// le mark est purement geometrique (anneau de round + triangle "demarrer").
import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = new URL('../public/icons/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const mark = (scale) => {
  const s = scale
  return `
    <g transform="translate(256 256) scale(${s}) translate(-256 -256)">
      <circle cx="256" cy="256" r="150" fill="none" stroke="#2c343f" stroke-width="46" />
      <path d="M 256 106 A 150 150 0 1 1 108.28 229.95"
            fill="none" stroke="#ff5c1a" stroke-width="46" stroke-linecap="round" />
      <path d="M 223 196 L 223 316 L 323 256 Z"
            fill="#ff5c1a" stroke="#ff5c1a" stroke-width="26" stroke-linejoin="round" />
    </g>`
}

const svg = (scale, radius) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b222b"/>
      <stop offset="1" stop-color="#0a0d11"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  ${mark(scale)}
</svg>`

const render = async (name, size, scale, radius) => {
  const buf = await sharp(Buffer.from(svg(scale, radius))).resize(size, size).png().toBuffer()
  writeFileSync(new URL(name, OUT), buf)
  console.log('  ->', name, size + 'px')
}

// any-purpose : coins arrondis doux, mark plein cadre
await render('icon-192.png', 192, 1, 96)
await render('icon-512.png', 512, 1, 96)
// maskable : fond plein bord a bord, contenu dans la zone sure (60%)
await render('icon-maskable-512.png', 512, 0.62, 0)
// iOS applique son propre masque : carre plein, pas de transparence
await render('apple-touch-icon.png', 180, 1, 0)

console.log('icones generees')
