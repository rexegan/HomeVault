import { useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { saveFile, getFileURL } from '../lib/db.js'
import { newProId } from '../lib/storage.js'
import FileThumb from './FileThumb.jsx'

// My Pros: everyone who works on your house — with office/cell/email, and a
// chronological work history per pro: date, what was done, invoices & receipts.
export const TRADES = [
  'Plumber', 'Electrician', 'A/C & Heating (HVAC)', 'Appliance repair', 'Handyman',
  'Painter', 'Landscaper / lawn care', 'Roofer', 'Pool service', 'Pest control',
  'General contractor', 'Garage door', 'Locksmith', 'Cleaning service',
  'Chimney sweep', 'Septic service', 'Irrigation / sprinkler', 'Tree service',
  'Fence & gate', 'Flooring', 'Window & glass', 'Gutter service', 'Home security',
  'Foundation', 'Water softener / filtration', 'Well service', 'Solar installer',
  'Insurance agent', 'Realtor', 'HOA management', 'Internet provider', 'Other',
]

const tel = (s) => 'tel:' + String(s).replace(/[^0-9+]/g, '')

export default function ProsView({ pros, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null)   // null | 'new' | pro (contact form)
  const [openId, setOpenId] = useState(null)     // pro detail sheet

  const byTrade = [...pros].sort((a, b) =>
    (a.trade || 'zz').localeCompare(b.trade || 'zz') || (a.name || '').localeCompare(b.name || ''))
  const openPro = pros.find((p) => p.id === openId) || null

  return (
    <div className="pros">
      <div className="intake-lede">
        <h2>My Pros</h2>
        <p>Everyone who works on your house — and everything they've ever done to it.
          Tap a pro to see their full work history, in order, with the invoices attached.</p>
      </div>

      <div className="section-row">
        <h3>{pros.length === 0 ? 'No contacts yet' : `${pros.length} ${pros.length === 1 ? 'contact' : 'contacts'}`}</h3>
        <button className="btn small" onClick={() => setEditing('new')}><Icon.plus size={16} /> Add a pro</button>
      </div>

      {pros.length === 0 ? (
        <div className="empty">
          <div className="big">🛠️</div>
          <p><strong>Build your home's call list &amp; logbook.</strong></p>
          <p>Plumber, electrician, A/C, appliance repair, painter, lawn care — and a running
            record of every visit, repair, and invoice.</p>
          <div style={{ marginTop: 16 }}>
            <button className="btn" onClick={() => setEditing('new')}><Icon.plus size={18} /> Add your first pro</button>
          </div>
        </div>
      ) : (
        <div className="items">
          {byTrade.map((p) => {
            const jobs = p.jobs || []
            const last = jobs.length ? [...jobs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))[jobs.length - 1] : null
            return (
              <button className="pro-card" key={p.id} onClick={() => setOpenId(p.id)}>
                <div className="pro-main">
                  <span className="pro-trade">{p.trade || 'Other'}</span>
                  <span className="pro-name">{p.name}</span>
                  <span className="pro-notes">
                    {jobs.length === 0 ? 'No work logged yet'
                      : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} · last: ${last?.work?.slice(0, 40) || ''}${(last?.work?.length || 0) > 40 ? '…' : ''}`}
                  </span>
                </div>
                <span style={{ color: 'var(--line)' }}><Icon.chevron size={20} /></span>
              </button>
            )
          })}
        </div>
      )}

      {openPro && (
        <ProDetail
          pro={openPro}
          onEdit={() => setEditing(openPro)}
          onUpdate={(data) => onUpdate(openPro.id, data)}
          onClose={() => setOpenId(null)}
        />
      )}

      {editing && (
        <ProForm
          pro={editing === 'new' ? null : editing}
          onSave={(data) => {
            if (editing === 'new') onAdd({ ...data, jobs: [] })
            else onUpdate(editing.id, data)
            setEditing(null)
          }}
          onDelete={editing !== 'new' ? () => { onDelete(editing.id); setEditing(null); setOpenId(null) } : undefined}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ---- Pro detail: contact row + chronological work history + log-work form ----
function ProDetail({ pro, onEdit, onUpdate, onClose }) {
  const [logging, setLogging] = useState(false)
  const jobs = [...(pro.jobs || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const addJob = (job) => {
    onUpdate({ jobs: [...(pro.jobs || []), { id: newProId(), ...job }] })
    setLogging(false)
  }
  const deleteJob = (jobId) => {
    if (!confirm('Delete this work entry?')) return
    onUpdate({ jobs: (pro.jobs || []).filter((j) => j.id !== jobId) })
  }

  const openFile = async (f) => {
    const url = await getFileURL(f.id)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <Sheet
      title={pro.name}
      onClose={() => { if (!logging) onClose() }}
      footer={
        <>
          <button className="btn secondary" onClick={onEdit}><Icon.edit size={16} /> Contact</button>
          <button className="btn" onClick={() => setLogging(true)}><Icon.plus size={16} /> Log work</button>
        </>
      }
    >
      <div className="pro-head">
        <span className="pro-trade">{pro.trade || 'Other'}</span>
        {pro.owner && <div className="pro-owner">Owner / contact: <b>{pro.owner}</b></div>}
        <div className="pro-contact-row">
          {pro.officePhone && <a className="pro-call" href={tel(pro.officePhone)}>🏢 Office {pro.officePhone}</a>}
          {pro.cellPhone && <a className="pro-call" href={tel(pro.cellPhone)}>📱 Cell {pro.cellPhone}</a>}
          {pro.email && <a className="pro-call" href={'mailto:' + pro.email}>✉️ {pro.email}</a>}
          {pro.website && (
            <a className="pro-call" href={/^https?:\/\//i.test(pro.website) ? pro.website : 'https://' + pro.website}
              target="_blank" rel="noopener noreferrer">🌐 {pro.website.replace(/^https?:\/\//i, '')}</a>
          )}
        </div>
        {(pro.street || pro.city || pro.zip) && (
          <a className="pro-address"
            href={'https://maps.apple.com/?q=' + encodeURIComponent([pro.name, pro.street, pro.city, pro.state, pro.zip].filter(Boolean).join(', '))}
            target="_blank" rel="noopener noreferrer">
            📍 {[pro.street, [pro.city, pro.state].filter(Boolean).join(', '), pro.zip].filter(Boolean).join(' · ')}
          </a>
        )}
        {(pro.license || pro.referredBy) && (
          <div className="pro-extra">
            {pro.license && <span>License #{pro.license}</span>}
            {pro.referredBy && <span>Referred by {pro.referredBy}</span>}
          </div>
        )}
        {pro.notes && <div className="pro-headnotes">{pro.notes}</div>}
      </div>

      <div className="section-row" style={{ marginTop: 14 }}>
        <h3>Work history{jobs.length > 0 ? ` · ${jobs.length}` : ''}</h3>
      </div>

      {jobs.length === 0 ? (
        <div className="empty" style={{ padding: '24px 16px' }}>
          <p><strong>Nothing logged yet.</strong></p>
          <p>Each visit gets a date, what was done, and the invoice or receipt — building the
            complete history of your home.</p>
        </div>
      ) : (
        <div className="job-timeline">
          {jobs.map((j) => (
            <div className="job" key={j.id}>
              <div className="job-dot" aria-hidden="true" />
              <div className="job-body">
                <div className="job-date">{fmt(j.date)}</div>
                <div className="job-work">{j.work}</div>
                {j.notes && <div className="job-notes">{j.notes}</div>}
                {j.files?.length > 0 && (
                  <div className="job-files">
                    {j.files.map((f) => (
                      <button className="job-file" key={f.id} onClick={() => openFile(f)}>
                        <span className="th"><FileThumb file={f} size={16} /></span>
                        <span className="nm">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button className="job-delete" onClick={() => deleteJob(j.id)}>remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {logging && <JobForm onSave={addJob} onClose={() => setLogging(false)} />}
    </Sheet>
  )
}

// ---- Log a job: date, specifics, invoices/receipts, notes ----
function JobForm({ onSave, onClose }) {
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString().slice(0, 10) }
  const [date, setDate] = useState(today())
  const [work, setWork] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)

  const onPick = async (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (!picked.length) return
    setBusy(true)
    try {
      const saved = []
      for (const f of picked) saved.push(await saveFile(f))
      setFiles((prev) => [...prev, ...saved])
    } finally { setBusy(false) }
  }

  return (
    <Sheet
      title="Log work"
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!work.trim() || !date}
            onClick={() => onSave({ date, work: work.trim(), notes: notes.trim(), files })}>
            Save entry
          </button>
        </>
      }
    >
      <div className="field">
        <label>Date work was done</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label>What was done?</label>
        <textarea value={work} autoFocus
          placeholder="e.g. Replaced water heater T&P valve; flushed tank; checked gas line"
          onChange={(e) => setWork(e.target.value)} />
      </div>
      <div className="field">
        <label>Invoice / receipt</label>
        {files.length > 0 && (
          <div className="attach-list">
            {files.map((f) => (
              <div className="attach" key={f.id}>
                <span className="th"><FileThumb file={f} /></span>
                <span className="nm">{f.name}</span>
                <button className="rm" onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
        <label className="add-file" style={{ marginTop: files.length ? 8 : 0 }}>
          <Icon.plus size={18} /> {busy ? 'Adding…' : 'Attach invoice or receipt'}
          <input type="file" accept="image/*,application/pdf" multiple onChange={onPick} />
        </label>
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea value={notes} placeholder="Cost, parts used, warranty on the work, follow-ups…"
          onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Sheet>
  )
}

// ---- Contact form: the full business record ----
function ProForm({ pro, onSave, onDelete, onClose }) {
  const [trade, setTrade] = useState(pro?.trade || 'Plumber')
  const [name, setName] = useState(pro?.name || '')
  const [owner, setOwner] = useState(pro?.owner || '')
  const [officePhone, setOfficePhone] = useState(pro?.officePhone || '')
  const [cellPhone, setCellPhone] = useState(pro?.cellPhone || pro?.phone || '')
  const [email, setEmail] = useState(pro?.email || '')
  const [website, setWebsite] = useState(pro?.website || '')
  const [street, setStreet] = useState(pro?.street || '')
  const [city, setCity] = useState(pro?.city || '')
  const [stateCode, setStateCode] = useState(pro?.state || '')
  const [zip, setZip] = useState(pro?.zip || '')
  const [license, setLicense] = useState(pro?.license || '')
  const [referredBy, setReferredBy] = useState(pro?.referredBy || '')
  const [notes, setNotes] = useState(pro?.notes || '')

  const submit = () => {
    if (!name.trim()) return
    onSave({
      trade, name: name.trim(), owner: owner.trim(),
      officePhone: officePhone.trim(), cellPhone: cellPhone.trim(),
      email: email.trim(), website: website.trim(),
      street: street.trim(), city: city.trim(), state: stateCode.trim(), zip: zip.trim(),
      license: license.trim(), referredBy: referredBy.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <Sheet
      title={pro ? 'Edit contact' : 'Add a pro'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button className="link-danger" onClick={() => {
              if (confirm('Delete this contact and their work history?')) onDelete()
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
        <label>Business / company name</label>
        <input type="text" value={name} autoFocus={!pro}
          placeholder="e.g. Mike's Plumbing"
          onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Owner / contact person</label>
        <input type="text" value={owner} placeholder="e.g. Mike Rivera"
          onChange={(e) => setOwner(e.target.value)} />
      </div>

      <div className="form-section">Phones &amp; online</div>
      <div className="field-row">
        <div className="field">
          <label>Office phone</label>
          <input type="tel" value={officePhone} placeholder="(512) 555-0100"
            onChange={(e) => setOfficePhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Cell phone</label>
          <input type="tel" value={cellPhone} placeholder="(512) 555-0101"
            onChange={(e) => setCellPhone(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Email</label>
          <input type="text" inputMode="email" value={email} placeholder="optional"
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Website</label>
          <input type="text" inputMode="url" value={website} placeholder="mikesplumbing.com"
            onChange={(e) => setWebsite(e.target.value)} />
        </div>
      </div>

      <div className="form-section">Business address</div>
      <div className="field">
        <label>Street address</label>
        <input type="text" value={street} placeholder="1200 Trade Center Blvd, Suite 4"
          onChange={(e) => setStreet(e.target.value)} />
      </div>
      <div className="field-row addr-row">
        <div className="field addr-city">
          <label>City</label>
          <input type="text" value={city} placeholder="Austin"
            onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field addr-state">
          <label>State</label>
          <input type="text" value={stateCode} placeholder="TX" maxLength={14}
            onChange={(e) => setStateCode(e.target.value)} />
        </div>
        <div className="field addr-zip">
          <label>ZIP</label>
          <input type="text" inputMode="numeric" value={zip} placeholder="78701"
            onChange={(e) => setZip(e.target.value)} />
        </div>
      </div>

      <div className="form-section">More details</div>
      <div className="field-row">
        <div className="field">
          <label>License #</label>
          <input type="text" value={license} placeholder="optional"
            onChange={(e) => setLicense(e.target.value)} />
        </div>
        <div className="field">
          <label>Referred by</label>
          <input type="text" value={referredBy} placeholder="optional"
            onChange={(e) => setReferredBy(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea value={notes}
          placeholder="Rates, gate code, preferred hours, insurance details…"
          onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Sheet>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d || ''
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
