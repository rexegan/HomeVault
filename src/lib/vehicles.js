// Vehicles in the garage: constants, due-date logic, and the two free federal
// (NHTSA) lookups — decode a VIN into make/model/engine, and list the recall
// campaigns issued for a make / model / year.

export const MAKES = ['Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford',
  'GMC', 'Genesis', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda',
  'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Polestar', 'Porsche', 'Ram', 'Rivian', 'Subaru', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo', 'Harley-Davidson', 'Polaris', 'Yamaha', 'Kawasaki', 'Boat / trailer', 'Other']

export const YEARS = (() => {
  const y = new Date().getFullYear() + 1
  return Array.from({ length: y - 1979 }, (_, i) => String(y - i))
})()

export const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Dual-clutch', 'Single-speed (EV)']
export const FUELS = ['Gasoline', 'Diesel', 'Hybrid', 'Plug-in hybrid', 'Electric', 'Flex fuel']
export const DRIVES = ['Front-wheel drive', 'Rear-wheel drive', 'All-wheel drive', 'Four-wheel drive']
export const OILS = ['0W-16', '0W-20', '5W-20', '5W-30', '0W-30', '0W-40', '5W-40', '10W-30', '15W-40 (diesel)', 'None — electric']
export const SHOPS = ['Dealer service department', 'Jiffy Lube', 'Valvoline Instant Oil Change', 'Discount Tire',
  'Firestone', 'Walmart Auto Care', 'Costco Tire Center', "Les Schwab", "O'Reilly / AutoZone (parts)",
  'Local mechanic', 'DIY — did it myself']
export const RECALL_STATUS = ['Open — not fixed yet', 'Scheduled with the dealer', 'Fixed']

// kind, hint for "what", and a default "next due" when you leave it blank.
export const LOG_KINDS = [
  { k: 'Oil change', hint: 'Oil type & filter, e.g. 0W-20 full synthetic', interval: { mi: 5000, months: 6 } },
  { k: 'Tire rotation & balance', hint: 'Rotated and balanced all four', interval: { mi: 7500, months: 6 } },
  { k: 'New tires', hint: 'Brand, model & size, e.g. Michelin Defender 265/70R17', interval: { mi: 50000 } },
  { k: 'Alignment', hint: 'Four-wheel alignment', interval: { months: 12 } },
  { k: 'Brakes', hint: 'Pads, rotors, fluid flush' },
  { k: 'Battery', hint: 'Brand & group size', interval: { months: 48 } },
  { k: 'Tune-up / spark plugs', hint: 'Plugs, coils, throttle body clean', interval: { mi: 30000 } },
  { k: 'Fluids & filters', hint: 'Transmission, coolant, air or cabin filter', interval: { mi: 30000 } },
  { k: 'Wipers & lights', hint: 'Blades, bulbs, headlight restore' },
  { k: 'Paint & body work', hint: 'Dent, scratch, repaint, collision repair' },
  { k: 'Detail / wash', hint: 'Wash, wax, ceramic coating, interior detail' },
  { k: 'Manufacturer recall', recall: true, hint: 'What the recall fixes' },
  { k: 'Inspection & registration', hint: 'State inspection, tags, title', interval: { months: 12 } },
  { k: 'Repair', hint: 'What broke and what fixed it' },
  { k: 'Accessories & upgrades', hint: 'Bed liner, tow hitch, lift kit, stereo…' },
  { k: 'Other', hint: '' },
]
export const KIND = Object.fromEntries(LOG_KINDS.map((x) => [x.k, x]))

export const vehicleTitle = (v) => [v.year, v.make, v.model, v.trim].filter(Boolean).join(' ') || v.nickname || 'Vehicle'

const num = (s) => { const n = parseFloat(String(s || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
export const miles = (s) => parseInt(String(s || '').replace(/\D/g, ''), 10) || 0
export const parseMDY = (s) => {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null
}
export const fmtMDY = (d) => String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + '/' + d.getFullYear()
export const cost = (s) => num(s)

// Fill "next due" from the kind's usual interval when it was left blank.
export function withDefaultDue(draft) {
  const iv = KIND[draft.kind]?.interval
  if (!iv) return draft
  const out = { ...draft }
  const mi = miles(out.mileage)
  if (iv.mi && mi && !out.nextDueMileage) out.nextDueMileage = (mi + iv.mi).toLocaleString()
  const d = parseMDY(out.date)
  if (iv.months && d && !out.nextDueDate) {
    const n = new Date(d); n.setMonth(n.getMonth() + iv.months); out.nextDueDate = fmtMDY(n)
  }
  return out
}

export function currentMileage(v) {
  return Math.max(miles(v.currentMileage), ...((v.log || []).map((e) => miles(e.mileage))), 0)
}

// What is due or coming up: the latest entry of each kind that has a next-due,
// plus registration and inspection dates.
export function dueItems(v, today) {
  const now = currentMileage(v)
  const out = []
  const latest = new Map()
  for (const e of v.log || []) {
    if (!e.nextDueMileage && !e.nextDueDate) continue
    const cur = latest.get(e.kind)
    const ts = parseMDY(e.date)?.getTime() || 0
    if (!cur || ts >= cur.ts) latest.set(e.kind, { e, ts })
  }
  for (const { e } of latest.values()) {
    const dm = miles(e.nextDueMileage), dd = parseMDY(e.nextDueDate)
    const milesLeft = dm ? dm - now : null
    const daysLeft = dd ? Math.round((dd - today) / 86400000) : null
    let state = 'ok'
    if ((milesLeft !== null && milesLeft <= 0) || (daysLeft !== null && daysLeft <= 0)) state = 'due'
    else if ((milesLeft !== null && milesLeft <= 500) || (daysLeft !== null && daysLeft <= 30)) state = 'soon'
    out.push({ key: e.kind, label: e.kind, state, milesLeft, daysLeft, dueMiles: dm, dueDate: e.nextDueDate })
  }
  for (const [k, label] of [['regExpires', 'Registration expires'], ['inspectionDue', 'Inspection due']]) {
    const dd = parseMDY(v[k])
    if (!dd) continue
    const daysLeft = Math.round((dd - today) / 86400000)
    out.push({ key: k, label, state: daysLeft <= 0 ? 'due' : daysLeft <= 30 ? 'soon' : 'ok', milesLeft: null, daysLeft, dueDate: v[k] })
  }
  const rank = { due: 0, soon: 1, ok: 2 }
  return out.sort((a, b) => rank[a.state] - rank[b.state])
}

// ── NHTSA (free, no key) ─────────────────────────────────────────────────────
const titleMake = (s) => {
  if (!s) return ''
  return s.split(/\s+/).map((w) => (w.length <= 3 ? w.toUpperCase() : w[0] + w.slice(1).toLowerCase())).join(' ')
}

export async function decodeVin(vin) {
  const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/' + encodeURIComponent(vin) + '?format=json')
  if (!res.ok) throw new Error('The VIN service did not answer.')
  const x = (await res.json()).Results?.[0]
  if (!x || !x.Make) throw new Error("That VIN didn't decode — double-check it (17 letters and numbers, no I, O or Q).")
  const eng = [x.DisplacementL && (+x.DisplacementL).toFixed(1) + 'L', x.EngineCylinders && x.EngineCylinders + '-cyl',
    x.EngineModel, x.FuelTypePrimary === 'Electric' ? 'electric motor' : ''].filter(Boolean).join(' ')
  const drive = /4WD|4x4|four/i.test(x.DriveType || '') ? 'Four-wheel drive'
    : /AWD|all/i.test(x.DriveType || '') ? 'All-wheel drive'
    : /FWD|front/i.test(x.DriveType || '') ? 'Front-wheel drive'
    : /RWD|rear/i.test(x.DriveType || '') ? 'Rear-wheel drive' : ''
  const trans = /manual/i.test(x.TransmissionStyle || '') ? 'Manual' : /cvt|continuously/i.test(x.TransmissionStyle || '') ? 'CVT'
    : /automatic/i.test(x.TransmissionStyle || '') ? 'Automatic' : ''
  return {
    year: x.ModelYear || '', make: titleMake(x.Make), model: x.Model || '', trim: x.Trim || x.Series || '',
    body: x.BodyClass || '', engine: eng, fuel: x.FuelTypePrimary || '', drive, transmission: trans,
    plant: [x.PlantCity, x.PlantState || x.PlantCountry].filter(Boolean).join(', '),
    warning: x.ErrorCode && x.ErrorCode !== '0' && !/^0(,0)*$/.test(x.ErrorCode) ? x.ErrorText : '',
  }
}

export async function fetchRecalls({ make, model, year }) {
  const q = new URLSearchParams({ make, model, modelYear: year })
  const res = await fetch('https://api.nhtsa.gov/recalls/recallsByVehicle?' + q)
  if (!res.ok) throw new Error('The recall service did not answer.')
  const j = await res.json()
  return j.results || []
}

export const NHTSA_VIN_CHECK = 'https://www.nhtsa.gov/recalls'
