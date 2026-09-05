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

// The US Census geocoder is the best source for rural street addresses (county
// roads etc.). It has no CORS headers, but supports JSONP.
let jsonpN = 0
function jsonp(urlNeedingCallback, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const cb = '__hvCensus' + (++jsonpN)
    const script = document.createElement('script')
    const timer = setTimeout(() => { cleanup(); reject(new Error('geocoder timeout')) }, timeoutMs)
    function cleanup() { clearTimeout(timer); delete window[cb]; script.remove() }
    window[cb] = (data) => { cleanup(); resolve(data) }
    script.onerror = () => { cleanup(); reject(new Error('geocoder script failed')) }
    script.src = urlNeedingCallback + cb
    document.head.appendChild(script)
  })
}

async function censusGeocode(query) {
  const url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress' +
    '?benchmark=Public_AR_Current&format=jsonp&address=' + encodeURIComponent(query) + '&callback='
  const data = await jsonp(url)
  const m = data?.result?.addressMatches
  if (m && m.length) {
    return { lat: m[0].coordinates.y, lon: m[0].coordinates.x, display: m[0].matchedAddress, approximate: false, usedQuery: query }
  }
  return null
}

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
  // Exact rooftop match from the Census first — it knows county roads.
  try {
    const hit = await censusGeocode(query)
    if (hit) return hit
  } catch { /* fall through to OSM */ }

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

export async function findHardwareStores(lat, lon, radiusMiles = 35) {
  // One wide fetch covers every option in the distance dropdown, so changing
  // the dropdown filters instantly with no new lookups.
  const js = await overpassQuery(lat, lon, radiusMiles)

  const seen = new Map()
  for (const el of js.elements || []) {
    const t = el.tags || {}
    const name = t.name || t.brand
    if (!name) continue
    const slat = el.lat ?? el.center?.lat
    const slon = el.lon ?? el.center?.lon
    if (slat == null || slon == null) continue
    const dist = miles(lat, lon, slat, slon)
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
    const addr = [street, t['addr:city']].filter(Boolean).join(', ')
    const fullAddr = [street, t['addr:city'], [t['addr:state'], t['addr:postcode']].filter(Boolean).join(' ')]
      .filter(Boolean).join(', ')
    // Dedupe near-identical entries (same name within ~0.3 mi), keep the closest.
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '|' + dist.toFixed(0)
    const existing = seen.get(key)
    if (!existing || dist < existing.dist) {
      seen.set(key, {
        name, dist, lat: slat, lon: slon, addr, fullAddr, chain: isChain(name),
        phone: t.phone || t['contact:phone'] || '',
        website: t.website || t['contact:website'] || t['brand:website'] || '',
        hours: t.opening_hours || '',
      })
    }
  }

  return [...seen.values()]
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 50)
    .map((s) => ({ ...s, distLabel: s.dist < 10 ? s.dist.toFixed(1) + ' mi' : Math.round(s.dist) + ' mi' }))
}

export const directionsURL = (s) =>
  'https://maps.apple.com/?daddr=' + s.lat + ',' + s.lon + '&q=' + encodeURIComponent(s.name)

export const fallbackSearchURL = (address) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('hardware store near ' + address)

export const webSearchURL = (s) =>
  'https://www.google.com/search?q=' + encodeURIComponent(s.name + ' ' + (s.addr || 'near me') + ' hours phone')

// OSM opening_hours ("Mo-Fr 06:00-21:00; Sa 07:00-20:00") → readable lines.
export function formatHours(oh) {
  if (!oh) return null
  if (/24\s*\/\s*7/.test(oh)) return ['Open 24 hours']
  const days = { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun', PH: 'Holidays', SH: 'School holidays' }
  return oh.split(/\s*;\s*/).map((part) =>
    part
      .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|SH)\b/g, (m) => days[m])
      .replace(/\boff\b/gi, 'closed')
      .trim()
  ).filter(Boolean)
}
