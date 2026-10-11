// Utility-provider shortlists for the Financial tab's Utilities section.
//
// Honest by design: who serves a given house is decided by its exact parcel
// (city limits, co-op territory, water district), and no free service lists that
// for an arbitrary address. So each category shows the providers that really
// serve the home's area first ("Serves your area"), then the best-known others,
// and points to the official page that can confirm coverage at the exact address.
// The Johnson County, Texas entries were checked against the providers' own
// sites and the City of Cleburne's pages.

const g = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + q) // straight to the official page

export function parseLocation(address, civic) {
  const a = (address || civic?.matchedAddress || '').trim()
  const m = a.match(/,\s*([^,]+?)\s*,\s*([A-Za-z]{2})\b\s*(\d{5})?/)
  const city = civic?.city || (m ? m[1].replace(/\b\w/g, (c) => c.toUpperCase()) : '')
  const state = m ? m[2].toUpperCase() : ''
  const zip = m?.[3] || (a.match(/\b(\d{5})\b/) || [])[1] || ''
  let county = (civic?.countyName || '').replace(/\s+County$/i, '')
  // Before the County/City tab has been opened, recognise Johnson County, TX
  // from the mailing city / ZIP so the local providers still show up.
  if (!county && state === 'TX' &&
      (/^cleburne$/i.test(m?.[1] || '') || JOHNSON_ZIPS.includes(zip))) county = 'Johnson'
  return {
    city,
    mailingCity: m ? m[1] : '',
    civicKnown: !!civic?.countyName,
    inCityLimits: !!civic?.city,          // civicKnown && !inCityLimits → unincorporated
    county, state, zip,
  }
}

const JOHNSON_ZIPS = ['76031', '76033', '76058', '76059', '76050', '76044', '76093']

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')

// ── Category definitions ─────────────────────────────────────────────────────
// Each option: { name, url, note, local } — local entries sort into "Serves your area".

const SECURITY = [
  ['ADT', 'https://www.adt.com', 'Largest professional monitoring company'],
  ['Vivint', 'https://www.vivint.com', 'Smart-home + monitoring'],
  ['SimpliSafe', 'https://simplisafe.com', 'DIY, no contract option'],
  ['Ring', 'https://ring.com', 'Alarm + cameras, Amazon'],
  ['Brinks Home', 'https://brinkshome.com', 'Professional monitoring'],
  ['Frontpoint', 'https://www.frontpointsecurity.com', 'Monitored DIY systems'],
  ['Cove', 'https://www.covesmart.com', 'Low-cost monitoring'],
  ['Abode', 'https://goabode.com', 'DIY smart-home hub'],
  ['Arlo', 'https://www.arlo.com', 'Cameras + monitoring'],
  ['Wyze', 'https://www.wyze.com', 'Budget DIY sensors & cameras'],
].map(([name, url, note]) => ({ name, url, note }))

const TX_RETAIL_ELECTRIC = [
  ['TXU Energy', 'https://www.txu.com'],
  ['Reliant', 'https://www.reliant.com'],
  ['Direct Energy', 'https://www.directenergy.com'],
  ['Green Mountain Energy', 'https://www.greenmountainenergy.com'],
  ['Gexa Energy', 'https://www.gexaenergy.com'],
  ['Constellation', 'https://www.constellation.com'],
  ['4Change Energy', 'https://www.4changeenergy.com'],
  ['Frontier Utilities', 'https://www.frontierutilities.com'],
  ['Rhythm Energy', 'https://www.gotrhythm.com'],
  ['Champion Energy', 'https://www.championenergyservices.com'],
].map(([name, url]) => ({ name, url, note: 'Retail plan — compare on Power to Choose' }))

const US_ELECTRIC = [
  ['Duke Energy', 'https://www.duke-energy.com'],
  ['Florida Power & Light', 'https://www.fpl.com'],
  ['Georgia Power', 'https://www.georgiapower.com'],
  ['Dominion Energy', 'https://www.dominionenergy.com'],
  ['Southern California Edison', 'https://www.sce.com'],
  ['Pacific Gas & Electric', 'https://www.pge.com'],
  ['Xcel Energy', 'https://www.xcelenergy.com'],
  ['Entergy', 'https://www.entergy.com'],
  ['American Electric Power', 'https://www.aep.com'],
  ['ComEd', 'https://www.comed.com'],
].map(([name, url]) => ({ name, url, note: 'Large regional utility — confirm it serves you' }))

const PROPANE = [
  ['Ferrellgas', 'https://www.ferrellgas.com'],
  ['AmeriGas', 'https://www.amerigas.com'],
  ['Suburban Propane', 'https://www.suburbanpropane.com'],
  ['Blossman Gas', 'https://www.blossmangas.com'],
  ['Blue Rhino (cylinder exchange)', 'https://www.bluerhino.com'],
].map(([name, url]) => ({ name, url, note: 'Propane delivery — confirm they deliver to you' }))

const NATIONAL_TRASH = [
  ['Waste Management', 'https://www.wm.com'],
  ['Republic Services', 'https://www.republicservices.com'],
  ['Waste Connections', 'https://www.wasteconnections.com'],
  ['GFL Environmental', 'https://gflenv.com'],
].map(([name, url]) => ({ name, url, note: 'National hauler — confirm service at your address' }))

const NATIONAL_INTERNET = [
  ['Starlink', 'https://www.starlink.com', 'Satellite — works almost anywhere'],
  ['T-Mobile Home Internet', 'https://www.t-mobile.com/home-internet', '5G home internet, select areas'],
  ['Verizon Home Internet', 'https://www.verizon.com/home/internet/', 'Fios / 5G Home, select areas'],
  ['Viasat', 'https://www.viasat.com', 'Satellite'],
  ['HughesNet', 'https://www.hughesnet.com', 'Satellite'],
  ['Xfinity', 'https://www.xfinity.com', 'Cable'],
  ['Spectrum', 'https://www.spectrum.com', 'Cable'],
  ['AT&T Internet', 'https://www.att.com/internet/', 'Fiber / DSL / Internet Air'],
].map(([name, url, note]) => ({ name, url, note }))

// ── The lookup ───────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { key: 'electric', label: 'Electric provider' },
  { key: 'gas', label: 'Gas / propane provider' },
  { key: 'water', label: 'Water / sewer provider' },
  { key: 'trash', label: 'Trash pickup provider' },
  { key: 'internet', label: 'Internet provider' },
  { key: 'security', label: 'Security / monitoring provider' },
]

export function providerOptions(cat, loc) {
  const where = loc.city || loc.mailingCity || 'your area'
  const isTX = loc.state === 'TX'
  const johnson = isTX && /^johnson$/i.test(loc.county)
  // City-run services only count as "serving you" when the address is not known
  // to be outside the city limits.
  const inCity = !(loc.civicKnown && !loc.inCityLimits)
  const cleburne = johnson && /cleburne/i.test(loc.city || loc.mailingCity) && inCity
  const cleburneArea = johnson && /cleburne/i.test(loc.city || loc.mailingCity)
  const L = (o) => ({ ...o, local: true })
  let list = []
  let check = null   // { label, url } official page to confirm coverage at the exact address

  if (cat === 'electric') {
    if (johnson) {
      list.push(
        L({ name: 'Oncor Electric Delivery', url: 'https://www.oncor.com',
          note: 'Wires & outages in Cleburne — you pick a retail plan on top' }),
        L({ name: 'United Cooperative Services', url: 'https://ucs.net',
          note: 'Co-op for much of rural Johnson County — members buy power directly' }),
      )
    }
    list = list.concat(isTX ? TX_RETAIL_ELECTRIC : US_ELECTRIC)
    check = isTX
      ? { label: 'Power to Choose — compare plans by ZIP (state-run)', url: 'https://www.powertochoose.org' }
      : { label: 'Find your electric utility', url: g((loc.state ? loc.state + ' ' : '') + 'public utility commission find my electric provider') }
  }

  if (cat === 'gas') {
    if (cleburne) list.push(L({ name: 'Atmos Energy', url: 'https://www.atmosenergy.com',
      note: 'Natural gas utility for the City of Cleburne' }))
    else if (isTX) list.push({ name: 'Atmos Energy', url: 'https://www.atmosenergy.com',
      note: cleburneArea ? 'Natural gas utility for Cleburne — rural parcels may have no gas main' : 'Natural gas utility across much of North Texas' })
    list = list.concat(PROPANE)
    if (isTX) list.push(
      { name: 'CenterPoint Energy', url: 'https://www.centerpointenergy.com', note: 'Natural gas — Houston area' },
      { name: 'Texas Gas Service', url: 'https://www.texasgasservice.com', note: 'Natural gas — Austin, El Paso & others' })
    check = { label: 'Is there a gas main on your street? Ask your utility', url: g(where + ' ' + (loc.state || '') + ' natural gas service provider') }
  }

  if (cat === 'water') {
    const city = loc.city || loc.mailingCity
    if (cleburne) list.push(L({ name: 'City of Cleburne — Water & Wastewater', url: 'https://www.cleburne.net/296/Water-and-Wastewater-Services',
      note: 'Inside city limits (and some nearby areas)' }))
    else if (city) list.push({ name: 'City of ' + city + ' water & sewer', url: g('City of ' + city + ' ' + loc.state + ' water utility billing'),
      note: 'If you are inside city limits' })
    if (johnson) list.push(
      L({ name: 'Johnson County Special Utility District', url: 'https://www.jcsud.com', note: 'Rural water — much of Johnson County' }),
      L({ name: 'Bethesda Water Supply Corporation', url: 'https://bethesdawatersupply.com/', note: 'Rural water supplier' }),
      L({ name: 'Parker Water Supply Corporation', url: 'https://www.parkerwsc.com/', note: 'Rural water supplier, Cleburne area' }),
      L({ name: 'Undine Texas', url: g('Undine Texas water utility Johnson County'), note: 'Water utility with a service area near Cleburne' }),
    )
    list.push(
      { name: 'Private well (no water bill)', url: '', note: 'Well water — your groundwater district may need a permit' },
      { name: 'Septic system (no sewer bill)', url: '', note: 'Typical when there is no city sewer' },
    )
    check = isTX
      ? { label: 'Texas PUC map — which water company holds your address', url: 'https://www.puc.texas.gov/industry/water/utilities/map.aspx' }
      : { label: 'Find your water utility', url: g((city || where) + ' ' + (loc.state || '') + ' water utility who is my water provider') }
  }

  if (cat === 'trash') {
    const city = loc.city || loc.mailingCity
    if (cleburne) list.push(L({ name: 'City of Cleburne Solid Waste', url: 'https://www.cleburne.net/182/Trash-and-Recycling',
      note: 'City-run, billed with water — inside city limits only' }))
    else if (city) list.push({ name: 'City of ' + city + ' sanitation', url: g('City of ' + city + ' ' + loc.state + ' trash pickup residential'),
      note: 'If you are inside city limits' })
    if (johnson) list.push(
      L({ name: 'Parker Waste Services', url: 'https://www.parkerwasteservices.com/johnson-county', note: 'Weekly service across Johnson County' }),
      L({ name: 'Sundance Disposal Solutions', url: 'https://sundancedisposal.com', note: 'Residential pickup in the Godley / Joshua area' }),
      L({ name: 'Frontier Waste Solutions', url: 'https://frontierwaste.com', note: 'City of Godley service' }),
    )
    list = list.concat(NATIONAL_TRASH)
    check = { label: 'Who picks up trash at your address?', url: g((city || where) + ' ' + (loc.state || '') + ' residential trash pickup who services my address') }
  }

  if (cat === 'internet') {
    if (cleburne) list.push(
      L({ name: 'AT&T Fiber', url: 'https://www.att.com/local/texas/cleburne', note: 'Fiber in parts of Cleburne — check by address' }),
      L({ name: 'United Cooperative Services Fiber', url: 'https://ucs.net', note: 'Co-op fiber — partial footprint, check by address' }),
    )
    const natl = NATIONAL_INTERNET.filter((o) => !(cleburne && /at&t/i.test(o.name)))
    list = list.concat(natl)
    check = { label: 'FCC National Broadband Map — what is available at your address', url: 'https://broadbandmap.fcc.gov' }
  }

  if (cat === 'security') {
    list = SECURITY.slice()
    list.push({ name: 'Local alarm company', url: '', note: 'Independent installer — search "alarm company near me"' })
  }

  // De-duplicate by name, local entries first, then cap at the top 10 (+ extras flagged local).
  const seen = new Set()
  const out = []
  for (const o of [...list.filter((x) => x.local), ...list.filter((x) => !x.local)]) {
    const k = norm(o.name)
    if (seen.has(k)) continue
    seen.add(k); out.push(o)
  }
  const locals = out.filter((o) => o.local)
  const rest = out.filter((o) => !o.local)
  const room = Math.max(10 - locals.length, 0)
  const keepRest = rest.filter((o) => !o.url).concat(rest.filter((o) => o.url).slice(0, room))
  // preserve original order of rest
  const restOrdered = rest.filter((o) => keepRest.includes(o))
  return { options: [...locals, ...restOrdered], check, where, isLocal: locals.length > 0 }
}

export function findProvider(cat, loc, name) {
  const { options } = providerOptions(cat, loc)
  const n = norm(name)
  return options.find((o) => norm(o.name) === n) || null
}
