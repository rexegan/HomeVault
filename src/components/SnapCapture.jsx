import { useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { CATEGORIES } from '../lib/defaults.js'
import { ocrImage, parseReceipt } from '../lib/scan.js'
import { saveFile } from '../lib/db.js'

// Snap & File: photograph a receipt (or pick one from photos) and the app reads
// it on-device, guesses what it is and which room it belongs in, and files it
// with the photo attached. The user confirms/edits before anything is saved.
export default function SnapCapture({ areas, onSave, onClose }) {
  const [stage, setStage] = useState('pick')       // pick | reading | confirm
  const [progress, setProgress] = useState('')
  const [photo, setPhoto] = useState(null)          // File
  const [photoURL, setPhotoURL] = useState(null)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhoto(file)
    setPhotoURL(URL.createObjectURL(file))
    setStage('reading')
    setProgress('Reading the photo…')
    try {
      const text = await ocrImage(file, setProgress)
      const parsed = parseReceipt(text)
      const matchedArea = parsed.room
        ? areas.find((a) => a.name.toLowerCase() === parsed.room.toLowerCase())
        : null
      setDraft({
        name: parsed.name,
        category: parsed.category,
        vendor: parsed.vendor,
        purchaseDate: parsed.purchaseDate,
        price: parsed.price,
        areaId: matchedArea ? matchedArea.id : (areas[0]?.id || ''),
        guessedRoom: !!matchedArea,
      })
      setStage('confirm')
    } catch (err) {
      console.warn('Snap & File OCR failed', err)
      setDraft({
        name: 'Receipt', category: 'receipt', vendor: '', purchaseDate: '', price: '',
        areaId: areas[0]?.id || '', guessedRoom: false, failed: true,
      })
      setStage('confirm')
    }
  }

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))

  const save = async () => {
    if (!draft.name.trim() || !draft.areaId || busy) return
    setBusy(true)
    try {
      const stored = await saveFile(photo)
      onSave(draft.areaId, {
        name: draft.name.trim(),
        category: draft.category,
        vendor: draft.vendor.trim(),
        purchaseDate: draft.purchaseDate,
        warrantyExpires: '',
        price: draft.price.replace(/[^0-9.,$]/g, ''),
        notes: '',
        files: [stored],
      })
    } catch (err) {
      console.warn('Snap & File save failed', err)
      setBusy(false)
    }
  }

  return (
    <Sheet
      title="Snap & File"
      onClose={onClose}
      footer={stage === 'confirm' ? (
        <>
          <button className="btn secondary" onClick={() => { setStage('pick'); setDraft(null) }}>Retake</button>
          <button className="btn" onClick={save} disabled={busy || !draft?.name?.trim()}>
            {busy ? 'Saving…' : 'File it'}
          </button>
        </>
      ) : undefined}
    >
      {stage === 'pick' && (
        <div className="snap-pick">
          <p className="snap-lede">Photograph a receipt, warranty, or the label on an appliance.
            HomeVault reads it <b>on this device</b> — the photo never leaves your browser — and
            files it in the right room.</p>
          <button className="btn block" onClick={() => inputRef.current?.click()}>
            <Icon.photo size={20} /> Take or choose a photo
          </button>
          <input ref={inputRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }} onChange={onPick} />
          <div className="hint" style={{ textAlign: 'center', marginTop: 10 }}>
            First scan downloads the reader (~2 MB) and takes a little longer.
          </div>
        </div>
      )}

      {stage === 'reading' && (
        <div className="snap-reading">
          {photoURL && <img className="snap-thumb" src={photoURL} alt="Receipt" />}
          <div className="snap-progress">
            <span className="snap-spinner" aria-hidden="true" />
            {progress || 'Reading…'}
          </div>
        </div>
      )}

      {stage === 'confirm' && draft && (
        <div className="snap-confirm">
          {photoURL && <img className="snap-thumb small" src={photoURL} alt="Receipt" />}
          {draft.failed ? (
            <p className="hint">Couldn't read that photo — fill in the details and the photo will
              still be attached.</p>
          ) : (
            <p className="hint">Here's what I could read — fix anything that looks off, then file it.
              {draft.guessedRoom && ' The room is my best guess.'}</p>
          )}

          <div className="field">
            <label>What is it?</label>
            <input type="text" value={draft.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label>Which room does it belong to?</label>
            <select value={draft.areaId} onChange={set('areaId')}>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Type</label>
            <select value={draft.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Store / brand</label>
              <input type="text" value={draft.vendor} onChange={set('vendor')} />
            </div>
            <div className="field">
              <label>Price</label>
              <input type="text" inputMode="decimal" value={draft.price} onChange={set('price')} />
            </div>
          </div>
          <div className="field">
            <label>Purchase date</label>
            <input type="date" value={draft.purchaseDate} onChange={set('purchaseDate')} />
          </div>
        </div>
      )}
    </Sheet>
  )
}
