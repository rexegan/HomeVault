// Replacement forecast: what in the house will need replacing, when, and about
// what it will cost. Built from things you already entered — item purchase dates
// & prices, and the paint / flooring history — plus typical lifespans.
//
// Lifespans are rules of thumb for normal use, not predictions: a well-kept
// water heater can outlast them and a hard-worked one won't reach them.

// [regex on the name, typical years, label]
const ITEM_LIFE = [
  [/tankless/i, 20],
  [/water heater/i, 10],
  [/furnace|boiler/i, 18],
  [/a\/c|\bac\b|air condition|condenser|heat pump|hvac/i, 15],
  [/thermostat/i, 10],
  [/refrigerator|fridge/i, 13],
  [/freezer/i, 15],
  [/range|stove|oven|cooktop/i, 15],
  [/dishwasher/i, 10],
  [/microwave/i, 9],
  [/vent hood|range hood/i, 14],
  [/disposal/i, 12],
  [/ice maker|wine (fridge|cooler)/i, 10],
  [/washer|washing machine/i, 11],
  [/dryer/i, 13],
  [/water softener|softener|water filter|reverse osmosis/i, 12],
  [/sump pump/i, 8],
  [/garage door opener|opener/i, 12],
  [/garage door/i, 25],
  [/ceiling fan/i, 15],
  [/tv\b|television/i, 8],
  [/soundbar|speaker|receiver/i, 10],
  [/router|modem|mesh/i, 5],
  [/mattress/i, 9],
  [/sofa|couch|sectional|recliner/i, 10],
  [/pool pump/i, 10],
  [/pool heater/i, 10],
  [/robotic|pool cleaner/i, 5],
  [/pool cover/i, 8],
  [/generator/i, 15],
  [/mower|trimmer|blower|edger/i, 10],
  [/grill|smoker/i, 10],
  [/irrigation|sprinkler|controller/i, 10],
  [/smoke|carbon monoxide|co detector/i, 10],
  [/camera|doorbell|security/i, 7],
  [/ev charger|charger/i, 12],
  [/air compressor|compressor/i, 12],
  [/exercise|treadmill|peloton|elliptical/i, 10],
  [/desk|monitor|printer|laptop|computer/i, 6],
  [/patio furniture/i, 8],
  [/chandelier|light fixture/i, 25],
  [/faucet/i, 15],
]

// Paint / flooring / countertop history entries.
function finishLife(e) {
  const kind = e.kind || ''
  const text = ((e.finish || '') + ' ' + (e.product || '') + ' ' + (e.colorName || '')).toLowerCase()
  if (kind === 'Paint') return /ceiling/i.test(e.where || '') ? 12 : /trim|cabinet/i.test(e.where || '') ? 10 : 8
  if (kind === 'Flooring') {
    if (/carpet/.test(text)) return 10
    if (/vinyl|lvp|lvt|luxury/.test(text)) return 20
    if (/tile|stone|porcelain/.test(text)) return 40
    if (/hardwood|oak|maple/.test(text)) return 30
    if (/laminate/.test(text)) return 15
    return 15
  }
  if (kind === 'Wallpaper') return 10
  if (kind === 'Tile / backsplash') return 30
  if (kind === 'Countertops') return /laminate|formica/.test(text) ? 15 : 30
  if (kind === 'Trim / molding') return 40
  if (kind === 'Hardware') return 20
  return null
}

const num = (v) => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
const parseMDY = (s) => {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null
}
const parseISO = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
export const INFLATION = 0.03

// → { rows, skipped }
//   row: { id, name, room, source, bought, price, life, replaceOn, yearsLeft, estCost, past }
export function buildForecast({ state, finishes = {}, today }) {
  const rows = []
  let skipped = 0
  const roomName = (areaId) => state.areas.find((a) => a.id === areaId)?.name || ''
  const add = (r) => {
    const yearsAge = (today - r.bought) / (365.25 * 86400000)
    const replaceOn = new Date(r.bought)
    replaceOn.setFullYear(replaceOn.getFullYear() + r.life)
    const yearsLeft = r.life - yearsAge
    const base = r.price
    // Cost then = what it cost, bumped for ~3% a year price creep.
    const estCost = base ? Math.round(base * Math.pow(1 + INFLATION, Math.max(r.life, 0))) : 0
    rows.push({ ...r, yearsAge, replaceOn, yearsLeft, estCost, past: yearsLeft <= 0 })
  }

  for (const it of state.items || []) {
    const bought = parseISO(it.purchaseDate)
    const rule = ITEM_LIFE.find(([re]) => re.test(it.name || ''))
    if (!rule || !bought) { if (rule || it.category === 'appliance') skipped++; continue }
    add({ id: 'i-' + it.id, name: it.name, room: roomName(it.areaId), source: 'item',
      bought, price: num(it.price), life: rule[1] })
  }
  for (const [areaId, list] of Object.entries(finishes)) {
    for (const e of list || []) {
      const bought = parseMDY(e.date)
      const life = finishLife(e)
      if (!bought || !life) continue
      const what = [e.kind, e.where && '— ' + e.where].filter(Boolean).join(' ')
      add({ id: 'f-' + e.id, name: what + (e.colorName ? ' (' + e.colorName + ')' : ''),
        room: roomName(areaId), source: 'finish', bought, price: num(e.totalCost), life })
    }
  }
  rows.sort((a, b) => a.replaceOn - b.replaceOn)
  return { rows, skipped }
}

// Bucket rows for display.
export function bucketForecast(rows) {
  const b = [
    { key: 'past', title: 'Past typical life', hint: 'Not necessarily broken — just worth watching and budgeting for.', rows: [] },
    { key: 'y1', title: 'Within a year', rows: [] },
    { key: 'y3', title: '1 – 3 years', rows: [] },
    { key: 'y5', title: '3 – 5 years', rows: [] },
    { key: 'y5p', title: 'More than 5 years out', rows: [] },
  ]
  for (const r of rows) {
    const t = r.past ? 0 : r.yearsLeft <= 1 ? 1 : r.yearsLeft <= 3 ? 2 : r.yearsLeft <= 5 ? 3 : 4
    b[t].rows.push(r)
  }
  return b.filter((x) => x.rows.length)
}
