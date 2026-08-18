import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
p.on('console', (m) => m.type() === 'error' && console.log('CONSOLE ERR:', m.text()))
p.on('pageerror', (e) => console.log('PAGE ERR:', e.message))
await p.goto('http://localhost:3177/', { waitUntil: 'networkidle' })
console.log('H1:', await p.locator('h1').first().textContent())
console.log('OK boot')
await b.close()
