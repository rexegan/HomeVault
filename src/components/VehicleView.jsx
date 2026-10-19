import { useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import FileThumb from './FileThumb.jsx'
import { Icon } from '../lib/icons.jsx'
import { Select, TextField } from './FinishesForm.jsx'
import { saveFile, getFileURL } from '../lib/db.js'
import {
  MAKES, YEARS, TRANSMISSIONS, FUELS, DRIVES, OILS, SHOPS, RECALL_STATUS, LOG_KINDS, KIND, NHTSA_VIN_CHECK,
  vehicleTitle, currentMileage, dueItems, withDefaultDue, parseMDY, cost, decodeVin, fetchRecalls,
} from '../lib/vehicles.js'

// One vehicle: everything about the car, plus a dated log of everything done to
// it — oil changes, tires, batteries, paint & body work, detailing, recalls —
// with mileage, receipts and what it cost.

const dollars = (n) => '$' + Math.round(n).toLocaleString()
const byDate = (a, b) => (parseMDY(b.date)?.getTime() || 0) - (parseMDY(a.date)?.getTime() || 0)

export default function VehicleView({ vehicle: v, today, onEdit, onSaveLog, onDeleteLog }) {
  const [editing, setEditing] = useState(null)       // null | {} | log entry
  const [filter, setFilter] = useState('')
  const [recalls, setRecalls] = useState(null)       // null | {busy} | {list} | {error}
  const log = useMemo(() => [...(v.log || [])].sort(byDate), [v.log])
  const shown = filter ? log.filter((e) => e.kind === filter) : log
  // Show what is due or coming up — not a battery that is three years away.
  const due = useMemo(() => dueItems(v, today).filter((d) =>
    d.state !== 'ok' || (d.daysLeft !== null && d.daysLeft <= 180) || (d.milesLeft !== null && d.milesLeft <= 2500)), [v, today])
  const mileNow = currentMileage(v)
  const spent = log.filter((e) => e.kind !== 'Manufacturer recall').reduce((t, e) => t + cost(e.totalCost), 0)
  const lastOil = log.find((e) => e.kind === 'Oil change')
  const kindsPresent = [...new Set(log.map((e) => e.kind))]

  const details = [
    ['VIN', v.vin], ['Color', v.color], ['Body', v.body], ['Engine', v.engine], ['Transmission', v.transmission],
    ['Fuel', v.fuel], ['Drive', v.drive], ['License plate', [v.plate, v.plateState].filter(Boolean).join(' · ')],
    ['Tire size', v.tireSize], ['Oil type', v.oilType], ['Oil capacity', v.oilCapacity], ['Battery', v.batteryGroup],
    ['Bought', [v.purchaseDate, v.purchasePrice, v.purchasedFrom && 'from ' + v.purchasedFrom].filter(Boolean).join(' · ')],
    ['Miles when bought', v.mileageAtPurchase], ['Registration expires', v.regExpires], ['Inspection due', v.inspectionDue],
    ['Insurance', [v.insurer, v.policy && '#' + v.policy].filter(Boolean).join(' · ')],
    ['Loan / lender', v.lender], ['Warranty', v.warranty], ['Keys & spares', v.keys], ['Notes', v.notes],
  ].filter(([, val]) => val && String(val).trim())

  const checkRecalls = async () => {
    if (!v.make || !v.model || !v.year) { setRecalls({ error: 'Add the year, make and model first (a VIN decode fills them in).' }); return }
    setRecalls({ busy: true })
    try {
      const list = await fetchRecalls({ make: v.make, model: v.model, year: v.year })
      setRecalls({ list })
    } catch (e) {
      setRecalls({ error: 'The federal recall service didn’t answer — try again in a minute.' })
    }
  }

  return (
    <div className="vehicle">
      <div className="area-hero">
        <span className="icon"><Icon.car size={30} /></span>
        <div>
          <h2>{vehicleTitle(v)}</h2>
          <div className="sub">{[v.nickname && '“' + v.nickname + '”', v.color, v.plate].filter(Boolean).join(' · ') || 'Add details with Edit'}</div>
        </div>
        <button className="edit" onClick={onEdit}><Icon.edit size={16} /> Edit</button>
      </div>

      <div className="fin-quick">
        <div className="stat"><div className="n" style={{ fontSize: 18 }}>{mileNow ? mileNow.toLocaleString() : '—'}</div><div className="l">Miles now</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 18 }}>{spent ? dollars(spent) : '—'}</div><div className="l">Spent on upkeep</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 16 }}>{lastOil?.date || '—'}</div><div className="l">Last oil change</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 18 }}>{log.length}</div><div className="l">Jobs logged</div></div>
      </div>

      {due.length > 0 && (
        <div className="veh-due">
          {due.map((d) => (
            <span key={d.key} className={'veh-due-chip ' + d.state}>
              <b>{d.label}</b>
              {' · '}
              {[d.milesLeft !== null && d.milesLeft !== undefined && (d.milesLeft <= 0 ? Math.abs(d.milesLeft).toLocaleString() + ' mi over' : d.milesLeft.toLocaleString() + ' mi left'),
                d.daysLeft !== null && d.daysLeft !== undefined && (d.daysLeft <= 0 ? Math.abs(d.daysLeft) + ' days over' : 'in ' + d.daysLeft + ' days')]
                .filter(Boolean).join(' / ')}
            </span>
          ))}
        </div>
      )}

      {details.length > 0 && (
        <div className="pool-summary" style={{ cursor: 'default' }}>
          <div className="pool-summary-head"><span>🚗 About this vehicle</span></div>
          <div className="pool-summary-grid">
            {details.map(([k, val]) => (
              <div className="ps-cell" key={k}><div className="ps-k">{k}</div><div className="ps-v">{val}</div></div>
            ))}
          </div>
        </div>
      )}

      <div className="pool-summary finishes-summary" style={{ cursor: 'default' }}>
        <div className="pool-summary-head">
          <span>⚠️ Manufacturer recalls</span>
          <button className="btn small" onClick={checkRecalls} disabled={recalls?.busy}>
            {recalls?.busy ? 'Checking…' : 'Check now'}
          </button>
        </div>
        {!recalls && (
          <div className="pool-summary-empty">
            Pulls the federal (NHTSA) recall campaigns for a {[v.year, v.make, v.model].filter(Boolean).join(' ') || 'this model'}.
            To see whether <b>your exact vehicle</b> has an unrepaired recall,{' '}
            <a href={NHTSA_VIN_CHECK} target="_blank" rel="noopener noreferrer">use NHTSA’s official VIN check ↗</a>
            {v.vin ? ' — your VIN is ' + v.vin + '.' : '.'}
          </div>
        )}
        {recalls?.error && <div className="hw-error" style={{ margin: '8px 0 0' }}>{recalls.error}</div>}
        {recalls?.list && (
          recalls.list.length === 0 ? (
            <div className="pool-summary-empty">No recall campaigns on file for this model year. 🎉 Re-check now and then.</div>
          ) : (
            <div className="veh-recalls">
              <div className="hint">{recalls.list.length} campaign{recalls.list.length === 1 ? '' : 's'} for the {v.year} {v.make} {v.model} —
                these are model-wide; your exact vehicle may not be affected.
                {' '}<a href={NHTSA_VIN_CHECK} target="_blank" rel="noopener noreferrer">Check your VIN ↗</a></div>
              {recalls.list.slice(0, 12).map((r) => (
                <details className="veh-recall" key={r.NHTSACampaignNumber}>
                  <summary>
                    <b>{r.NHTSACampaignNumber}</b> · {String(r.Component || '').replace(/:/g, ' › ').toLowerCase()}
                  </summary>
                  <p>{r.Summary}</p>
                  {r.Consequence && <p><b>Risk:</b> {r.Consequence}</p>}
                  {r.Remedy && <p><b>Fix:</b> {r.Remedy}</p>}
                  <button className="file-btn" onClick={() => setEditing({
                    kind: 'Manufacturer recall', recallNo: r.NHTSACampaignNumber,
                    what: String(r.Component || '').replace(/:/g, ' › ').toLowerCase(), recallStatus: RECALL_STATUS[0],
                  })}>+ Log this recall</button>
                </details>
              ))}
            </div>
          )
        )}
      </div>

      <div className="section-row" style={{ marginTop: 18 }}>
        <h3>Service &amp; care log</h3>
        <button className="btn small" onClick={() => setEditing({})}><Icon.plus size={14} /> Add</button>
      </div>

      {kindsPresent.length > 1 && (
        <div className="lawn-areas" role="group" aria-label="Filter by type">
          <button className={'lawn-chip' + (filter ? '' : ' on')} onClick={() => setFilter('')}>All <span>{log.length}</span></button>
          {kindsPresent.map((k) => (
            <button key={k} className={'lawn-chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(filter === k ? '' : k)}>
              {k} <span>{log.filter((e) => e.kind === k).length}</span>
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="pool-summary finishes-summary">
          <div className="pool-summary-empty">
            Nothing logged yet. Add the oil changes, new tires, battery, tune-ups, body work, detailing and
            recalls — each with its mileage, receipt and cost.
          </div>
        </div>
      ) : (
        <div className="fin-entries">
          {shown.map((e) => (
            <button className="fin-entry" key={e.id} onClick={() => setEditing(e)}>
              <span className="fe-kind veh-kind">{e.kind.split(' & ')[0].split(' / ')[0]}</span>
              <span className="fe-body">
                <span className="fe-title">
                  {e.what || e.kind}
                  {e.mileage ? <span className="fe-qty"> · {e.mileage} mi</span> : null}
                </span>
                <span className="fe-sub">
                  {[e.shop, e.recallNo && 'Recall ' + e.recallNo, e.recallStatus, e.files?.length && '📎 ' + e.files.length,
                    e.nextDueMileage && 'next ' + e.nextDueMileage + ' mi', e.nextDueDate && 'next ' + e.nextDueDate]
                    .filter(Boolean).join(' · ')}
                </span>
              </span>
              <span className="fe-meta">
                {e.date && <span className="fe-date">{e.date}</span>}
                {e.totalCost && <span className="fe-cost">{e.totalCost}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="intake-foot" style={{ marginTop: 16 }}>
        <Icon.shield size={18} />
        <span>Everything about your vehicles stays on this device and is included in your full backup,
          receipts and all.</span>
      </div>

      {editing && (
        <LogForm
          entry={editing.id ? editing : null}
          preset={editing.id ? null : editing}
          mileNow={mileNow}
          onClose={() => setEditing(null)}
          onSave={(draft) => { onSaveLog(editing.id || null, withDefaultDue(draft)); setEditing(null) }}
          onDelete={() => { onDeleteLog(editing.id); setEditing(null) }}
        />
      )}
    </div>
  )
}

function LogForm({ entry, preset, mileNow, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ kind: 'Oil change', files: [], ...(preset || {}), ...(entry || {}) }))
  const [busy, setBusy] = useState(false)
  const set = (k, val) => setDraft((d) => ({ ...d, [k]: val }))
  const v = (k) => draft[k] || ''
  const editing = !!entry?.id
  const kd = KIND[v('kind')] || KIND.Other
  const files = draft.files || []

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

  const iv = kd.interval
  const intervalHint = iv ? 'Leave blank to use the usual ' + [iv.mi && iv.mi.toLocaleString() + ' miles', iv.months && iv.months + ' months'].filter(Boolean).join(' / ') : ''

  return (
    <Sheet title={editing ? 'Edit entry' : 'Add to the log'} onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="link-danger" onClick={() => { if (confirm('Delete this entry?')) onDelete() }}><Icon.trash size={18} /></button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(draft)} disabled={busy}>Save</button>
        </>
      }>

      <div className="intake-field filled" style={{ marginBottom: 12 }}>
        <label htmlFor="vl-kind"><span className="chk">✓</span><span className="q">What was done?</span></label>
        <select id="vl-kind" value={v('kind')} onChange={(e) => set('kind', e.target.value)}>
          {LOG_KINDS.map((x) => <option key={x.k} value={x.k}>{x.k}</option>)}
        </select>
      </div>

      <TextField id="vl-what" label={kd.recall ? 'What the recall fixes' : 'Details'} value={v('what')}
        onChange={(val) => set('what', val)} opt={{ hint: kd.hint || 'Add detail…' }} />
      <TextField id="vl-date" label="When" value={v('date')} onChange={(val) => set('date', val)} opt={{ date: true }} />
      <TextField id="vl-mileage" label={'Mileage' + (mileNow ? ' (now about ' + mileNow.toLocaleString() + ')' : '')}
        value={v('mileage')} onChange={(val) => set('mileage', val)} opt={{ miles: true, hint: 'Odometer reading' }} />
      <Select id="vl-shop" label="Who did it / where" value={v('shop')} options={SHOPS}
        onChange={(val) => set('shop', val)} otherLabel="Somewhere else…" />
      <TextField id="vl-cost" label="Total cost" value={v('totalCost')} onChange={(val) => set('totalCost', val)} opt={{ money: true }} />

      {kd.recall && (
        <>
          <TextField id="vl-recallNo" label="Recall / campaign number" value={v('recallNo')}
            onChange={(val) => set('recallNo', val)} opt={{ hint: 'e.g. 23V-123' }} />
          <Select id="vl-recallStatus" label="Status" value={v('recallStatus')} options={RECALL_STATUS}
            onChange={(val) => set('recallStatus', val)} />
        </>
      )}

      {iv && (
        <>
          <TextField id="vl-nextMi" label="Next due at (miles)" value={v('nextDueMileage')}
            onChange={(val) => set('nextDueMileage', val)} opt={{ miles: true, hint: intervalHint }} />
          <TextField id="vl-nextDate" label="Next due on" value={v('nextDueDate')}
            onChange={(val) => set('nextDueDate', val)} opt={{ date: true }} />
        </>
      )}

      <div className="field">
        <label>Receipt / photos</label>
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
          <Icon.plus size={18} /> {busy ? 'Adding…' : 'Attach receipt or photo'}
          <input type="file" accept="image/*,application/pdf" multiple onChange={onPick} />
        </label>
      </div>

      <TextField id="vl-notes" label="Notes" value={v('notes')} onChange={(val) => set('notes', val)}
        opt={{ hint: 'Parts used, warranty on the work, what to watch…' }} />
    </Sheet>
  )
}

// The vehicle record itself (add / edit), with a VIN decoder.
export function VehicleForm({ vehicle, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...vehicle }))
  const [vinMsg, setVinMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k, val) => setDraft((d) => ({ ...d, [k]: val }))
  const v = (k) => draft[k] || ''
  const editing = !!vehicle?.id

  const decode = async () => {
    const vin = v('vin').replace(/\s+/g, '').toUpperCase()
    if (vin.length !== 17) { setVinMsg({ err: 'A VIN is 17 characters — it is on the driver-side dash corner and your registration.' }); return }
    setBusy(true); setVinMsg(null)
    try {
      const d = await decodeVin(vin)
      setDraft((cur) => ({
        ...cur, vin,
        year: d.year || cur.year, make: d.make || cur.make, model: d.model || cur.model, trim: d.trim || cur.trim,
        body: d.body || cur.body, engine: d.engine || cur.engine, fuel: d.fuel || cur.fuel,
        drive: d.drive || cur.drive, transmission: d.transmission || cur.transmission,
      }))
      setVinMsg({ ok: `Found it: ${[d.year, d.make, d.model, d.trim].filter(Boolean).join(' ')}${d.plant ? ' — built in ' + d.plant : ''}.` +
        (d.warning ? ' (Heads up: ' + d.warning + ')' : '') })
    } catch (e) {
      setVinMsg({ err: e.message || 'Could not decode that VIN.' })
    } finally { setBusy(false) }
  }

  const T = (id, label, key, opt) => <TextField id={'vh-' + id} label={label} value={v(key)} onChange={(val) => set(key, val)} opt={opt || {}} />

  return (
    <Sheet title={editing ? 'Edit vehicle' : 'Add a vehicle'} onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="link-danger" onClick={() => { if (confirm('Delete this vehicle and its whole service log?')) onDelete() }}><Icon.trash size={18} /></button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(draft)}>Save</button>
        </>
      }>

      <div className={'intake-field' + (v('vin').trim() ? ' filled' : '')} style={{ marginBottom: 12 }}>
        <label htmlFor="vh-vin"><span className="chk">{v('vin').trim() ? '✓' : ''}</span><span className="q">VIN (serial number)</span></label>
        <div className="hoa-row">
          <input id="vh-vin" type="text" value={v('vin')} placeholder="17 characters" autoCapitalize="characters"
            onChange={(e) => set('vin', e.target.value.toUpperCase())} style={{ flex: 1, minWidth: 0 }} />
          <button type="button" className="btn small" onClick={decode} disabled={busy}>{busy ? 'Looking…' : 'Fill from VIN'}</button>
        </div>
        {vinMsg?.ok && <div className="hint" style={{ marginTop: 6, color: '#2f6b22' }}>{vinMsg.ok}</div>}
        {vinMsg?.err && <div className="hint" style={{ marginTop: 6, color: '#a3261b' }}>{vinMsg.err}</div>}
      </div>

      <Select id="vh-year" label="Year" value={v('year')} options={YEARS} onChange={(val) => set('year', val)} />
      <Select id="vh-make" label="Make" value={v('make')} options={MAKES} onChange={(val) => set('make', val)} otherLabel="Another make…" />
      {T('model', 'Model', 'model', { hint: 'e.g. Tacoma, CR-V, F-150' })}
      {T('trim', 'Trim / package', 'trim', { hint: 'e.g. TRD Off-Road, EX-L' })}
      {T('nickname', 'Nickname', 'nickname', { hint: 'e.g. “The Blue Truck”' })}
      {T('color', 'Color', 'color', { hint: 'Name & paint code if you know it' })}
      {T('body', 'Body style', 'body', { hint: 'Pickup, SUV, sedan…' })}
      {T('engine', 'Engine', 'engine', { hint: 'e.g. 3.5L 6-cyl' })}
      <Select id="vh-trans" label="Transmission" value={v('transmission')} options={TRANSMISSIONS} onChange={(val) => set('transmission', val)} />
      <Select id="vh-fuel" label="Fuel" value={v('fuel')} options={FUELS} onChange={(val) => set('fuel', val)} />
      <Select id="vh-drive" label="Drive" value={v('drive')} options={DRIVES} onChange={(val) => set('drive', val)} />

      {T('plate', 'License plate', 'plate')}
      {T('plateState', 'Plate state', 'plateState', { hint: 'e.g. TX' })}
      {T('reg', 'Registration expires', 'regExpires', { date: true })}
      {T('insp', 'Inspection due', 'inspectionDue', { date: true })}

      {T('tire', 'Tire size', 'tireSize', { hint: 'e.g. 265/70R17 — on the tire sidewall' })}
      <Select id="vh-oil" label="Oil type" value={v('oilType')} options={OILS} onChange={(val) => set('oilType', val)} />
      {T('oilcap', 'Oil capacity', 'oilCapacity', { hint: 'e.g. 6.4 quarts' })}
      {T('batt', 'Battery size', 'batteryGroup', { hint: 'e.g. Group 24F' })}

      {T('pdate', 'Date bought', 'purchaseDate', { date: true })}
      {T('pprice', 'Price paid', 'purchasePrice', { money: true })}
      {T('pfrom', 'Bought from', 'purchasedFrom', { hint: 'Dealer or seller' })}
      {T('pmiles', 'Miles when bought', 'mileageAtPurchase', { miles: true })}
      {T('miles', 'Current mileage', 'currentMileage', { miles: true, hint: 'Updates itself as you log service' })}

      {T('ins', 'Insurance company', 'insurer')}
      {T('policy', 'Policy number', 'policy')}
      {T('lender', 'Loan / lender', 'lender', { hint: 'Or “paid off”' })}
      {T('warr', 'Warranty', 'warranty', { hint: 'e.g. 5 yr / 60,000 mi powertrain' })}
      {T('keys', 'Keys & spares', 'keys', { hint: 'Where the spare fob lives' })}
      {T('notes', 'Notes', 'notes')}
    </Sheet>
  )
}
