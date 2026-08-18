import { chromium } from 'playwright'
const URL = 'http://localhost:3177'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
p.setDefaultTimeout(120000)
p.on('pageerror', (e) => console.log('  PAGE ERR:', e.message))
// enregistre les vibrations : c'est notre preuve que les signaux ont bien été émis
await p.addInitScript(() => {
  window.__vib = []
  Object.defineProperty(navigator, 'vibrate', { value: (m) => { window.__vib.push([Date.now(), m]); return true } })
})

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(800)

await p.evaluate(async () => {
  const dbi = await new Promise((res, rej) => { const r = indexedDB.open('bf-dojo'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
  const tx = dbi.transaction('logs', 'readwrite')
  tx.objectStore('logs').put({ id: 'test-rounds', planId: 'savate-retour-8s', seanceTemplateId: 'bf-a', semaine: 1, dateDebut: new Date().toISOString(), statut: 'en_cours', entrees: [] })
  await new Promise((res) => { tx.oncomplete = res })
})
await p.goto(URL + '/seance/test-rounds', { waitUntil: 'networkidle' })
await p.waitForTimeout(600)

// avance jusqu'au bloc Sac (mesure « rounds »)
for (let i = 0; i < 20; i++) {
  if (await p.getByRole('button', { name: /Lancer les rounds/ }).count()) break
  await p.getByRole('button', { name: /Passer →/ }).click()
  await p.waitForTimeout(90)
}
console.log('exercice :', await p.locator('h1').first().textContent())

const moins = (label) => p.getByRole('button', { name: `Diminuer ${label}` })
for (let i = 0; i < 5; i++) await moins('Durée d’un round').click()   // 120 -> 45 s
for (let i = 0; i < 3; i++) await moins('Repos').click()               // 60  -> 15 s
console.log('config prête (3 rounds, 45 s / 15 s)')

const t0 = Date.now()
await p.getByRole('button', { name: /Lancer les rounds/ }).click()

await p.waitForTimeout(70000)                    // t = 70 s -> round 2, 35 s restants
const avant = await p.locator('output').first().textContent()
console.log(`t≈70s  affiché=${avant}  attendu≈0:35`)

// gel total du thread JS pendant 30 s : équivalent d'un écran verrouillé
await p.evaluate(() => { const fin = Date.now() + 30000; while (Date.now() < fin) {} })
await p.waitForTimeout(400)

const apres = await p.locator('output').first().textContent()
const ecoule = (Date.now() - t0) / 1000
const phase = await p.locator('main p').filter({ hasText: /Travail|Repos|Terminé/ }).first().textContent()
const round = await p.getByText(/Round \d+/).first().textContent()
console.log(`t≈${ecoule.toFixed(0)}s après gel  affiché=${apres}  phase=${phase}  ${round}  attendu≈0:05 / Travail / Round 2`)

const vib = await p.evaluate(() => window.__vib.length)
const detail = await p.evaluate(() => window.__vib.map(([, m]) => JSON.stringify(m)))
console.log('vibrations émises :', vib, detail.join(' '))
await b.close()
