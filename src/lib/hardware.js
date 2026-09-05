// Local Hardware: find the closest hardware stores to the home address.
// Uses two free OpenStreetMap services directly from the browser — Nominatim to
// turn the address into coordinates, Overpass to find hardware/home-improvement
// stores nearby. Only the address text is sent; nothing else leaves the device.

const CHAINS = [
  'home depot', "lowe's", 'lowes', 'ace hardware', 'harbor freight',
  'tractor supply', 'menards', 'true value', 'northern tool', 'do it best',
  'atwoods', "mccoy's", 'mccoys', 'orscheln', 'rural king',
]

export function isChain(name) {
  const n = (name || '').toLowerCase()
  return CHAINS.some((c) => n.includes(c))
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function geocodeOnce(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=' + encodeURIComponent(query)
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Could not look up that address (geocoder ' + res.status + ')')
  const js = await res.json()
  if (!js.length) return null
  return { lat: +js[0].lat, lon: +js[0].lon, display: js[0].display_name }
}

// Rural addresses (county roads, new builds) often aren't in the map database at
// the house-number level. Fall back gracefully: exact address → ZIP code → city &
// state — so the search always lands in the right area.
export async function geocodeAddress(query) {
  const attempts = [{ q: query, approx: false }]

  const zip = query.match(/\b(\d{5})(?:-\d{4})?\b/)
  if (zip) attempts.push({ q: zip[1] + ', USA', approx: true })

  const parts = query.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const cityState = parts.slice(-2).join(', ').replace(/\b\d{5}(?:-\d{4})?\b/g, '').replace(/\s+/g, ' ').trim()
    if (cityState) attempts.push({ q: cityState, approx: true })
  }

  for (let i = 0; i < attempts.length; i++) {
    if (i > 0) await sleep(1100) // Nominatim asks for max 1 request/second
    const hit = await geocodeOnce(attempts[i].q)
    if (hit) return { ...hit, approximate: attempts[i].approx, usedQuery: attempts[i].q }
  }
  return null
}

const toRad = (d) => (d * Math.PI) / 180
function miles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function overpassQuery(lat, lon, radiusMiles) {
  const r = Math.round(radiusMiles * 1609)
  // doityourself = Home Depot/Lowe's-style; hardware = local shops;
  // country_store/agrarian = Atwoods, Tractor Supply, feed & farm stores.
  const q = `[out:json][timeout:25];nwr["shop"~"doityourself|hardware|country_store|agrarian"]["name"](around:${r},${lat},${lon});out center 100;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(q),
  })
  if (!res.ok) throw new Error('Store lookup failed (' + res.status + ')')
  return res.json()
}

export async function findHardwareStores(lat, lon, radiusMiles = 20) {
  let js = await overpassQuery(lat, lon, radiusMiles)
  // Rural area with few hits? Widen the net once.
  if ((js.elements || []).length < 8) {
    try { js = await overpassQuery(lat, lon, 40) } catch { /* keep first result */ }
  }

  const seen = new Map()
  for (const el of js.elements || []) {
    const t = el.tags || {}
    const name = t.name || t.brand
    if (!name) continue
    const slat = el.lat ?? el.center?.lat
    const slon = el.lon ?? el.center?.lon
    if (slat == null || slon == null) continue
    const dist = miles(lat, lon, slat, slon)
    const addr = [
      [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' '),
      t['addr:city'],
    ].filter(Boolean).join(', ')
    // Dedupe near-identical entries (same name within ~0.3 mi), keep the closest.
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '|' + dist.toFixed(0)
    const existing = seen.get(key)
    if (!existing || dist < existing.dist) {
      seen.set(key, { name, dist, lat: slat, lon: slon, addr, chain: isChain(name) })
    }
  }

  return [...seen.values()]
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 12)
    .map((s) => ({ ...s, distLabel: s.dist < 10 ? s.dist.toFixed(1) + ' mi' : Math.round(s.dist) + ' mi' }))
}

export const directionsURL = (s) =>
  'https://maps.apple.com/?daddr=' + s.lat + ',' + s.lon + '&q=' + encodeURIComponent(s.name)

export const fallbackSearchURL = (address) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('hardware store near ' + address)
