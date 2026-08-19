/**
 * Genere les icones PWA.
 *
 *   node scripts/gen-icons.mjs [chemin/vers/logo.svg|png]
 *
 * Sans argument, le script cherche `assets/logo.{svg,png,jpg,webp}`. S'il n'en
 * trouve aucun, il retombe sur un mark geometrique (anneau de round + triangle
 * « demarrer ») qui ne depend d'aucune police ni d'aucun fichier externe.
 *
 * Le logo fourni est detoure sur un fond sombre aux couleurs de l'app. La
 * variante maskable garde le logo dans la zone sure des 60 % : Android rogne
 * les bords, un logo plein cadre y perdrait ses extremites.
 */
import sharp from 'sharp'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUT = new URL('../public/icons/', import.meta.url)
mkdirSync(OUT, { recursive: true })

const CANDIDATS = ['svg', 'png', 'jpg', 'jpeg', 'webp'].map((e) =>
  fileURLToPath(new URL(`../assets/logo.${e}`, import.meta.url))
)
const source = process.argv[2] ?? CANDIDATS.find((c) => existsSync(c))

const FOND = `<defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b222b"/>
      <stop offset="1" stop-color="#0a0d11"/>
    </linearGradient>
  </defs>`

const markGeometrique = (scale) => `
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <circle cx="256" cy="256" r="150" fill="none" stroke="#2c343f" stroke-width="46" />
    <path d="M 256 106 A 150 150 0 1 1 108.28 229.95"
          fill="none" stroke="#ff5c1a" stroke-width="46" stroke-linecap="round" />
    <path d="M 223 196 L 223 316 L 323 256 Z"
          fill="#ff5c1a" stroke="#ff5c1a" stroke-width="26" stroke-linejoin="round" />
  </g>`

const fondSvg = (radius, contenu = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${FOND}
  <rect width="512" height="512" rx="${radius}" fill="url(#g)"/>
  ${contenu}
</svg>`

const CADRE = 512

/**
 * Part haute du logo conservee pour le favicon. A 16-32 px, un texte de
 * signature ne fait qu'une bouillie grise qui mange la moitie du cadre : on ne
 * garde que le mark graphique. Mettre 1 pour un logo sans texte.
 */
const FAVICON_RECADRAGE = 0.66

/**
 * Rend une icone en memoire. `couverture` = part du cadre occupee par le mark.
 *
 * Le `.resize(CADRE)` sur le fond n'est pas decoratif : sharp rasterise un SVG
 * a 72 DPI, donc un `width="512"` sort a 384 px. Sans ce recadrage, le logo
 * composite serait plus grand que son support, et le mark geometrique perdrait
 * en nettete a l'agrandissement final.
 */
async function rendre(taille, couverture, radius, recadrage = 1) {
  const contenu = source ? '' : markGeometrique(couverture)
  const fond = sharp(Buffer.from(fondSvg(radius, contenu))).resize(CADRE, CADRE)

  if (!source) return fond.resize(taille, taille).png().toBuffer()

  let brut = sharp(source, { density: 600 })
  if (recadrage < 1) {
    const { width = 0, height = 0 } = await brut.metadata()
    brut = sharp(source, { density: 600 }).extract({
      left: 0,
      top: 0,
      width,
      height: Math.round(height * recadrage),
    })
  }

  const cote = Math.round(CADRE * couverture)
  // Density elevee : un SVG source doit etre rasterise net, pas etire ensuite.
  const logo = await brut
    .resize(cote, cote, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const composee = await fond.composite([{ input: logo, gravity: 'center' }]).png().toBuffer()
  return sharp(composee).resize(taille, taille).png().toBuffer()
}

/**
 * Assemble un .ico. Le format n'est qu'un en-tete suivi des PNG bruts, donc
 * aucune dependance supplementaire n'est necessaire.
 */
function encoderIco(images) {
  const entetes = Buffer.alloc(6 + 16 * images.length)
  entetes.writeUInt16LE(0, 0)
  entetes.writeUInt16LE(1, 2) // type 1 = icone
  entetes.writeUInt16LE(images.length, 4)
  let offset = entetes.length
  images.forEach(({ taille, data }, i) => {
    const p = 6 + 16 * i
    entetes.writeUInt8(taille >= 256 ? 0 : taille, p)
    entetes.writeUInt8(taille >= 256 ? 0 : taille, p + 1)
    entetes.writeUInt8(0, p + 2) // palette
    entetes.writeUInt8(0, p + 3) // reserve
    entetes.writeUInt16LE(1, p + 4) // plans
    entetes.writeUInt16LE(32, p + 6) // bits par pixel
    entetes.writeUInt32LE(data.length, p + 8)
    entetes.writeUInt32LE(offset, p + 12)
    offset += data.length
  })
  return Buffer.concat([entetes, ...images.map((i) => i.data)])
}

async function render(nom, taille, couverture, radius) {
  const buf = await rendre(taille, couverture, radius)
  writeFileSync(new URL(nom, OUT), buf)
  console.log('  ->', nom, taille + 'px')
}

console.log(source ? `logo source : ${source}` : 'aucun logo dans assets/, mark geometrique utilise')

// any-purpose : coins arrondis doux, logo large
await render('icon-192.png', 192, source ? 0.78 : 1, 96)
await render('icon-512.png', 512, source ? 0.78 : 1, 96)
// maskable : fond bord a bord, contenu dans la zone sure
await render('icon-maskable-512.png', 512, source ? 0.58 : 0.62, 0)
// iOS applique son propre masque : carre plein, pas de transparence
await render('apple-touch-icon.png', 180, source ? 0.78 : 1, 0)

// Favicon : l'onglet du navigateur affichait encore celui de Next.js.
const ico = encoderIco(
  await Promise.all(
    [16, 32, 48].map(async (t) => ({
      taille: t,
      data: await rendre(t, source ? 0.8 : 1, 0, source ? FAVICON_RECADRAGE : 1),
    }))
  )
)
writeFileSync(new URL('../src/app/favicon.ico', import.meta.url), ico)
console.log('  -> src/app/favicon.ico  16/32/48px')

console.log('icones generees')
