// County / City: what jurisdiction the home is actually in. The US Census
// "geographies" service resolves an address to its official city (or
// unincorporated area), county, school district and districts — free, no key.

let n = 0
function jsonp(urlNeedingCallback, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const cb = '__hvCivic' + (++n)
    const script = document.createElement('script')
    const timer = setTimeout(() => { cleanup(); reject(new Error('lookup timeout')) }, timeoutMs)
    function cleanup() { clearTimeout(timer); delete window[cb]; script.remove() }
    window[cb] = (data) => { cleanup(); resolve(data) }
    script.onerror = () => { cleanup(); reject(new Error('lookup failed')) }
    script.src = urlNeedingCallback + cb
    document.head.appendChild(script)
  })
}

const BASE = 'https://geocoding.geo.census.gov/geocoder/geographies/'
const TAIL = '&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=jsonp&callback='

function parseGeos(geos, matchedAddress) {
  const pick = (frag) => {
    const key = Object.keys(geos || {}).find((k) => k.toLowerCase().includes(frag))
    return key ? geos[key]?.[0] : null
  }
  const county = pick('counties')
  const place = pick('incorporated places')
  const subdiv = pick('county subdivisions')
  const school = pick('unified school districts')
  const congress = pick('congressional')
  const tract = pick('census tracts')
  return {
    matchedAddress: matchedAddress || '',
    city: place?.NAME || null,                       // null → unincorporated
    countyName: county?.NAME || null,
    state: county?.STATE ? null : null,
    subdivision: subdiv?.NAME || null,
    schoolDistrict: school?.NAME || null,
    congressional: congress?.NAME || null,
    tract: tract?.NAME || null,
  }
}

export async function lookupJurisdiction(address, fallbackCoords) {
  try {
    const data = await jsonp(BASE + 'onelineaddress?address=' + encodeURIComponent(address) + TAIL)
    const m = data?.result?.addressMatches?.[0]
    if (m) return parseGeos(m.geographies, m.matchedAddress)
  } catch { /* fall through */ }
  if (fallbackCoords?.lat) {
    const data = await jsonp(BASE + `coordinates?x=${fallbackCoords.lon}&y=${fallbackCoords.lat}` + TAIL)
    const geos = data?.result?.geographies
    if (geos) return parseGeos(geos, address)
  }
  return null
}

// Useful local-government resources, aimed by county/city name.
export function civicLinks(j, stateName) {
  const g = (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q)
  const county = j.countyName ? j.countyName + (stateName ? ', ' + stateName : '') : ''
  const cityOrCounty = j.city || j.countyName || ''
  const links = []
  if (j.countyName) {
    links.push(
      ['🏛️', j.countyName + ' Appraisal District', 'Your property record, appraised value, and exemptions (homestead!).', g(county + ' appraisal district property search')],
      ['💰', 'Property tax office', 'Tax statements, payment, and due dates.', g(county + ' tax assessor collector property tax')],
      ['📜', 'County clerk — deeds & records', 'Your deed, plats, and recorded documents.', g(county + ' county clerk deed records search')],
      ['🔥', 'Burn ban & emergency status', 'Current burn ban and county alerts.', g(county + ' burn ban status')],
    )
  }
  if (cityOrCounty) {
    links.push(
      ['🏗️', 'Permits & inspections', 'Building permits for remodels, roofs, pools and fences.', g(cityOrCounty + (stateName ? ' ' + stateName : '') + ' building permits')],
      ['🗑️', 'Trash & recycling', 'Pickup days and bulk-item rules.', g(cityOrCounty + (stateName ? ' ' + stateName : '') + ' trash recycling pickup schedule')],
      ['🚰', 'Water utility', 'Service, outages and billing.', g(cityOrCounty + (stateName ? ' ' + stateName : '') + ' water utility')],
    )
  }
  if (j.schoolDistrict) {
    links.push(['🎒', j.schoolDistrict, 'Schools, zoning and calendars for your address.', g(j.schoolDistrict)])
  }
  links.push(['🗳️', 'Voter & elections info', 'Registration, precinct and sample ballots.', g(county ? county + ' elections voter registration' : 'county elections voter registration')])
  return links
}
