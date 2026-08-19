import { useEffect, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon, CAT_ICONS } from '../lib/icons.jsx'
import { CATEGORIES } from '../lib/defaults.js'
import { warrantyStatus } from '../lib/storage.js'
import { getFileURL } from '../lib/db.js'
import FileThumb from './FileThumb.jsx'

// Read-only view of a stored item, with tappable attachments and an Edit button.
export default function ItemDetail({ item, today, onEdit, onClose }) {
  const cat = CATEGORIES.find((c) => c.id === item.category)
  const CatIcon = Icon[CAT_ICONS[item.category] || 'tag']
  const w = warrantyStatus(item, today)

  const openFile = async (f) => {
    const url = await getFileURL(f.id)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <Sheet
      title={item.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Close</button>
          <button className="btn" onClick={onEdit}><Icon.edit size={18} /> Edit</button>
        </>
      }
    >
      <div className="area-hero" style={{ marginBottom: 18 }}>
        <span className="icon"><CatIcon size={26} /></span>
        <div>
          <h2 style={{ fontSize: 18 }}>{item.name}</h2>
          <div className="sub">{cat?.label}</div>
        </div>
      </div>

      {w && (
        <div className="detail-block">
          <div className="k">Warranty</div>
          <div className="v">
            {w.state === 'expired' && <span className="tag danger">Expired {Math.abs(w.days)} days ago</span>}
            {w.state === 'soon' && <span className="tag warn">Expires in {w.days} days</span>}
            {w.state === 'ok' && <span className="tag ok">{w.days} days left</span>}
            {' '}<span style={{ color: 'var(--ink-soft)' }}>({fmt(item.warrantyExpires)})</span>
          </div>
        </div>
      )}

      {item.vendor && <Field k="Store / brand" v={item.vendor} />}
      {item.purchaseDate && <Field k="Purchased" v={fmt(item.purchaseDate)} />}
      {item.price && <Field k="Price" v={/^\$/.test(item.price) ? item.price : '$' + item.price} />}
      {item.notes && <Field k="Notes" v={item.notes} multiline />}

      {item.files?.length > 0 && (
        <div className="detail-block">
          <div className="k">Photos &amp; files</div>
          <div className="attach-grid">
            {item.files.map((f) => (
              <a key={f.id} onClick={(e) => { e.preventDefault(); openFile(f) }} href="#">
                <div className="preview"><FileThumb file={f} size={30} /></div>
                <div className="cap">{f.name}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}

function Field({ k, v, multiline }) {
  return (
    <div className="detail-block">
      <div className="k">{k}</div>
      <div className="v" style={multiline ? { whiteSpace: 'pre-wrap' } : undefined}>{v}</div>
    </div>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d
  return dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}
