import { Icon } from '../lib/icons.jsx'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'

// All rooms & areas as a tappable list with live counts and warranty flags.
export default function RoomsView({ state, today, onOpenArea, onAddArea }) {
  return (
    <div className="rooms-view">
      <div className="intake-lede">
        <h2>Rooms &amp; areas</h2>
        <p>Every space in your home — tap one to see what's stored there.</p>
      </div>

      <div className="items">
        {state.areas.map((area) => {
          const items = itemsForArea(state, area.id)
          const AreaIcon = Icon[area.icon] || Icon.box
          let soon = 0, expired = 0
          for (const it of items) {
            const w = warrantyStatus(it, today)
            if (w?.state === 'soon') soon++
            else if (w?.state === 'expired') expired++
          }
          return (
            <button className="room-row" key={area.id} onClick={() => onOpenArea(area.id)}>
              <span className="room-row-icon"><AreaIcon size={20} /></span>
              <span className="room-row-body">
                <span className="room-row-name">{area.name}</span>
                <span className="room-row-sub">
                  {items.length === 0 ? 'Empty' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                  {expired > 0 && ` · ${expired} expired`}
                  {soon > 0 && ` · ${soon} expiring soon`}
                </span>
              </span>
              {expired > 0 ? <span className="tag danger">{expired}</span>
                : soon > 0 ? <span className="tag warn">{soon}</span> : null}
              <span style={{ color: 'var(--line)' }}><Icon.chevron size={20} /></span>
            </button>
          )
        })}
      </div>

      <button className="btn secondary block" style={{ marginTop: 14 }} onClick={onAddArea}>
        <Icon.plus size={18} /> Add a room or area
      </button>
    </div>
  )
}
