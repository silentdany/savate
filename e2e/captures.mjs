import { chromium } from 'playwright'
const URL = 'http://localhost:3177'
const OUT = process.argv[2] ?? '/tmp/shots'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForSelector('main dl', { timeout: 20000 })
await p.evaluate(async () => {
  const dbi = await new Promise((r, j) => { const q = indexedDB.open('bf-dojo'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error) })
  const tx = dbi.transaction('logs', 'readwrite')
  for (let i = 1; i <= 6; i++) tx.objectStore('logs').put({
    id: `s-${i}`, planId: 'savate-retour-8s', seanceTemplateId: ['bf-a','renfo-a','cardio','bf-b','renfo-b','bf-a'][i-1],
    semaine: Math.min(3, Math.ceil(i / 2)), dateDebut: new Date(Date.now() - i * 864e5).toISOString(),
    dateFin: new Date(Date.now() - i * 864e5 + 3.2e6).toISOString(), statut: i === 3 ? 'partielle' : 'terminee',
    rpe: 4 + (i % 5), gene: i === 2 ? [{ zone: 'aine', niveau: 2 }] : undefined,
    note: i === 1 ? 'Fouetté figure nickel, rien n’a tiré.' : undefined,
    entrees: [{ exerciceId: 'bfa-s1', fait: true, roundsFaits: 3 + (i % 3) },
              { exerciceId: 'rna-c1', fait: true, reps: 10, chargeKg: 30 + i * 5, tour: 1 },
              { exerciceId: 'rnb-c1', fait: true, reps: 16, chargeKg: 20, tour: 1 }],
  })
  await new Promise((r) => { tx.oncomplete = r })
})

const shot = async (nom) => { await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/${nom}.png`, fullPage: false }) }
await p.goto(URL, { waitUntil: 'networkidle' }); await shot('01-aujourdhui')
await p.goto(URL + '/plan', { waitUntil: 'networkidle' }); await shot('02-plan')
await p.locator('button[aria-expanded]').nth(2).click(); await shot('03-plan-semaine-3')
await p.locator('button:has-text("BF A")').first().click(); await shot('04-plan-apercu')
await p.keyboard.press('Escape')
await p.goto(URL + '/historique', { waitUntil: 'networkidle' }); await shot('05-historique')
await p.goto(URL + '/reglages', { waitUntil: 'networkidle' }); await shot('06-reglages')

await p.goto(URL, { waitUntil: 'networkidle' })
await p.getByRole('button', { name: /Démarrer/ }).click()
await p.waitForURL(/\/seance\//); await shot('07-seance-duree')
await p.getByRole('button', { name: 'Mobilité' }).click(); await shot('09-mobilite')
await p.keyboard.press('Escape'); await p.waitForTimeout(400)
for (let i = 0; i < 40; i++) {
  if (await p.getByRole('button', { name: 'Augmenter Charge' }).count()) break
  if (await p.getByRole('button', { name: /Terminer la séance/ }).count()) break
  await p.getByRole('button', { name: 'Passer →' }).click(); await p.waitForTimeout(90)
}
await shot('08-seance-charge')
for (let i = 0; i < 60; i++) {
  if (await p.getByRole('button', { name: /Terminer la séance/ }).count()) break
  await p.getByRole('button', { name: /^(Valider|Fait)$/ }).click(); await p.waitForTimeout(80)
}
await shot('10-cloture')
for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: /Aine/ }).click(); await p.waitForTimeout(150) }
await p.locator('main').evaluate((m) => m.scrollIntoView(false))
await p.mouse.wheel(0, 500); await shot('11-cloture-vigilance')

// timer de rounds sur une séance BF
await p.evaluate(async () => {
  const dbi = await new Promise((r, j) => { const q = indexedDB.open('bf-dojo'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error) })
  const tx = dbi.transaction('logs', 'readwrite')
  tx.objectStore('logs').put({ id: 'tt', planId: 'savate-retour-8s', seanceTemplateId: 'bf-a', semaine: 3, dateDebut: new Date().toISOString(), statut: 'en_cours', entrees: [] })
  await new Promise((r) => { tx.oncomplete = r })
})
await p.goto(URL + '/seance/tt', { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
for (let i = 0; i < 25; i++) {
  if (await p.getByRole('button', { name: /Lancer les rounds/ }).count()) break
  await p.getByRole('button', { name: 'Passer →' }).click(); await p.waitForTimeout(90)
}
await shot('12-timer-config')
await p.getByRole('button', { name: /Lancer les rounds/ }).click(); await p.waitForTimeout(1200)
await shot('13-timer-travail')
await b.close()
