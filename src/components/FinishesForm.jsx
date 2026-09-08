import Sheet from './Sheet.jsx'
import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { formatPrice } from '../lib/storage.js'

// One Paint / Flooring / Wallpaper entry: a single job on a single surface,
// dated and costed — they stack into the room's running finishes history.
const money = (v) => formatPrice(v)
const maskDate = (v) => {
  if (!/^[\d/]*$/.test(v)) return v
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2)
  return d
}

export const FINISH_KINDS = ['Paint', 'Flooring', 'Wallpaper', 'Tile / backsplash',
  'Countertops', 'Trim / molding', 'Hardware', 'Other']

const FIELDS = [
  ['where', 'Where in the room?', { hint: 'Whole room, accent wall, ceiling, backsplash…' }],
  ['product', 'Brand & product', { hint: 'e.g. Sherwin-Williams Duration / Shaw Paragon Plus' }],
  ['colorName', 'Color / pattern — name & code', { hint: 'e.g. SW 7029 Agreeable Gray' }],
  ['finish', 'Sheen / type', { hint: 'Eggshell, semi-gloss, LVP, 3x6 subway…' }],
  ['store', 'Bought at', {}],
  ['doneBy', 'Done by', { hint: 'Company or "us"' }],
  ['date', 'When', { date: true }],
  ['qty', 'Quantity', { hint: 'Gallons, sq ft, rolls…' }],
  ['totalCost', 'Total cost', { money: true }],
  ['notes', 'Notes to match it later', { hint: 'Grout color, texture, leftover cans in garage…' }],
]

export default function FinishesForm({ area, entry, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ kind: 'Paint', ...entry }))
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const v = (k) => draft[k] || ''
  const editing = !!entry?.id

  return (
    <Sheet title={area.name + ' — ' + (editing ? 'edit entry' : 'new entry')} onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="link-danger" onClick={() => {
              if (confirm('Delete this entry?')) onDelete()
            }}><Icon.trash size={18} /></button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(draft)}>Save</button>
        </>
      }>

      <div className="intake-field filled">
        <label htmlFor="fx-kind"><span className="chk">✓</span><span className="q">What was done?</span></label>
        <select id="fx-kind" value={v('kind')} onChange={(e) => set('kind', e.target.value)}>
          {FINISH_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {FIELDS.map(([key, label, opt]) => {
        const raw = v(key)
        const filled = raw.trim() !== ''
        return (
          <div className={'intake-field' + (filled ? ' filled' : '')} key={key} style={{ marginBottom: 12 }}>
            <label htmlFor={'fx-' + key}>
              <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
              <span className="q">{label}</span>
            </label>
            <input id={'fx-' + key} type="text" value={raw}
              inputMode={opt.date || opt.money ? 'numeric' : undefined}
              placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
              onChange={(e) => set(key, opt.date ? maskDate(e.target.value) : e.target.value)}
              onBlur={opt.money ? () => set(key, money(raw)) : undefined} />
          </div>
        )
      })}
    </Sheet>
  )
}
