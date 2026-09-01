import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'

// My Pros: everyone who works on your house — plumber, electrician, A/C,
// appliance repair, painter, landscaper… — with tap-to-call and notes.
export const TRADES = [
  'Plumber', 'Electrician', 'A/C & Heating (HVAC)', 'Appliance repair', 'Handyman',
  'Painter', 'Landscaper / lawn care', 'Roofer', 'Pool service', 'Pest control',
  'General contractor', 'Garage door', 'Locksmith', 'Cleaning service',
  'Chimney sweep', 'Septic service', 'Irrigation / sprinkler', 'Tree service',
  'Fence & gate', 'Flooring', 'Window & glass', 'Gutter service', 'Home security',
  'Foundation', 'Water softener / filtration', 'Well service', 'Solar installer',
  'Insurance agent', 'Realtor', 'HOA management', 'Internet provider', 'Other',
]

export default function ProsView({ pros, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null)   // null | 'new' | pro object

  const byTrade = [...pros].sort((a, b) =>
    (a.trade || 'zz').localeCompare(b.trade || 'zz') || (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="pros">
      <div className="intake-lede">
        <h2>My Pros</h2>
        <p>Everyone who works on your house, one tap away — so "who did we use for the
          water heater?" is never a mystery again. Add anyone who's ever shown up with a
          truck and a toolbox.</p>
      </div>

      <div className="section-row">
        <h3>{pros.length === 0 ? 'No contacts yet' : `${pros.length} ${pros.length === 1 ? 'contact' : 'contacts'}`}</h3>
        <button className="btn small" onClick={() => setEditing('new')}><Icon.plus size={16} /> Add a pro</button>
      </div>

      {pros.length === 0 ? (
        <div className="empty">
          <div className="big">🛠️</div>
          <p><strong>Build your home's call list.</strong></p>
          <p>Plumber, electrician, A/C, appliance repair, painter, lawn care — whoever keeps
            your house running.</p>
          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => setEditing('new')}><Icon.plus size={18} /> Add your first pro</button>
          </div>
        </div>
      ) : (
        <div className="items">
          {byTrade.map((p) => (
            <div className="pro-card" key={p.id}>
              <div className="pro-main" onClick={() => setEditing(p)} role="button" tabIndex={0}>
                <span className="pro-trade">{p.trade || 'Other'}</span>
                <span className="pro-name">{p.name}</span>
                {p.notes && <span className="pro-notes">{p.notes}</span>}
              </div>
              {p.phone && (
                <a className="pro-call" href={'tel:' + p.phone.replace(/[^0-9+]/g, '')}
                  aria-label={'Call ' + p.name}>
                  📞 {p.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ProForm
          pro={editing === 'new' ? null : editing}
          onSave={(data) => {
            if (editing === 'new') onAdd(data)
            else onUpdate(editing.id, data)
            setEditing(null)
          }}
          onDelete={editing !== 'new' ? () => { onDelete(editing.id); setEditing(null) } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ProForm({ pro, onSave, onDelete, onClose }) {
  const [trade, setTrade] = useState(pro?.trade || 'Plumber')
  const [name, setName] = useState(pro?.name || '')
  const [phone, setPhone] = useState(pro?.phone || '')
  const [email, setEmail] = useState(pro?.email || '')
  const [notes, setNotes] = useState(pro?.notes || '')

  const submit = () => {
    if (!name.trim()) return
    onSave({ trade, name: name.trim(), phone: phone.trim(), email: email.trim(), notes: notes.trim() })
  }

  return (
    <Sheet
      title={pro ? 'Edit contact' : 'Add a pro'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="link-danger" onClick={() => {
              if (confirm('Delete this contact?')) onDelete()
            }}><Icon.trash size={18} /></button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={submit} disabled={!name.trim()}>{pro ? 'Save' : 'Add'}</button>
        </>
      }
    >
      <div className="field">
        <label>What do they do?</label>
        <select value={trade} onChange={(e) => setTrade(e.target.value)}>
          {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="field">
        <label>Name / company</label>
        <input type="text" value={name} autoFocus={!pro}
          placeholder="e.g. Mike's Plumbing — Mike Rivera"
          onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Phone</label>
          <input type="tel" value={phone} placeholder="(512) 555-0100"
            onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="text" inputMode="email" value={email} placeholder="optional"
            onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea value={notes}
          placeholder="What they've done, rates, gate code, who referred them…"
          onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Sheet>
  )
}
