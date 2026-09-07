// Pool Profile helpers: find the pool companies within ~25 miles of the home so
// "who built your pool" is a dropdown of real local builders — and picking one
// brings its full details along.

const toRad = (d) => (d * Math.PI) / 180
function miles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function fetchPoolCompanies(lat, lon, radiusMiles = 25) {
  const r = Math.round(radiusMiles * 1609)
  const q = `[out:json][timeout:20];nwr["shop"~"pool"](around:${r},${lat},${lon});out center 60;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(q),
  })
  if (!res.ok) throw new Error('pool lookup ' + res.status)
  const js = await res.json()
  const seen = new Map()
  for (const el of js.elements || []) {
    const t = el.tags || {}
    const name = t.name
    const slat = el.lat ?? el.center?.lat, slon = el.lon ?? el.center?.lon
    if (!name || slat == null) continue
    const dist = miles(lat, lon, slat, slon)
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
    const existing = seen.get(name)
    if (!existing || dist < existing.dist) {
      seen.set(name, {
        name, dist, lat: slat, lon: slon,
        addr: [street, t['addr:city']].filter(Boolean).join(', '),
        fullAddr: [street, t['addr:city'], [t['addr:state'], t['addr:postcode']].filter(Boolean).join(' ')].filter(Boolean).join(', '),
        street, city: t['addr:city'] || '', state: t['addr:state'] || '', zip: t['addr:postcode'] || '',
        phone: t.phone || t['contact:phone'] || '',
        website: t.website || t['contact:website'] || '',
        hours: t.opening_hours || '',
      })
    }
  }
  return [...seen.values()].sort((a, b) => a.dist - b.dist).slice(0, 20)
    .map((c) => ({ ...c, distLabel: c.dist.toFixed(1) + ' mi' }))
}

export const POOL_TYPES = ['Play pool', 'Diving pool', 'Sports pool (dual depth)',
  'Lap pool', 'Freeform', 'Geometric', 'Infinity / negative edge',
  'Cocktail pool / spool', 'Above-ground', 'Other']
export const POOL_SURFACES = ['White plaster', 'Colored plaster', 'Pebble (PebbleTec)',
  'Quartz', 'Tile', 'Fiberglass', 'Vinyl liner', 'Other']
export const POOL_SANITIZERS = ['Chlorine', 'Saltwater', 'Mineral / ozone', 'Other']
export const POOL_GALLONS = ['8,000', '10,000', '12,000', '15,000', '18,000',
  '20,000', '25,000', '30,000', '35,000', '40,000+']
