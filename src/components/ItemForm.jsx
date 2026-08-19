import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { CATEGORIES } from '../lib/defaults.js'
import { saveFile, deleteFile } from '../lib/db.js'
import FileThumb from './FileThumb.jsx'

// Add or edit a stored item (warranty / receipt / manual / appliance / …),
// including photo & PDF attachments.
export default function ItemForm({ item, onSave, onDelete, onClose }) {
  const editing = !!item
  const [name, setName] = useState(item?.name || '')
  const [category, setCategory] = useState(item?.category || 'warranty')
  const [vendor, setVendor] = useState(item?.vendor || '')
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate || '')
  const [warrantyExpires, setWarrantyExpires] = useState(item?.warrantyExpires || '')
  const [price, setPrice] = useState(item?.price || '')
  const [notes, setNotes] = useState(item?.notes || '')
  const [files, setFiles] = useState(item?.files || [])
  const [busy, setBusy] = useState(false)

  const onPick = async (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = '' // allow re-picking the same file
    if (!picked.length) return
    setBusy(true)
    try {
      const saved = []
      for (const f of picked) saved.push(await saveFile(f))
      setFiles((prev) => [...prev, ...saved])
    } catch (err) {
      console.warn('Could not save file', err)
    } finally {
      setBusy(false)
    }
  }

  const removeFile = async (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    try { await deleteFile(id) } catch { /* ignore */ }
  }

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({
      name: trimmed,
      category,
      vendor: vendor.trim(),
      purchaseDate,
      warrantyExpires,
      price: price.toString().trim(),
      notes: notes.trim(),
      files,
    })
  }

  return (
    <Sheet
      title={editing ? 'Edit item' : 'Add to this room'}
      onClose={onClose}
      footer={
        <>
          {editing && <button className="link-danger" onClick={onDelete}><Icon.trash size={18} /></button>}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!name.trim()}>{editing ? 'Save' : 'Save item'}</button>
        </>
      }
    >
      <div className="field">
        <label>What is it?</label>
        <input type="text" value={name} autoFocus={!editing}
          placeholder="e.g. Samsung Fridge, Roof warranty, Costco receipt"
          onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field">
        <label>Type</label>
        <div className="cat-picker">
          {CATEGORIES.map((c) => (
            <button key={c.id} className={category === c.id ? 'on' : ''} onClick={() => setCategory(c.id)}>{c.label}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Store / brand / company</label>
        <input type="text" value={vendor} placeholder="e.g. Home Depot, LG, ABC Roofing"
          onChange={(e) => setVendor(e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Purchase date</label>
          <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Price</label>
          <input type="text" inputMode="decimal" value={price} placeholder="$"
            onChange={(e) => setPrice(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Warranty expires</label>
        <input type="date" value={warrantyExpires} onChange={(e) => setWarrantyExpires(e.target.value)} />
        <div className="hint">We'll flag it on the home screen when it's within 45 days.</div>
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea value={notes} placeholder="Model #, serial #, where you bought it, anything to remember…"
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="field">
        <label>Photos &amp; files (receipts, warranty PDFs…)</label>
        {files.length > 0 && (
          <div className="attach-list">
            {files.map((f) => (
              <div className="attach" key={f.id}>
                <span className="th"><FileThumb file={f} /></span>
                <span className="nm">{f.name}</span>
                <button className="rm" onClick={() => removeFile(f.id)} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
        <label className="add-file" style={{ marginTop: files.length ? 8 : 0 }}>
          <Icon.plus size={18} /> {busy ? 'Adding…' : 'Add photo or file'}
          <input type="file" accept="image/*,application/pdf" multiple onChange={onPick} />
        </label>
        <div className="hint">Files stay on this device, in your browser.</div>
      </div>
    </Sheet>
  )
}
