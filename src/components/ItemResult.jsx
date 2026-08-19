import { Icon, CAT_ICONS } from '../lib/icons.jsx'
import { CATEGORIES } from '../lib/defaults.js'
import { warrantyStatus } from '../lib/storage.js'
import FileThumb from './FileThumb.jsx'

// An item row that also shows which room it lives in. Used by search results
// and the "Expiring soon" list, where items come from all over the house.
export default function ItemResult({ item, area, today, onClick }) {
  const cat = CATEGORIES.find((c) => c.id === item.category)
  const CatIcon = Icon[CAT_ICONS[item.category] || 'tag']
  const AreaIcon = area ? (Icon[area.icon] || Icon.box) : Icon.box
  const w = warrantyStatus(item, today)
  const cover = item.files?.find((f) => f.type?.startsWith('image/'))

  return (
    <button className="item" onClick={onClick}>
      <span className="thumb">{cover ? <FileThumb file={cover} /> : <CatIcon size={22} />}</span>
      <span className="body">
        <span className="title">{item.name}</span>
        <span className="meta">
          {area && <span className="room-chip"><AreaIcon size={13} /> {area.name}</span>}
        </span>
        <span className="tags">
          {cat && <span className="tag cat">{cat.label}</span>}
          {item.files?.length > 0 && <span className="tag files">{item.files.length} 📎</span>}
          {w?.state === 'ok' && <span className="tag ok">Warranty {w.days}d left</span>}
          {w?.state === 'soon' && <span className="tag warn">Expires in {w.days}d</span>}
          {w?.state === 'expired' && <span className="tag danger">Expired {Math.abs(w.days)}d ago</span>}
        </span>
      </span>
      <span style={{ color: 'var(--line)', alignSelf: 'center' }}><Icon.chevron size={20} /></span>
    </button>
  )
}
