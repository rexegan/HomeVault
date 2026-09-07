import { useState } from 'react'
import { warrantyStatus, formatPrice } from '../lib/storage.js'

// Everything stored, whole-house: one table with the room each item lives in.
// Every column header sorts — tap once for ascending, again for descending.
const COLS = [
  { key: 'name', label: 'Item' },
  { key: 'room', label: 'Room' },
  { key: 'vendor', label: 'Store / brand' },
  { key: 'purchaseDate', label: 'Purchased' },
  { key: 'price', label: 'Price paid', num: true },
  { key: 'warrantyExpires', label: 'Warranty expires' },
]

const priceNum = (p) => {
  const n = parseFloat(String(p || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

export default function AllItemsView({ state, today, onOpenItem }) {
  const [sort, setSort] = useState({ key: 'room', dir: 1 })
  const roomOf = (id) => state.areas.find((a) => a.id === id)?.name || ''

  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))

  const valueOf = (it, key) => {
    if (key === 'room') return roomOf(it.areaId)
    if (key === 'price') return priceNum(it.price)
    return it[key] || ''
  }

  const items = [...state.items].sort((a, b) => {
    const va = valueOf(a, sort.key), vb = valueOf(b, sort.key)
    const emptyA = va === '' || va == null, emptyB = vb === '' || vb == null
    if (emptyA && emptyB) return a.name.localeCompare(b.name)
    if (emptyA) return 1            // blanks always sink to the bottom
    if (emptyB) return -1
    let cmp
    if (typeof va === 'number') cmp = va - vb
    else cmp = String(va).localeCompare(String(vb))
    if (cmp === 0) cmp = a.name.localeCompare(b.name)
    return cmp * sort.dir
  })

  return (
    <div className="all-items">
      <div className="intake-lede">
        <h2>Everything stored</h2>
        <p>{items.length === 0
          ? 'Nothing stored yet — tap a room on the floor plan to start.'
          : `All ${items.length} things in your home. Tap a column heading to sort; tap it again to flip the order.`}</p>
      </div>

      {items.length > 0 && (
        <div className="area-table-wrap">
          <table className="area-table">
            <thead>
              <tr>
                {COLS.map((c) => (
                  <th key={c.key} className={c.num ? 'num' : ''}>
                    <button className={'th-sort' + (sort.key === c.key ? ' on' : '')}
                      onClick={() => toggle(c.key)}>
                      {c.label}
                      <span className="th-arrow">
                        {sort.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const w = warrantyStatus(it, today)
                return (
                  <tr key={it.id} onClick={() => onOpenItem(it.id)}>
                    <td className="cell-item">
                      {it.name}
                      {it.files?.length > 0 && <span className="cell-clip">📎{it.files.length}</span>}
                    </td>
                    <td>{roomOf(it.areaId) || '—'}</td>
                    <td>{it.vendor || '—'}</td>
                    <td>{it.purchaseDate ? fmt(it.purchaseDate) : '—'}</td>
                    <td className="num">{formatPrice(it.price) || '—'}</td>
                    <td>
                      {it.warrantyExpires ? (
                        <span className={'tag ' + (w?.state === 'expired' ? 'danger' : w?.state === 'soon' ? 'warn' : 'ok')}>
                          {fmt(it.warrantyExpires)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
