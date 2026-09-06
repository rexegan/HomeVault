import { warrantyStatus, formatPrice } from '../lib/storage.js'

// Everything stored, whole-house: one table with the room each item lives in.
export default function AllItemsView({ state, today, onOpenItem }) {
  const roomOf = (id) => state.areas.find((a) => a.id === id)?.name || '—'
  const items = [...state.items].sort((a, b) =>
    roomOf(a.areaId).localeCompare(roomOf(b.areaId)) || a.name.localeCompare(b.name))

  return (
    <div className="all-items">
      <div className="intake-lede">
        <h2>Everything stored</h2>
        <p>{items.length === 0
          ? 'Nothing stored yet — tap a room on the floor plan to start.'
          : `All ${items.length} things in your home, room by room. Tap any row for details.`}</p>
      </div>

      {items.length > 0 && (
        <div className="area-table-wrap">
          <table className="area-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Room</th>
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
                    <td>{roomOf(it.areaId)}</td>
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
