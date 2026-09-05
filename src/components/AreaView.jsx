import { Icon } from '../lib/icons.jsx'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'
import { suggestionsFor } from '../lib/suggestions.js'

// Detail screen for one room / area: a dropdown-first "Add to this area" and a
// compact table of everything stored here — item, store/brand, purchase date,
// price and warranty all visible together.
export default function AreaView({ state, area, today, onEditArea, onQuickAdd, onOpenItem }) {
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
                    <td className="num">{it.price || '—'}</td>
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
