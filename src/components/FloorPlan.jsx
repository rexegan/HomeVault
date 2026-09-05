import { Icon } from '../lib/icons.jsx'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'
import { homeFacts } from '../lib/intake.js'
import Blueprint from './Blueprint.jsx'

// Home screen: an architectural blueprint of the house. Each room is tappable and
// shows how many things are stored there, with a badge when a warranty is due.
export default function FloorPlan({ state, today, profile, onOpenArea, onAddArea, onOpenProfile }) {
  const { name, facts } = homeFacts(profile)

  return (
    <>
      <div className="plan-header">
        <div>
          <h2>Your Home</h2>
          <div className="sub">Tap a room to see or add warranties, receipts &amp; info</div>
        </div>
        {!name && facts.length === 0 && (
          <button className="btn secondary small" onClick={onOpenProfile}>
            <Icon.book size={15} /> Add home details
          </button>
        )}
      </div>

      <Blueprint state={state} today={today} profile={profile} onOpenArea={onOpenArea} onAddArea={onAddArea} />
    </>
  )
}

// eslint-disable-next-line no-unused-vars
function RoomTile({ area, state, today, onOpen }) {
  const items = itemsForArea(state, area.id)
  const AreaIcon = Icon[area.icon] || Icon.box
  let soon = 0, expired = 0
  for (const it of items) {
    const w = warrantyStatus(it, today)
    if (w?.state === 'soon') soon++
    if (w?.state === 'expired') expired++
  }
  const badge = expired ? { n: expired, cls: 'danger' } : soon ? { n: soon, cls: '' } : null

  return (
    <button className={'room' + (area.variant ? ' ' + area.variant : '')} onClick={onOpen}>
      {badge && <span className={'badge ' + badge.cls}>{badge.n}</span>}
      <span className="icon"><AreaIcon size={24} /></span>
      <span className="name">{area.name}</span>
      <span className="count">{items.length === 0 ? 'Empty' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}</span>
    </button>
  )
}

