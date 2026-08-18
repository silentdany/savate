import { chromium } from 'playwright'

const BASE = process.env.BF_URL ?? 'http://localhost:3177'
const URL = process.env.BF_URL ?? BASE + ''
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 20000 })
await p.waitForTimeout(2500)

const cdp = await ctx.newCDPSession(p)
const { errors, url, data } = await cdp.send('Page.getAppManifest')
const m = JSON.parse(data)
console.log('manifest      :', url)
console.log('erreurs       :', errors.length ? JSON.stringify(errors) : 'aucune')
console.log('display       :', m.display, '| start_url:', m.start_url, '| scope:', m.scope)
console.log('icônes        :', m.icons.map((i) => `${i.sizes}/${i.purpose ?? 'any'}`).join(' '))

const sw = await p.evaluate(async () => {
  const r = await navigator.serviceWorker.getRegistration()
  return { scope: r?.scope, actif: r?.active?.state }
})
console.log('service worker:', JSON.stringify(sw))

const caches_ = await p.evaluate(async () => {
  const noms = await caches.keys()
  const out = {}
  for (const n of noms) out[n] = (await (await caches.open(n)).keys()).length
  return out
})
console.log('caches        :', JSON.stringify(caches_))

// start_url doit répondre 200 hors ligne : c'est le critère d'installabilité
await ctx.setOffline(true)
const r = await p.evaluate(async () => {
  const res = await fetch('/', { cache: 'no-store' })
  return res.status
}).catch((e) => 'ERREUR ' + e.message)
console.log('start_url hors ligne :', r)
const rechargee = await p.reload({ waitUntil: 'load' }).then(() => p.locator('h1').first().textContent())
console.log('rechargement hors ligne — h1 :', rechargee)
await b.close()
