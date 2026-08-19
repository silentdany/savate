/* Service worker de l'app Savate.
 *
 * Objectif : l'app doit demarrer et fonctionner integralement en mode avion,
 * des le premier chargement. Les donnees vivent dans IndexedDB, donc le SW n'a
 * qu'un seul travail : garantir que l'app shell (HTML + chunks JS/CSS) est
 * toujours disponible hors ligne.
 *
 * Subtilite Next.js : les chunks sont hashes, on ne peut pas les lister a
 * l'avance dans un manifeste statique. A l'installation on telecharge donc le
 * HTML de chaque route, on en extrait les URLs /_next/static/* et on precache
 * le tout. Sans ca, la premiere visite met le HTML en cache mais pas ses
 * chunks (deja charges avant que le SW ne prenne le controle) et l'app est
 * blanche au premier passage hors ligne.
 */

const VERSION = 'v1'
const SHELL_CACHE = `savate-shell-${VERSION}`
const ASSET_CACHE = `savate-assets-${VERSION}`
const DATA_CACHE = `savate-rsc-${VERSION}`
const KEEP = new Set([SHELL_CACHE, ASSET_CACHE, DATA_CACHE])

const ROUTES = ['/', '/plan', '/historique', '/reglages', '/seance/_']

/**
 * Le runner de seance est prerendu sous un identifiant sentinelle. Comme sa
 * page serveur n'utilise pas ses params, ce shell unique vaut pour n'importe
 * quel logId : c'est ce qui permet de demarrer une seance en mode avion.
 */
const SHELL_SEANCE = '/seance/_'
const estRouteSeance = (pathname) => pathname.startsWith('/seance/')
const STATIC = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

/** Extrait les URLs d'assets referencees dans un document HTML Next.js. */
function assetUrlsFrom(html) {
  const found = new Set()
  const re = /["'(](\/_next\/[^"')\s]+?\.(?:js|css|woff2?|ttf))["')\s]/g
  let m
  while ((m = re.exec(html)) !== null) if (m[1]) found.add(m[1])
  // Les chunks pousses via self.__next_f arrivent echappes (\" -> \\")
  const re2 = /\\?"(\/_next\/static\/[^"\\\s]+?\.(?:js|css))\\?"/g
  while ((m = re2.exec(html)) !== null) if (m[1]) found.add(m[1])
  return [...found]
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE)
      const assets = await caches.open(ASSET_CACHE)
      const assetUrls = new Set()

      await Promise.all(
        ROUTES.map(async (route) => {
          try {
            const res = await fetch(route, { cache: 'reload', credentials: 'same-origin' })
            if (!res.ok) return
            const html = await res.clone().text()
            await shell.put(route, res)
            assetUrlsFrom(html).forEach((u) => assetUrls.add(u))
          } catch {
            /* hors ligne au moment de l'install : on fera au runtime */
          }
        })
      )

      await Promise.all(
        [...assetUrls, ...STATIC].map((u) =>
          assets.add(new Request(u, { cache: 'reload' })).catch(() => {})
        )
      )

      // Payload RSC du shell de seance, pour une navigation client fluide
      // hors ligne (sans lui, on retombe sur un rechargement complet).
      try {
        const data = await caches.open(DATA_CACHE)
        const res = await fetch(SHELL_SEANCE + '?_rsc=offline', {
          headers: { RSC: '1' },
          cache: 'reload',
        })
        if (res.ok) await data.put(SHELL_SEANCE + '?_rsc=offline', res)
      } catch {
        /* sans importance : le fallback navigation prend le relais */
      }
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.map((n) => (KEEP.has(n) ? null : caches.delete(n))))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

const isAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname === '/manifest.webmanifest' ||
  /\.(?:png|svg|ico|woff2?|ttf|css|js)$/.test(url.pathname)

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

async function networkFirstNavigation(request) {
  const url = new URL(request.url)
  const shell = await caches.open(SHELL_CACHE)
  try {
    const res = await fetch(request)
    if (res.ok) shell.put(url.pathname, res.clone())
    return res
  } catch {
    // Route exacte, puis shell de seance, puis ecran Aujourd'hui : c'est lui qui
    // sait proposer de reprendre une seance en cours (piege "perte de seance").
    return (
      (await shell.match(url.pathname)) ||
      (estRouteSeance(url.pathname) ? await shell.match(SHELL_SEANCE) : undefined) ||
      (await shell.match('/')) ||
      new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain' } })
    )
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  const network = fetch(request)
    .then((res) => {
      if (res.ok) cache.put(request, res.clone())
      return res
    })
    .catch(() => null)
  if (hit) return hit
  const res = await network
  return res || new Response('', { status: 504 })
}

/**
 * Hors ligne, une navigation client vers /seance/<id> demande un payload RSC
 * jamais vu. On rejoue celui du shell sentinelle : le contenu de la route en
 * est independant, seul le logId lu dans l'URL compte.
 */
async function rscAvecReplide(request, url) {
  const cache = await caches.open(DATA_CACHE)
  const direct = await staleWhileRevalidate(request, DATA_CACHE)
  if (direct.ok) return direct
  if (!estRouteSeance(url.pathname)) return direct
  const secours = await cache.match(SHELL_SEANCE + url.search)
  return secours || direct
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request))
    return
  }
  if (isAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }
  // Payloads RSC des navigations client Next.js
  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') {
    event.respondWith(rscAvecReplide(request, url))
    return
  }
  event.respondWith(
    fetch(request).catch(async () => (await caches.match(request)) || new Response('', { status: 504 }))
  )
})
