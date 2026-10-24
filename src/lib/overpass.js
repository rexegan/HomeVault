// One reliable way to ask OpenStreetMap's map data a question.
//
// 1. Overpass (the main service) is tried first — it's the richest. It is often busy
//    or refuses a network that has asked too much, so two backup servers are tried,
//    each with a short time limit, and a server that fails is skipped for 10 minutes.
// 2. If every Overpass server fails, Nominatim (OpenStreetMap's search service,
//    which answers even when Overpass won't) is used instead.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
// Servers that just failed are skipped for a while — remembered across screens and visits.
const BAD_KEY = 'homevault:overpass-bad'
const badUntil = new Map()
try { for (const [u, t] of Object.entries(JSON.parse(localStorage.getItem(BAD_KEY) || '{}'))) if (t > Date.now()) badUntil.set(u, t) } catch { /* ignore */ }
const markBad = (url) => {
  badUntil.set(url, Date.now() + 10 * 60000)
  try { localStorage.setItem(BAD_KEY, JSON.stringify(Object.fromEntries(badUntil))) } catch { /* ignore */ }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function overpassPost(query, { timeoutMs = 7000 } = {}) {
  let lastErr
  for (const url of ENDPOINTS) {
    if ((badUntil.get(url) || 0) > Date.now()) continue
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: ctl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) { lastErr = new Error('overpass ' + res.status); markBad(url); continue }
      const js = await res.json()
      if (js.remark && /timed out|runtime error|out of memory/i.test(js.remark) && !(js.elements || []).length) {
        lastErr = new Error(js.remark); continue
      }
      return js
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      markBad(url)
    }
  }
  throw lastErr || new Error('overpass unavailable')
}

// Backup source: Nominatim searches, returned in the same shape Overpass uses
// ({ elements: [{ lat, lon, tags }] }) so the callers don't care which answered.
export async function nominatimElements(lat, lon, radiusMiles, queries, keep) {
  const dLat = radiusMiles / 69
  const dLon = radiusMiles / (69 * Math.cos((lat * Math.PI) / 180))
  const box = [lon - dLon, lat + dLat, lon + dLon, lat - dLat].map((n) => n.toFixed(4)).join(',')
  const out = []
  let first = true
  for (const q of queries) {
    if (!first) await sleep(1100)            // Nominatim asks for one request a second
    first = false
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&bounded=1&limit=40&addressdetails=1&extratags=1&countrycodes=us' +
        '&viewbox=' + box + '&q=' + encodeURIComponent(q)
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) continue
      for (const r of await res.json()) {
        if (!keep(r)) continue
        const a = r.address || {}, x = r.extratags || {}
        out.push({
          lat: +r.lat, lon: +r.lon,
          tags: {
            name: r.name || '', [r.category]: r.type,
            'addr:housenumber': a.house_number || '', 'addr:street': a.road || '',
            'addr:city': a.city || a.town || a.village || a.hamlet || '', 'addr:state': a.state || '', 'addr:postcode': a.postcode || '',
            phone: x.phone || x['contact:phone'] || '', website: x.website || x['contact:website'] || '', opening_hours: x.opening_hours || '',
          },
        })
      }
    } catch { /* try the next search */ }
  }
  return out
}
