import { useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import FileThumb from './FileThumb.jsx'
import { Icon } from '../lib/icons.jsx'
import { Select, TextField } from './FinishesForm.jsx'
import { saveFile, getFileURL } from '../lib/db.js'
import { ocrImage, parseReceipt } from '../lib/scan.js'

// Cost basis: what the house cost to buy or build, plus every permanent
// improvement or addition since. Lives under the mortgage on the Financial page.

const num = (v) => {
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}
const dollars = (n) => '$' + Math.round(n).toLocaleString()
const isoToMdy = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[2] + '/' + m[3] + '/' + m[1] : '' }
const sortKey = (mdy) => { const m = String(mdy || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? m[3] + m[1] + m[2] : '' }

export const IMPROVEMENT_KINDS = [
  'Fencing', 'Swimming pool / spa', 'Garage conversion', 'Room addition', 'New cabinets', 'New flooring',
  'Countertops', 'Kitchen remodel', 'Bathroom remodel', 'Roof replacement', 'HVAC system',
  'Windows & doors', 'Siding', 'Insulation', 'Patio / deck / pergola', 'Driveway / concrete',
  'Outdoor kitchen', 'Landscaping / irrigation', 'Storage building / shed', 'Solar panels',
  'Whole-house generator', 'Water heater', 'Plumbing / re-pipe', 'Electrical / panel upgrade',
  'Foundation work', 'Septic system', 'Water well', 'Built-ins / shelving',
]

export function basisTotals(values) {
  const v = (k) => values?.['basis.' + k] || ''
  const list = Array.isArray(values?.['basis.improvements']) ? values['basis.improvements'] : []
  const price = num(v('price'))
  const extra = num(v('extra'))
  const improvements = list.reduce((t, e) => t + num(e.cost), 0)
  return { price, extra, improvements, count: list.length, total: price + extra + improvements, list }
}

export default function CostBasis({ values, onChange, areas = [], pros = [], finishes = {} }) {
  const v = (k) => values?.['basis.' + k] || ''
  const set = (k, val) => onChange('basis.' + k, val)
  const t = basisTotals(values)
  const list = t.list
  const [open, setOpen] = useState(list.length > 0)
  const [editing, setEditing] = useState(null)   // null | entry | {} (new)
  const how = v('how').replace(/ it$/, '')   // older saves said "Bought it" / "Built it"
  const built = how === 'Built'

  const saveEntry = (draft) => {
    const entry = { ...draft, id: draft.id || 'imp-' + Date.now().toString(36) }
    const next = draft.id ? list.map((e) => (e.id === draft.id ? entry : e)) : [...list, entry]
    set('improvements', next)
    setEditing(null)
    setOpen(true)
  }
  const deleteEntry = (id) => { set('improvements', list.filter((e) => e.id !== id)); setEditing(null) }

  // New flooring already recorded in the rooms — one tap adds it here.
  const areaName = (id) => areas.find((a) => a.id === id)?.name || 'A room'
  const usedFinish = new Set(list.map((e) => e.fromFinish).filter(Boolean))
  const suggestions = Object.entries(finishes || {}).flatMap(([areaId, entries]) =>
    (entries || []).filter((e) => e.kind === 'Flooring' && num(e.totalCost) > 0 && !usedFinish.has(e.id))
      .map((e) => ({ areaId, e })))

  const sorted = [...list].sort((a, b) => sortKey(b.date).localeCompare(sortKey(a.date)))

  return (
    <div className="basis">
      <div className="basis-head">
        <h4>Cost basis</h4>
        <span>What you paid or spent to build, plus every permanent improvement since.</span>
      </div>

      <div className="basis-cols">
        <Select id="basis-how" label="Bought or built?" value={how} options={['Bought', 'Built']}
          onChange={(val) => set('how', val)} />
        <TextField id="basis-price" label={built ? 'Build price' : 'Purchase price'} value={v('price')}
          onChange={(val) => set('price', val)} opt={{ money: true, hint: '$' }} />
        <TextField id="basis-date" label={built ? 'Date finished' : 'Date bought'} value={v('date')}
          onChange={(val) => set('date', val)} opt={{ date: true }} />
        <TextField id="basis-extra" label={built ? 'Land / lot cost' : 'Closing costs you paid'} value={v('extra')}
          onChange={(val) => set('extra', val)} opt={{ money: true, hint: built ? 'If not in the build price' : 'From your closing statement' }} />
      </div>

      <button type="button" className={'basis-tab' + (open ? ' open' : '')} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="bt-title">🔨 Improvements & additions</span>
        <span className="bt-meta">{t.count ? t.count + ' · ' + dollars(t.improvements) : 'none yet'}</span>
        <span className="bt-caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="basis-panel">
          <p className="basis-note">
            Anything permanent that adds value or extends the home's life — fencing, a pool, a converted
            garage, new cabinets, new flooring, a new roof. Everyday repairs and upkeep don't count.
          </p>

          {sorted.length > 0 && (
            <div className="fin-entries">
              {sorted.map((e) => (
                <button type="button" className="fin-entry" key={e.id} onClick={() => setEditing(e)}>
                  <span className="fe-kind basis-kind">{(e.kind || 'Other').trim() || 'Other'}</span>
                  <span className="fe-body">
                    <span className="fe-title">{e.what || e.kind || 'Improvement'}</span>
                    <span className="fe-sub">{[e.where, e.doneBy && 'by ' + e.doneBy, e.files?.length && '📎 receipt'].filter(Boolean).join(' · ') || 'Tap to add details'}</span>
                  </span>
                  <span className="fe-meta">
                    {num(e.cost) > 0 && <span className="fe-cost">{dollars(num(e.cost))}</span>}
                    {e.date && <span className="fe-date">{e.date}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="basis-suggest">
              <div className="bs-title">Found in your rooms</div>
              {suggestions.map(({ areaId, e }) => (
                <div className="bs-row" key={e.id}>
                  <span>New flooring — {areaName(areaId)}{e.product ? ' (' + e.product + ')' : ''} · {dollars(num(e.totalCost))}</span>
                  <button type="button" className="file-btn" onClick={() => saveEntry({
                    kind: 'New flooring', what: [e.product, e.finish].filter(Boolean).join(' ') || 'New flooring',
                    where: areaName(areaId), date: e.date || '', cost: e.totalCost, doneBy: e.doneBy || '',
                    files: e.files || [], fromFinish: e.id,
                  })}>+ Add</button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="btn secondary small" onClick={() => setEditing({})}>
            <Icon.plus size={16} /> Add an improvement
          </button>
        </div>
      )}

      <div className="basis-total">
        <div><span>{built ? 'Built for' : 'Paid'}</span><b>{t.price ? dollars(t.price) : '—'}</b></div>
        <div><span>{built ? 'Land' : 'Closing'}</span><b>{t.extra ? dollars(t.extra) : '—'}</b></div>
        <div><span>Improvements</span><b>{t.improvements ? dollars(t.improvements) : '—'}</b></div>
        <div className="grand"><span>Cost basis</span><b>{t.total ? dollars(t.total) : '—'}</b></div>
      </div>
      <div className="basis-fine">Keep the receipts — when you sell, this total can lower the taxable gain. Your tax preparer has the final word.</div>

      {editing && (
        <ImprovementForm entry={editing} areas={areas} pros={pros}
          knownPeople={[...new Set(list.map((e) => (e.doneBy || '').trim()).filter(Boolean))]}
          onSave={saveEntry} onDelete={() => deleteEntry(editing.id)} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}

function ImprovementForm({ entry, areas, pros, knownPeople, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ files: [], ...entry }))
  const [scan, setScan] = useState(null)
  const [busy, setBusy] = useState(false)
  const camRef = useRef(null)
  const libRef = useRef(null)
  const set = (k, val) => setDraft((d) => ({ ...d, [k]: val }))
  const v = (k) => draft[k] || ''
  const editing = !!entry?.id
  const files = draft.files || []

  const whereOptions = ['Whole house', 'Outside / yard', ...areas.map((a) => a.name).filter(Boolean)]
  const proNames = new Set(pros.map((p) => (p.name || '').trim().toLowerCase()))
  const doneByOptions = [
    { value: 'Us', text: 'Us — did it ourselves' },
    ...pros.map((p) => ({ value: p.name, text: p.name + (p.trade ? ' · ' + p.trade : '') })),
    ...knownPeople.filter((n) => n !== 'Us' && !proNames.has(n.toLowerCase())).map((n) => ({ value: n, text: n + ' · used before' })),
  ]

  const onReceipt = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setScan({ busy: true, msg: 'Reading the receipt…' })
    try {
      const stored = await saveFile(file)
      setDraft((d) => ({ ...d, files: [...(d.files || []), stored] }))
      if (!file.type.startsWith('image/')) { setScan({ msg: 'PDF attached — type the total in.' }); return }
      const text = await ocrImage(file, (m) => setScan({ busy: true, msg: m }))
      const r = parseReceipt(text)
      setDraft((d) => ({
        ...d,
        cost: r.price || d.cost,
        date: d.date || (r.purchaseDate ? isoToMdy(r.purchaseDate) : ''),
      }))
      setScan(r.price
        ? { msg: 'Read ' + r.price + (r.vendor ? ' from ' + r.vendor : '') + ' — please check it. Receipt attached.' }
        : { msg: 'Receipt attached, but I couldn’t read a total — type it in.', err: true })
    } catch (err) {
      console.warn('Receipt scan failed', err)
      setScan({ msg: 'Couldn’t read that photo — type the total in. (It was still attached.)', err: true })
    }
  }
  const onPick = async (e) => {
    const picked = [...(e.target.files || [])]
    e.target.value = ''
    if (!picked.length) return
    setBusy(true)
    try {
      const saved = []
      for (const f of picked) saved.push(await saveFile(f))
      set('files', [...files, ...saved])
    } finally { setBusy(false) }
  }
  const openFile = async (f) => { const url = await getFileURL(f.id); if (url) window.open(url, '_blank', 'noopener') }

  return (
    <Sheet title={editing ? 'Edit improvement' : 'New improvement or addition'} onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="link-danger" onClick={() => { if (confirm('Delete this improvement?')) onDelete() }}><Icon.trash size={18} /></button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(draft)} disabled={busy || scan?.busy}>Save</button>
        </>
      }>
      <Select id="imp-kind" label="What was added or improved?" value={v('kind')} options={IMPROVEMENT_KINDS}
        onChange={(val) => set('kind', val)} otherLabel="Something else…" />
      <TextField id="imp-what" label="Description" value={v('what')} onChange={(val) => set('what', val)}
        opt={{ hint: 'e.g. 6-ft cedar privacy fence, 240 ft' }} />
      <Select id="imp-where" label="Where" value={v('where')} options={whereOptions}
        onChange={(val) => set('where', val)} />
      <TextField id="imp-date" label="Date finished" value={v('date')} onChange={(val) => set('date', val)} opt={{ date: true }} />
      <TextField id="imp-cost" label="Total cost" value={v('cost')} onChange={(val) => set('cost', val)} opt={{ money: true, hint: '$' }} />
      <div className="fx-scan">
        <button type="button" className="file-btn" onClick={() => camRef.current?.click()} disabled={scan?.busy}>📷 Snap the receipt</button>
        <button type="button" className="file-btn" onClick={() => libRef.current?.click()} disabled={scan?.busy}>🖼 Choose a photo</button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onReceipt} />
        <input ref={libRef} type="file" accept="image/*,application/pdf" hidden onChange={onReceipt} />
        {scan?.msg && <div className={'hint' + (scan.err ? ' err' : '')} style={{ width: '100%' }}>{scan.busy && <span className="snap-spinner" aria-hidden="true" style={{ marginRight: 6 }} />}{scan.msg}</div>}
      </div>
      <Select id="imp-doneby" label="Done by" value={v('doneBy')} options={doneByOptions}
        onChange={(val) => set('doneBy', val)} otherLabel="Someone else…" />

      <div className="field">
        <label>Receipts, contracts & photos</label>
        {files.length > 0 && (
          <div className="attach-list">
            {files.map((f) => (
              <div className="attach" key={f.id}>
                <span className="th" onClick={() => openFile(f)} style={{ cursor: 'pointer' }}><FileThumb file={f} /></span>
                <span className="nm">{f.name}</span>
                <button className="rm" onClick={() => set('files', files.filter((x) => x.id !== f.id))} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
        <label className="add-file" style={{ marginTop: files.length ? 8 : 0 }}>
          <Icon.plus size={18} /> {busy ? 'Adding…' : 'Attach a file'}
          <input type="file" accept="image/*,application/pdf" multiple onChange={onPick} />
        </label>
      </div>

      <TextField id="imp-notes" label="Notes" value={v('notes')} onChange={(val) => set('notes', val)}
        opt={{ hint: 'Permit number, warranty on the work…' }} />
    </Sheet>
  )
}
