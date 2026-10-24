// "Your purchases" at a store: everything in the vault that was bought there —
// items in rooms, paint & flooring jobs, yard jobs and vehicle service.

const WORDS = /\b(home improvement|improvement|company|co|inc|llc|store|the)\b/g
const base = (s) => String(s || '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(WORDS, ' ').replace(/\s+/g, ' ').trim()

// "Home Depot" ≈ "The Home Depot — Burleson"; "Lowe's" ≈ "Lowe's Home Improvement".
export function sameStore(a, b) {
  const x = base(a), y = base(b)
  if (x.length < 4 || y.length < 4) return false
  return x === y || x.includes(y) || y.includes(x)
}

const num = (v) => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
const iso = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }
const mdy = (s) => { const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null }

export function purchasesAt(store, { state, finishes = {}, lawn, vehicles = [] }) {
  const rows = []
  const room = (id) => state.areas.find((a) => a.id === id)?.name || ''

  for (const it of state.items || []) {
    if (!sameStore(it.vendor, store.name)) continue
    rows.push({ id: 'i-' + it.id, itemId: it.id, date: iso(it.purchaseDate), what: it.name,
      where: room(it.areaId), detail: [it.notes, it.warrantyExpires && 'Warranty to ' + (iso(it.warrantyExpires)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) || '')].filter(Boolean).join(' · '),
      amount: num(it.price), source: 'Item' })
  }
  for (const [areaId, list] of Object.entries(finishes)) {
    for (const e of list || []) {
      if (!sameStore(e.store, store.name)) continue
      rows.push({ id: 'f-' + e.id, date: mdy(e.date), what: [e.kind, e.where && '— ' + e.where].filter(Boolean).join(' '),
        where: room(areaId), detail: [e.product, e.grade, e.colorName, e.finish, e.qty].filter(Boolean).join(' · '),
        amount: num(e.totalCost), source: 'Finish' })
    }
  }
  for (const e of lawn?.entries || []) {
    if (!sameStore(e.store, store.name)) continue
    rows.push({ id: 'l-' + e.id, date: mdy(e.date), what: [e.kind, e.product && '— ' + e.product].filter(Boolean).join(' '),
      where: e.where || 'Yard', detail: [e.brand, e.size, e.qty].filter(Boolean).join(' · '), amount: num(e.totalCost), source: 'Yard' })
  }
  for (const v of vehicles) {
    for (const e of v.log || []) {
      if (!sameStore(e.shop, store.name)) continue
      rows.push({ id: 'v-' + e.id, date: mdy(e.date), what: e.kind + (e.what ? ' — ' + e.what : ''),
        where: [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle', detail: e.mileage ? e.mileage + ' mi' : '',
        amount: num(e.totalCost), source: 'Vehicle' })
    }
  }
  rows.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0))
  return { rows, total: rows.reduce((t, r) => t + r.amount, 0) }
}
