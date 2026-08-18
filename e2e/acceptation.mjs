import { chromium } from 'playwright'

const BASE = process.env.BF_URL ?? 'http://localhost:3177'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'

const URL = process.env.BF_URL ?? BASE + ''
const OUT = '/tmp/claude-1000/-home-dany-Projects/60957708-1ac3-4071-9786-893e32ce37c3/scratchpad'
const resultats = []
const ok = (n, c, d = '') => { resultats.push([c ? 'OK  ' : 'ÉCHEC', n, d]); }

const b = await chromium.launch()

const nouveauCtx = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => console.log('  PAGE ERR:', e.message))
  return { ctx, p }
}

const seed = (p, logs) => p.evaluate(async (logs) => {
  const dbi = await new Promise((r, j) => { const q = indexedDB.open('bf-dojo'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error) })
  const tx = dbi.transaction('logs', 'readwrite')
  for (const l of logs) tx.objectStore('logs').put(l)
  await new Promise((r) => { tx.oncomplete = r })
}, logs)

const faireLog = (i, semaine, tpl, rpe, rounds, volume) => ({
  id: `seed-${i}`, planId: 'savate-retour-8s', seanceTemplateId: tpl, semaine,
  dateDebut: new Date(Date.now() - i * 864e5).toISOString(),
  dateFin: new Date(Date.now() - i * 864e5 + 50 * 6e4).toISOString(),
  statut: 'terminee', rpe,
  entrees: [
    { exerciceId: 'bfa-s1', fait: true, roundsFaits: rounds },
    { exerciceId: 'rna-c1', fait: true, reps: 10, chargeKg: volume / 10, tour: 1 },
  ],
})

// ---------------------------------------------------------- B. Lot 2
{
  const { ctx, p } = await nouveauCtx()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  const s1 = await p.locator('main dl').innerText()
  await p.getByRole('link', { name: 'Réglages' }).click(); await p.waitForTimeout(500)
  for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: 'Semaine suivante' }).click(); await p.waitForTimeout(200) }
  await p.getByRole('link', { name: 'Séance' }).click(); await p.waitForTimeout(600)
  const s4 = await p.locator('main dl').innerText()
  const bandeau = await p.locator('header p').first().innerText()
  ok('Lot 2 — changer la semaine change la séance du jour', s1 !== s4 && /SEMAINE 4/i.test(bandeau),
     `S1[${s1.replace(/\n/g, '|')}] → S4[${s4.replace(/\n/g, '|')}]`)
  await ctx.close()
}

// ---------------------------------------------------------- A. Lot 1
{
  const { ctx, p } = await nouveauCtx()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await seed(p, [faireLog(1, 1, 'bf-a', 6, 4, 800), faireLog(2, 2, 'renfo-a', 7, 0, 1200)])
  await p.goto(URL + '/reglages', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  for (let i = 0; i < 2; i++) { await p.getByRole('button', { name: 'Semaine suivante' }).click(); await p.waitForTimeout(150) }
  await p.getByRole('switch', { name: /allégée/ }).click(); await p.waitForTimeout(300)

  const dl1 = p.waitForEvent('download')
  await p.getByRole('button', { name: 'Exporter en JSON' }).click()
  const f1 = `${OUT}/export1.json`; await (await dl1).saveAs(f1)

  // remise à zéro, puis import du fichier
  await p.getByRole('button', { name: 'Tout remettre à zéro' }).click()
  await p.getByRole('button', { name: 'Continuer' }).click()
  await p.getByRole('button', { name: 'Oui, tout effacer' }).click()
  await p.waitForTimeout(700)
  const videApres = await p.getByText(/^0 séance enregistrée/).count()

  await p.locator('input[type=file]').setInputFiles(f1)
  await p.waitForTimeout(900)
  const dl2 = p.waitForEvent('download')
  await p.getByRole('button', { name: 'Exporter en JSON' }).click()
  const f2 = `${OUT}/export2.json`; await (await dl2).saveAs(f2)

  const a = JSON.parse(readFileSync(f1, 'utf8')); const c = JSON.parse(readFileSync(f2, 'utf8'))
  delete a.exporteLe; delete c.exporteLe
  const identique = JSON.stringify(a) === JSON.stringify(c)
  ok('Lot 1 — export réimporté redonne un état identique', identique && videApres === 1,
     identique ? `${a.logs.length} logs, semaine ${a.etat.semaineCourante}, allégées [${a.etat.semainesAllegees}]` : 'diff détectée')
  if (!identique) writeFileSync(`${OUT}/diff.txt`, JSON.stringify(a) + '\n---\n' + JSON.stringify(c))
  await ctx.close()
}

// ---------------------------------------------------------- C. Lot 5
{
  const { ctx, p } = await nouveauCtx()
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await seed(p, [
    faireLog(1, 1, 'bf-a', 5, 3, 500), faireLog(2, 1, 'renfo-a', 6, 0, 700),
    faireLog(3, 2, 'bf-b', 7, 4, 0),   faireLog(4, 2, 'bf-a', 8, 4, 0),
    faireLog(5, 3, 'renfo-b', 6, 0, 900),
  ])
  await p.goto(URL + '/historique', { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  const compte = await p.locator('main section:last-of-type ul:not([aria-label]) > li').count()
  const bascules = p.locator('button[aria-controls]')
  for (let i = 0, n = await bascules.count(); i < n; i++) await bascules.nth(i).click()
  await p.waitForTimeout(300)
  const tables = await p.locator('table').evaluateAll((ts) =>
    ts.map((t) => [...t.querySelectorAll('tbody tr')].slice(0, 3).map((r) => r.children[1].textContent.trim()))
  )
  // rounds: S1=3, S2=8, S3=0 | RPE: S1=5.5, S2=7.5, S3=6.0 | volume: S1=1200, S2=—, S3=900
  // S1 rounds 3 (bf-a) / S2 rounds 8 (bf-b + bf-a) ; RPE moyens 5.5 / 7.5 / 6.0 ;
  // volume 1200 kg -> « 1.2 t », S2 sans renfo, S3 900 kg.
  const attendu = JSON.stringify([['3', '8', '—'], ['5.5', '7.5', '6.0'], ['1.2 t', '—', '900']])
  ok('Lot 5 — 5 séances agrégées par semaine', JSON.stringify(tables) === attendu && compte === 5,
     `liste=${compte} tables=${JSON.stringify(tables)}`)
  await ctx.close()
}

// ---------------------------------------------------------- E. survie au kill
// Profil persistant sur disque : fermer le contexte equivaut vraiment a tuer
// l'app, IndexedDB comprise.
{
  const profil = `${OUT}/profil-kill`
  rmSync(profil, { recursive: true, force: true })
  const opts = { viewport: { width: 390, height: 844 } }

  const c1 = await chromium.launchPersistentContext(profil, opts)
  const p1 = c1.pages()[0] ?? (await c1.newPage())
  await p1.goto(URL, { waitUntil: 'networkidle' }); await p1.waitForTimeout(800)
  await p1.getByRole('button', { name: /Démarrer/ }).click()
  await p1.waitForURL(/\/seance\//); await p1.waitForTimeout(500)
  for (let i = 0; i < 2; i++) { await p1.getByRole('button', { name: /^(Valider|Fait)$/ }).click(); await p1.waitForTimeout(250) }
  await p1.waitForTimeout(400)
  await c1.close()

  const c2 = await chromium.launchPersistentContext(profil, opts)
  const p2 = c2.pages()[0] ?? (await c2.newPage())
  await p2.goto(URL, { waitUntil: 'networkidle' }); await p2.waitForTimeout(1200)
  const reprise = await p2.getByText('Séance en cours').count()
  const valides = await p2.getByText(/2 exercices déjà validés/).count()
  ok('Global — les données survivent à un kill de l’app', reprise === 1 && valides === 1,
     `bandeau « Séance en cours »=${reprise}, « 2 exercices déjà validés »=${valides}`)
  await c2.close()
}

await b.close()
console.log('\n' + resultats.map(([s, n, d]) => `${s}  ${n}${d ? '\n        ' + d : ''}`).join('\n'))
process.exit(resultats.some(([s]) => s !== 'OK  ') ? 1 : 0)
