import { Icon } from '../lib/icons.jsx'
import { itemsForArea, warrantyStatus, formatPrice } from '../lib/storage.js'
import { suggestionsFor } from '../lib/suggestions.js'


// Detail screen for one room / area: a dropdown-first "Add to this area" and a
// compact table of everything stored here — item, store/brand, purchase date,
// price and warranty all visible together.
const POOL_LABELS = [
  ['builder', 'Built by'], ['yearBuilt', 'Year built'], ['gallons', 'Gallons'],
  ['type', 'Type'], ['surface', 'Surface'], ['sanitizer', 'Sanitizer'],
  ['heated', 'Heated'], ['hotTub', 'Hot tub / spa'], ['maxDepth', 'Deepest point'],
  ['features', 'Water features'], ['notes', 'Notes'],
]

export default function AreaView({ state, area, today, poolValues, finishEntries, onAddFinish, onEditFinish, onEditArea, onQuickAdd, onOpenItem }) {
  const isPool = area.variant === 'pool' || /swimming pool/i.test(area.name)
  const poolRows = isPool
    ? POOL_LABELS.map(([k, l]) => [l, (poolValues?.[k] || '').trim()]).filter(([, val]) => val)
    : []
  const entries = finishEntries || []
  const items = itemsForArea(state, area.id)
  const AreaIcon = Icon[area.icon] || Icon.box
  const suggestions = suggestionsFor(area.name)

  return (
    <>
      <div className="area-hero">
        <span className="icon"><AreaIcon size={30} /></span>
        <div>
          <h2>{area.name}</h2>
          <div className="sub">{items.length === 0 ? 'Nothing stored yet' : `${items.length} ${items.length === 1 ? 'item' : 'items'} stored here`}</div>
        </div>
        <button className="edit" onClick={onEditArea}><Icon.edit size={18} /> Edit</button>
      </div>

      {isPool && (
        <button className="pool-summary" onClick={onEditArea}>
          <div className="pool-summary-head">
            <span>🏊 Pool profile</span>
            <span className="pool-summary-edit">{poolRows.length ? 'Edit ›' : 'Set it up ›'}</span>
          </div>
          {poolRows.length === 0 ? (
            <div className="pool-summary-empty">Who built it, gallons, type, surface, salt or
              chlorine, heated, hot tub — tap to fill in your pool's profile.</div>
          ) : (
            <div className="pool-summary-grid">
              {poolRows.map(([l, val]) => (
                <div className="ps-cell" key={l}>
                  <div className="ps-k">{l}</div>
                  <div className="ps-v">{val}</div>
                </div>
              ))}
            </div>
          )}
        </button>
      )}

      <div className="pool-summary finishes-summary">
        <div className="pool-summary-head">
          <span>🎨 Paint, Flooring and Wallpaper</span>
          <button className="btn small" onClick={onAddFinish}><Icon.plus size={14} /> Add</button>
        </div>
        {entries.length === 0 ? (
          <div className="pool-summary-empty">Each paint job, floor install or wallpaper hang gets
            its own dated entry here — colors, products and cost, stacked into the room's history.</div>
        ) : (
          <div className="fin-entries">
            {entries.map((e) => (
              <button className="fin-entry" key={e.id} onClick={() => onEditFinish(e.id)}>
                <span className="fe-kind">{e.kind || 'Other'}</span>
                <span className="fe-body">
                  <span className="fe-title">
                    {[e.where, e.colorName || e.product].filter(Boolean).join(' — ') || 'Entry'}
                  </span>
                  <span className="fe-sub">
                    {[e.product && e.colorName ? e.product : '', e.finish, e.doneBy && 'by ' + e.doneBy]
                      .filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="fe-meta">
                  {e.date && <span className="fe-date">{e.date}</span>}
                  {e.totalCost && <span className="fe-cost">{e.totalCost}</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="quickadd">
        <label htmlFor="quickadd-select">Add to this area</label>
        <select id="quickadd-select" value=""
          onChange={(e) => { if (e.target.value) onQuickAdd(e.target.value === '__other' ? '' : e.target.value) }}>
          <option value="">Pick an item…</option>
          {suggestions.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value="__other">Something else…</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          <p><strong>Nothing here yet.</strong> Pick an item above to start the list.</p>
        </div>
      ) : (
        <div className="area-table-wrap">
          <table className="area-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Store / brand</th>
                <th>Purchased</th>
                <th className="num">Price paid</th>
                <th>Warranty expires</th>
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
    </>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
