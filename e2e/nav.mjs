import { chromium } from 'playwright'

const BASE = process.env.BF_URL ?? 'http://localhost:3177'
const b = await chromium.launch()
for (const w of [320, 360, 390, 430]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 800 } })).newPage()
  await p.goto(BASE + '/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  const r = await p.locator('nav span').evaluateAll((els) =>
    els.map((e) => `${e.textContent}${e.scrollWidth > e.clientWidth ? ' ✂TRONQUÉ' : ''}`)
  )
  console.log(`${w}px :`, r.join(' | '))
}
await b.close()
