import { Icon, CAT_ICONS } from '../lib/icons.jsx'
import { CATEGORIES } from '../lib/defaults.js'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'
import FileThumb from './FileThumb.jsx'

// Detail screen for one room / area: its stored items, with an Add button.
export default function AreaView({ state, area, today, onEditArea, onAddItem, onOpenItem }) {
  const items = itemsForArea(state, area.id)
  const AreaIcon = Icon[area.icon] || Icon.box

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

      <div className="section-row">
        <h3>Stored here</h3>
        <button className="btn small" onClick={onAddItem}><Icon.plus size={16} /> Add</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="big">📦</div>
          <p><strong>Nothing here yet.</strong></p>
          <p>Add a warranty, receipt, manual or a photo of anything in this space.</p>
          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={onAddItem}><Icon.plus size={18} /> Add something</button>
          </div>
        </div>
      ) : (
        <div className="items">
          {items.map((it) => (
            <ItemRow key={it.id} item={it} today={today} onClick={() => onOpenItem(it.id)} />
          ))}
        </div>
      )}
    </>
  )
}

function ItemRow({ item, today, onClick }) {
  const cat = CATEGORIES.find((c) => c.id === item.category)
  const CatIcon = Icon[CAT_ICONS[item.category] || 'tag']
  const w = warrantyStatus(item, today)
  const cover = item.files?.find((f) => f.type?.startsWith('image/'))

  return (
    <button className="item" onClick={onClick}>
      <span className="thumb">{cover ? <FileThumb file={cover} /> : <CatIcon size={22} />}</span>
      <span className="body">
        <span className="title">{item.name}</span>
        {(item.vendor || item.purchaseDate) && (
          <span className="meta">
            {item.vendor}{item.vendor && item.purchaseDate ? ' · ' : ''}
            {item.purchaseDate ? fmt(item.purchaseDate) : ''}
          </span>
        )}
        <span className="tags">
          {cat && <span className="tag cat">{cat.label}</span>}
          {item.files?.length > 0 && <span className="tag files">{item.files.length} 📎</span>}
          {w?.state === 'ok' && <span className="tag ok">Warranty {w.days}d left</span>}
          {w?.state === 'soon' && <span className="tag warn">Expires in {w.days}d</span>}
          {w?.state === 'expired' && <span className="tag danger">Warranty expired</span>}
        </span>
      </span>
      <span style={{ color: 'var(--line)', alignSelf: 'center' }}><Icon.chevron size={20} /></span>
    </button>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
