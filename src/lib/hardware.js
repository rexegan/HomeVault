// Local Hardware: find the closest hardware stores to the home address.
// Uses two free OpenStreetMap services directly from the browser — Nominatim to
// turn the address into coordinates, Overpass to find hardware/home-improvement
// stores nearby. Only the address text is sent; nothing else leaves the device.

const CHAINS = [
  'home depot', "lowe's", 'lowes', 'ace hardware', 'harbor freight',
  'tractor supply', 'menards', 'true value', 'northern tool', 'do it best',
]

export function isChain(name) {
  const n = (name || '').toLowerCase()
  return CHAINS.some((c) => n.includes(c))
}

export async function geocodeAddress(query) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query)
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Could not look up that address (geocoder ' + res.status + ')')
  const js = await res.json()
  if (!js.length) return null
  return { lat: +js[0].lat, lon: +js[0].lon, display: js[0].display_name }
}

const toRad = (d) => (d * Math.PI) / 180
function miles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function findHardwareStores(lat, lon, radiusMiles = 15) {
  const r = Math.round(radiusMiles * 1609)
  const q = `[out:json][timeout:25];nwr["shop"~"doityourself|hardware"]["name"](around:${r},${lat},${lon});out center 80;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(q),
  })
  if (!res.ok) throw new Error('Store lookup failed (' + res.status + ')')
  const js = await res.json()

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
    .slice(0, 10)
    .map((s) => ({ ...s, distLabel: s.dist < 10 ? s.dist.toFixed(1) + ' mi' : Math.round(s.dist) + ' mi' }))
}

export const directionsURL = (s) =>
  'https://maps.apple.com/?daddr=' + s.lat + ',' + s.lon + '&q=' + encodeURIComponent(s.name)

export const fallbackSearchURL = (address) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('hardware store near ' + address)
