import { chromium } from 'playwright'

const URL = 'http://localhost:3177'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('  PAGE ERR:', e.message))

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 15000 })
console.log('1. SW actif ✓')

// laisse le SW finir son precache
await p.waitForTimeout(2500)

await ctx.setOffline(true)
await p.reload({ waitUntil: 'load' })
console.log('2. reload hors ligne — H1 =', (await p.locator('h1').first().textContent()))

// démarrer une séance HORS LIGNE
await p.getByRole('button', { name: /Démarrer/ }).click()
await p.waitForTimeout(2500)
console.log('3. après tap Démarrer (offline) — url =', p.url())
const h1 = await p.locator('h1').first().textContent().catch(() => '(aucun h1)')
console.log('   h1 =', h1)
const aBoutonValider = await p.getByRole('button', { name: /^Valider$|^Fait$/ }).count()
console.log('   bouton Valider/Fait présent :', aBoutonValider > 0)

await b.close()
