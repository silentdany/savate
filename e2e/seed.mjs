import { chromium } from 'playwright'
const URL = 'http://localhost:3177'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage()
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForSelector('main dl', { timeout: 20000 })

// On salit le plan en base ET on ajoute une séance loggée, puis on recharge :
// le plan doit repartir du fichier de seed, la séance doit survivre.
await p.evaluate(async () => {
  const dbi = await new Promise((r, j) => { const q = indexedDB.open('bf-dojo'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error) })
  const tx = dbi.transaction(['plans', 'logs'], 'readwrite')
  const s = tx.objectStore('plans')
  const plan = await new Promise((r) => { const g = s.get('savate-retour-8s'); g.onsuccess = () => r(g.result) })
  plan.nom = 'PLAN CORROMPU'
  plan.seances[0].nom = 'SÉANCE CORROMPUE'
  s.put(plan)
  tx.objectStore('logs').put({ id: 'garde-moi', planId: 'savate-retour-8s', seanceTemplateId: 'bf-a', semaine: 1,
    dateDebut: new Date().toISOString(), dateFin: new Date().toISOString(), statut: 'terminee', rpe: 6, entrees: [] })
  await new Promise((r) => { tx.oncomplete = r })
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForSelector('main dl', { timeout: 20000 })
const etat = await p.evaluate(async () => {
  const dbi = await new Promise((r, j) => { const q = indexedDB.open('bf-dojo'); q.onsuccess = () => r(q.result); q.onerror = () => j(q.error) })
  const lire = (store, cle) => new Promise((r) => { const g = dbi.transaction(store).objectStore(store).get(cle); g.onsuccess = () => r(g.result) })
  const plan = await lire('plans', 'savate-retour-8s')
  const log = await lire('logs', 'garde-moi')
  return { nomPlan: plan.nom, nomSeance: plan.seances[0].nom, logConserve: !!log }
})
console.log('plan après rechargement  :', etat.nomPlan)
console.log('1re séance               :', etat.nomSeance)
console.log('séance loggée conservée  :', etat.logConserve)
const ok = !etat.nomPlan.includes('CORROMPU') && !etat.nomSeance.includes('CORROMPUE') && etat.logConserve
console.log(ok ? 'OK   le plan vient du seed, les données utilisateur sont intactes'
              : 'ÉCHEC')
await b.close()
process.exit(ok ? 0 : 1)
