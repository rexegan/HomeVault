import { useMemo } from 'react'
import { Icon } from '../lib/icons.jsx'
import { ZONES, CATEGORIES } from '../lib/defaults.js'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'
import { homeFacts } from '../lib/intake.js'

// A clean, printable home inventory — good for insurance or personal records.
// "Print / Save as PDF" uses the browser's own print dialog (works on iPad too).
export default function ReportView({ state, today, profile, onOpenAllItems, onOpenRooms, onOpenExpiring, onOpenArea, onOpenItem }) {
  const home = homeFacts(profile)
  const summary = useMemo(() => {
    let value = 0, active = 0, soon = 0, expired = 0
    for (const it of state.items) {
      const n = parsePrice(it.price)
      if (n) value += n
      const w = warrantyStatus(it, today)
      if (w?.state === 'ok') active++
      else if (w?.state === 'soon') soon++
      else if (w?.state === 'expired') expired++
    }
    return { value, active, soon, expired }
  }, [state, today])

  const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const areasWithItems = state.areas.filter((a) => itemsForArea(state, a.id).length > 0)

  return (
    <div className="report">
      <div className="report-toolbar no-print">
        <div className="hint">This page is formatted for printing. Use “Print / Save as PDF” to keep a copy.</div>
        <button className="btn" onClick={() => window.print()}><Icon.file size={18} /> Print / Save as PDF</button>
      </div>

      <div className="report-doc">
        <div className="report-head">
          <div className="report-title">
            <Icon.house size={26} />
            <div>
              <h1>Home Inventory</h1>
              {home.name && <div className="report-addr">{home.name}</div>}
              <div className="report-date">
                {home.facts.length > 0 ? home.facts.join(' · ') + ' · ' : ''}Generated {dateStr} · HomeVault
              </div>
            </div>
          </div>
        </div>

        <div className="report-summary">
          <SumCell n={state.items.length} l="Items" onClick={onOpenAllItems} />
          <SumCell n={areasWithItems.length} l="Areas in use" onClick={onOpenRooms} />
          <SumCell n={summary.value ? money(summary.value) : '—'} l="Estimated value" onClick={onOpenAllItems} />
          <SumCell n={summary.active} l="Warranties active" onClick={onOpenExpiring} />
          <SumCell n={summary.soon} l="Expiring soon" onClick={onOpenExpiring} />
          <SumCell n={summary.expired} l="Expired" onClick={onOpenExpiring} />
        </div>

        {areasWithItems.length === 0 && (
          <p className="report-empty">No items have been added yet. Add warranties, receipts and
            appliances to your rooms and they'll appear here.</p>
        )}

        {ZONES.map((zone) => {
          const zoneAreas = areasWithItems.filter((a) => a.zone === zone.id)
          if (zoneAreas.length === 0) return null
          return (
            <div className="report-zone" key={zone.id}>
              <h2 className="report-zone-title">{zone.label}</h2>
              {zoneAreas.map((area) => (
                <AreaBlock key={area.id} area={area} items={itemsForArea(state, area.id)} today={today} onOpenArea={onOpenArea} onOpenItem={onOpenItem} />
              ))}
            </div>
          )
        })}

        <div className="report-foot">
          Kept privately in HomeVault on this device. Values are as entered by the homeowner.
        </div>
      </div>
    </div>
  )
}

function AreaBlock({ area, items, today, onOpenArea, onOpenItem }) {
  const AreaIcon = Icon[area.icon] || Icon.box
  return (
    <div className="report-area">
      <button className="report-area-title as-title-btn" onClick={() => onOpenArea(area.id)}
        title={'Open ' + area.name}>
        <AreaIcon size={18} /> {area.name} <span className="muted">· {items.length} · open ›</span>
      </button>
      <table className="report-table">
        <thead>
          <tr>
            <th>Item</th><th>Type</th><th>Store / brand</th><th>Purchased</th>
            <th className="num">Price</th><th>Warranty</th><th>Files</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => {
            const cat = CATEGORIES.find((c) => c.id === it.category)?.label || ''
            const w = warrantyStatus(it, today)
            return (
              <tr key={it.id} className="report-row" onClick={() => onOpenItem(it.id)}
                title="Tap to see details & stored photos">
                <td>
                  <div className="cell-name">{it.name}</div>
                  {it.notes && <div className="cell-notes">{it.notes}</div>}
                </td>
                <td>{cat}</td>
                <td>{it.vendor || '—'}</td>
                <td>{it.purchaseDate ? fmt(it.purchaseDate) : '—'}</td>
                <td className="num">{it.price ? money(parsePrice(it.price)) : '—'}</td>
                <td>{warrantyText(it, w)}</td>
                <td className="num">{it.files?.length ? <span className="files-link">📎 {it.files.length}</span> : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SumCell({ n, l, onClick }) {
  return (
    <button className="sum-cell sum-btn" onClick={onClick}>
      <div className="sum-n">{n}</div><div className="sum-l">{l}</div>
    </button>
  )
}

function warrantyText(it, w) {
  if (!it.warrantyExpires) return '—'
  const d = fmt(it.warrantyExpires)
  if (w?.state === 'expired') return `Expired ${d}`
  if (w?.state === 'soon') return `Expires ${d} (soon)`
  if (w?.state === 'ok') return `Until ${d}`
  return d
}

function parsePrice(p) {
  if (!p) return 0
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}
function money(n) {
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
