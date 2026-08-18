import { chromium } from 'playwright'

const BASE = process.env.BF_URL ?? 'http://localhost:3177'
import { readFileSync } from 'node:fs'

const URL = process.env.BF_URL ?? BASE + ''
const AXE = readFileSync('node_modules/axe-core/axe.min.js', 'utf8')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('  PAGE ERR:', e.message))

// des données pour que les écrans soient pleins
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForSelector('main dl', { timeout: 20000 }) // Dexie ouverte et semée
await p.evaluate(async () => {
  const dbi = await new Promise((r, j) => { const q = indexedDB.open('bf-dojo'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error) })
  const tx = dbi.transaction('logs', 'readwrite')
  for (let i = 1; i <= 5; i++) tx.objectStore('logs').put({
    id: `a-${i}`, planId: 'savate-retour-8s', seanceTemplateId: i % 2 ? 'bf-a' : 'renfo-a',
    semaine: Math.ceil(i / 2), dateDebut: new Date(Date.now() - i * 864e5).toISOString(),
    dateFin: new Date(Date.now() - i * 864e5 + 3e6).toISOString(), statut: 'terminee', rpe: 4 + i,
    gene: i === 2 ? [{ zone: 'aine', niveau: 2 }] : undefined,
    entrees: [{ exerciceId: 'bfa-s1', fait: true, roundsFaits: 3 }, { exerciceId: 'rna-c1', fait: true, reps: 10, chargeKg: 40, tour: 1 }],
  })
  await new Promise((r) => { tx.oncomplete = r })
})

const ECRANS = [['Aujourd’hui', '/'], ['Plan', '/plan'], ['Historique', '/historique'], ['Réglages', '/reglages']]
let violationsTotal = 0
let tropPetits = []

for (const [nom, route] of ECRANS) {
  await p.goto(URL + route, { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  if (route === '/plan') { await p.locator('button[aria-expanded]').first().click(); await p.waitForTimeout(300) }

  await p.addScriptTag({ content: AXE })
  const res = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes[0]?.html?.slice(0, 110) }))
  })
  violationsTotal += res.length
  console.log(`\n── ${nom} (${route})`)
  console.log(res.length ? res.map((v) => `   ✗ [${v.impact}] ${v.id} ×${v.n}\n     ${v.ex}`).join('\n') : '   ✓ axe : aucune violation')

  const petits = await p.evaluate(() => {
    const sel = 'button, a[href], [role=button], [role=switch], [role=slider], [role=tab], input:not([type=file]), summary'
    return [...document.querySelectorAll(sel)].flatMap((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return []
      const min = Math.min(r.width, r.height)
      if (min >= 56) return []
      // Les marques d'un graphique ne sont pas des commandes : leur valeur est
      // aussi lisible au clavier, dans le libellé ARIA et dans la table.
      if (el.hasAttribute('data-marque-donnee')) return []
      return [{ min: Math.round(min), w: Math.round(r.width), h: Math.round(r.height), html: el.outerHTML.slice(0, 90) }]
    })
  })
  if (petits.length) tropPetits.push([nom, petits])
  console.log(`   cibles tactiles < 56 px : ${petits.length}`)
  for (const c of petits) console.log(`     ${c.w}×${c.h}  ${c.html}`)
}

// --- écrans de séance : runner (reps, charge, durée, rounds) puis clôture ---
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForSelector('main dl', { timeout: 20000 })
await p.getByRole('button', { name: /Démarrer/ }).click()
await p.waitForURL(/\/seance\//)
await p.waitForTimeout(600)

const auditer = async (nom) => {
  await p.addScriptTag({ content: AXE })
  const res = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] })
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes[0]?.html?.slice(0, 110) }))
  })
  violationsTotal += res.length
  const diag = await p.evaluate(() => ({
    titre: document.title,
    balises: [...document.querySelectorAll('title')].map((t) => `${t.parentElement?.tagName}:${t.textContent}`),
  }))
  if (res.some((v) => v.id === 'document-title')) console.log('   diag titre :', JSON.stringify(diag))
  const petits = await p.evaluate(() => {
    const sel = 'button, a[href], [role=button], [role=switch], [role=slider], [role=tab], input:not([type=file]), summary'
    return [...document.querySelectorAll(sel)].flatMap((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return []
      if (Math.min(r.width, r.height) >= 56) return []
      if (el.hasAttribute('data-marque-donnee')) return []
      return [`${Math.round(r.width)}×${Math.round(r.height)} ${el.outerHTML.slice(0, 80)}`]
    })
  })
  if (petits.length) tropPetits.push([nom, petits])
  console.log(`\n── ${nom}`)
  console.log(res.length ? res.map((v) => `   ✗ [${v.impact}] ${v.id} ×${v.n}\n     ${v.ex}`).join('\n') : '   ✓ axe : aucune violation')
  console.log(`   cibles tactiles < 56 px : ${petits.length}`)
  for (const c of petits) console.log(`     ${c}`)
}

await auditer('Séance — exercice à durée')
let trouveCharge = false
for (let i = 0; i < 40; i++) {
  if (await p.getByRole('button', { name: 'Augmenter Charge' }).count()) { trouveCharge = true; break }
  if (await p.getByRole('button', { name: /Terminer la séance/ }).count()) break
  await p.getByRole('button', { name: 'Passer →' }).click()
  await p.waitForTimeout(110)
}
if (trouveCharge) await auditer('Séance — reps + charge')
else console.log('\n── Séance — reps + charge : absent de cette séance, passé')
for (let i = 0; i < 40; i++) {
  if (await p.getByRole('button', { name: /Terminer la séance/ }).count()) break
  await p.getByRole('button', { name: /^(Valider|Fait)$/ }).click()
  await p.waitForTimeout(100)
}
await auditer('Séance — clôture (RPE, gêne)')

console.log(`\n=== axe : ${violationsTotal} violation(s) au total`)
console.log(`=== cibles < 56 px : ${tropPetits.reduce((t, [, l]) => t + l.length, 0)}`)
await b.close()
