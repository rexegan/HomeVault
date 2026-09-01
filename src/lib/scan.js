// Snap & File: on-device receipt reading. The photo never leaves the browser —
// tesseract.js (WASM OCR) is lazy-loaded only when the user scans something,
// then heuristics pull out the store, date, total, and a guess at what was
// bought and which room it belongs in.

let workerPromise = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) => createWorker('eng'))
  }
  return workerPromise
}

export async function ocrImage(file, onProgress) {
  const worker = await getWorker()
  if (onProgress) onProgress('Reading the photo…')
  const { data } = await worker.recognize(file)
  return data.text || ''
}

// Well-known stores help vendor detection beat the OCR noise.
const KNOWN_STORES = [
  'home depot', 'lowes', "lowe's", 'costco', 'walmart', 'target', 'best buy',
  'amazon', 'ace hardware', 'sams club', "sam's club", 'ikea', 'menards',
  'tractor supply', 'harbor freight', 'sherwin williams', 'floor & decor',
  'bed bath', 'wayfair', 'apple', 'kroger', 'heb', 'h-e-b', 'publix',
]

// Keywords → what it probably is and where it probably lives.
// First match wins, so more specific phrases come first.
const PRODUCT_HINTS = [
  ['refrigerator|fridge', 'Refrigerator', 'Kitchen', 'appliance'],
  ['dishwasher', 'Dishwasher', 'Kitchen', 'appliance'],
  ['microwave', 'Microwave', 'Kitchen', 'appliance'],
  ['range|cooktop|oven|stove', 'Range / Oven', 'Kitchen', 'appliance'],
  ['washer|washing machine', 'Washer', 'Laundry Room', 'appliance'],
  ['dryer', 'Dryer', 'Laundry Room', 'appliance'],
  ['water heater', 'Water Heater', '2-Car Garage', 'appliance'],
  ['furnace|hvac|heat pump|air condition|condenser', 'HVAC Equipment', '2-Car Garage', 'appliance'],
  ['televis|smart tv|\\btv\\b|soundbar|receiver', 'TV / Media', 'Great Room', 'appliance'],
  ['sofa|couch|sectional|recliner', 'Sofa', 'Great Room', 'appliance'],
  ['mattress|bed frame|headboard', 'Mattress / Bed', 'Primary Bedroom', 'appliance'],
  ['mower|trimmer|blower|chainsaw|edger', 'Lawn Equipment', 'Storage Shed', 'appliance'],
  ['pool pump|pool filter|chlorin|pool heater', 'Pool Equipment', 'Swimming Pool', 'appliance'],
  ['grill|smoker', 'Grill', 'Backyard', 'appliance'],
  ['drill|saw|sander|tool|compressor', 'Power Tool', '2-Car Garage', 'appliance'],
  ['paint|primer|stain', 'Paint', '2-Car Garage', 'other'],
  ['faucet|toilet|vanity|shower', 'Bath Fixture', 'Primary Bath', 'other'],
  ['dining table|dining set', 'Dining Table', 'Dining Room', 'appliance'],
  ['desk|monitor|printer|laptop|computer', 'Office Equipment', 'Study', 'appliance'],
  ['floor|carpet|tile|vinyl plank', 'Flooring', 'Great Room', 'other'],
  ['roof|shingle', 'Roofing', 'Backyard', 'document'],
]

// Parse OCR text into a best-effort prefill for the item form.
export function parseReceipt(text) {
  const raw = text.replace(/\r/g, '')
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const lower = raw.toLowerCase()

  // --- vendor: a known store anywhere, else the first line with letters ---
  let vendor = ''
  for (const s of KNOWN_STORES) {
    if (lower.includes(s)) {
      vendor = s.replace(/\b\w/g, (c) => c.toUpperCase()).replace("'S", "'s")
      break
    }
  }
  if (!vendor) {
    const first = lines.find((l) => /[a-zA-Z]{3,}/.test(l) && l.length <= 40)
    if (first) vendor = first.replace(/[^\w &'.-]/g, ' ').replace(/\s+/g, ' ').trim()
  }

  // --- date: mm/dd/yy(yy), mm-dd-yyyy, or "Jan 5, 2026" ---
  let purchaseDate = ''
  const mdY = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/)
  const monName = raw.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i)
  if (mdY) {
    let [, m, d, y] = mdY
    if (y.length === 2) y = (Number(y) > 50 ? '19' : '20') + y
    const mm = String(m).padStart(2, '0'), dd = String(d).padStart(2, '0')
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      purchaseDate = `${y}-${mm}-${dd}`
    }
  } else if (monName) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const m = months.indexOf(monName[1].toLowerCase().slice(0, 3)) + 1
    purchaseDate = `${monName[3]}-${String(m).padStart(2, '0')}-${String(monName[2]).padStart(2, '0')}`
  }

  // --- total: prefer a line that says total; else the largest money amount ---
  let price = ''
  const money = (s) => [...s.matchAll(/\$?\s?(\d[\d,]*\.\d{2})\b/g)].map((m) => parseFloat(m[1].replace(/,/g, '')))
  const totalLine = lines.find((l) => /total/i.test(l) && !/sub\s?total|tax/i.test(l))
  const candidates = totalLine ? money(totalLine) : []
  const all = money(raw)
  const chosen = candidates.length ? Math.max(...candidates) : (all.length ? Math.max(...all) : null)
  if (chosen != null && chosen > 0) price = '$' + chosen.toLocaleString(undefined, { minimumFractionDigits: 2 })

  // --- what is it & where does it go ---
  let name = '', room = '', category = 'receipt'
  for (const [pattern, label, hintRoom, cat] of PRODUCT_HINTS) {
    if (new RegExp(pattern, 'i').test(lower)) { name = label; room = hintRoom; category = cat; break }
  }
  if (!name) name = vendor ? vendor + ' purchase' : 'Receipt'

  return { vendor, purchaseDate, price, name, room, category, textSample: lines.slice(0, 12).join('\n') }
}
