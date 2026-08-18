import { chromium } from 'playwright'
const URL = 'http://localhost:3177'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('  PAGE ERR:', e.message))

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(800)

await p.getByRole('button', { name: /Démarrer/ }).click()
await p.waitForURL(/\/seance\//)
await p.waitForTimeout(500)

let etapes = 0
let clavierVu = 0
for (let i = 0; i < 60; i++) {
  const cloture = await p.getByRole('button', { name: /Terminer la séance/ }).count()
  if (cloture > 0) break
  // aucun champ texte ne doit être visible pendant le déroulé
  clavierVu += await p.locator('input:not([type=file]), textarea, [contenteditable=true]').count()
  const btn = p.getByRole('button', { name: /^(Valider|Fait)$/ })
  if ((await btn.count()) === 0) break
  await btn.first().click()
  await p.waitForTimeout(120)
  etapes++
}
console.log('étapes validées :', etapes)
console.log('champs texte rencontrés pendant le déroulé :', clavierVu)

// Clôture : RPE au curseur, pas de clavier
const slider = p.locator('[role=slider]').first()
await slider.click()
for (let i = 0; i < 3; i++) await p.keyboard.press('ArrowRight')
await p.getByRole('button', { name: /Terminer la séance/ }).click()
await p.waitForURL(URL + '/')
await p.waitForTimeout(600)

const log = await p.evaluate(async () => {
  const req = indexedDB.open('bf-dojo')
  const dbi = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error) })
  const tx = dbi.transaction('logs', 'readonly')
  const all = await new Promise((res, rej) => { const r = tx.objectStore('logs').getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
  return all.map((l) => ({ tpl: l.seanceTemplateId, statut: l.statut, rpe: l.rpe, entrees: l.entrees.length, faits: l.entrees.filter(e => e.fait).length, semaine: l.semaine }))
})
console.log('logs en base :', JSON.stringify(log, null, 1))
await b.close()
