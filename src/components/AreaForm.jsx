import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon, AREA_ICONS } from '../lib/icons.jsx'
import { ZONES } from '../lib/defaults.js'

// Add or edit a room/area. `area` is null when adding.
export default function AreaForm({ area, defaultZone, onSave, onDelete, onClose }) {
  const editing = !!area
  const [name, setName] = useState(area?.name || '')
  const [icon, setIcon] = useState(area?.icon || 'box')
  const [zone, setZone] = useState(area?.zone || defaultZone || 'inside')

  const variantFor = (z) => (z === 'garage' ? 'garage' : z === 'outside' ? 'outdoor' : undefined)

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave({ name: trimmed, icon, zone, variant: area?.variant ?? variantFor(zone) })
  }

  return (
    <Sheet
      title={editing ? 'Edit area' : 'Add an area'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="link-danger" onClick={onDelete}><Icon.trash size={18} /></button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!name.trim()}>{editing ? 'Save' : 'Add area'}</button>
        </>
      }
    >
      <div className="field">
        <label>Name</label>
        <input type="text" value={name} placeholder="e.g. Game Room, Front Porch, Attic"
          autoFocus={!editing} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="field">
        <label>Where is it?</label>
        <div className="zone-picker">
          {ZONES.map((z) => (
            <button key={z.id} className={zone === z.id ? 'on' : ''} onClick={() => setZone(z.id)}>{z.label}</button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Icon</label>
        <div className="icon-picker">
          {AREA_ICONS.map((k) => {
            const I = Icon[k]
            return (
              <button key={k} className={icon === k ? 'on' : ''} onClick={() => setIcon(k)} aria-label={k}>
                <I size={24} />
              </button>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}
