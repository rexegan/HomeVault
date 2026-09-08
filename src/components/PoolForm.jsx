import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { websiteFor, formatHours } from '../lib/hardware.js'
import { fetchPoolCompanies, POOL_TYPES, POOL_SURFACES, POOL_SANITIZERS, POOL_GALLONS } from '../lib/pool.js'

// The Swimming Pool's own profile: who built it (real local companies within
// ~25 miles), gallons, type, surface, sanitizer, heat, hot tub and more.
// Every field saves as you change it.
const YESNO = ['Yes', 'No']

function Select({ id, label, value, options, onChange, allowOther = true }) {
  const custom = value && !options.includes(value)
  return (
    <div className={'intake-field' + (value ? ' filled' : '')}>
      <label htmlFor={id}>
        <span className="chk" aria-hidden="true">{value ? '✓' : ''}</span>
        <span className="q">{label}</span>
      </label>
      <select id={id} value={custom ? '__other' : value}
        onChange={(e) => onChange(e.target.value === '__other' ? (custom ? value : ' ') : e.target.value)}>
        <option value="">Pick one…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
        {allowOther && <option value="__other">Other…</option>}
      </select>
      {custom && (
        <input type="text" value={value.trim()} style={{ marginTop: 8 }} autoFocus
          placeholder="Type it in" onChange={(e) => onChange(e.target.value || ' ')} />
      )}
    </div>
  )
}

export default function PoolForm({ area, values, onChange, coords, onAddPro, onClose, onSaved }) {
  const v = (k) => values?.[k] || ''
  const [companies, setCompanies] = useState(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (coords?.lat) {
      fetchPoolCompanies(coords.lat, coords.lon).then(setCompanies).catch(() => setCompanies([]))
    } else setCompanies([])
  }, [coords])

  const builder = v('builder').trim()
  const match = companies?.find((c) => c.name === builder)
  const hours = match ? formatHours(match.hours) : null

  const saveBuilderToPros = () => {
    onAddPro({
      trade: 'Pool service', name: match.name, owner: '',
      officePhone: match.phone || '', cellPhone: '', email: '',
      website: match.website || '', street: match.street || '', city: match.city || '',
      state: match.state || '', zip: match.zip || '', license: '',
      referredBy: 'Pool builder', notes: 'Built our pool', jobs: [],
    })
  }

  return (
    <Sheet title="Swimming Pool profile" onClose={onClose}
      footer={<button className="btn" onClick={onSaved || onClose} style={{ flex: 1 }}>Save</button>}>

      <div className={'intake-field' + (builder ? ' filled' : '')}>
        <label htmlFor="pool-builder">
          <span className="chk" aria-hidden="true">{builder ? '✓' : ''}</span>
          <span className="q">Who built your pool?</span>
        </label>
        {companies === null ? (
          <div className="hint">Finding pool companies within 25 miles…</div>
        ) : (
          <select id="pool-builder"
            value={companies.some((c) => c.name === builder) ? builder : (builder ? '__other' : '')}
            onChange={(e) => {
              const val = e.target.value
              onChange('builder', val === '__other' ? (builder && !companies.some((c) => c.name === builder) ? builder : ' ') : val)
            }}>
            <option value="">{companies.length ? 'Pick a pool company…' : 'None found nearby — type yours'}</option>
            {companies.map((c) => <option key={c.name} value={c.name}>{c.name} · {c.distLabel}</option>)}
            <option value="__other">Someone else…</option>
          </select>
        )}
        {companies !== null && builder && !companies.some((c) => c.name === builder) && (
          <input type="text" value={builder === ' ' ? '' : builder} style={{ marginTop: 8 }}
            placeholder="Builder's name" onChange={(e) => onChange('builder', e.target.value || ' ')} />
        )}
      </div>

      {match && (
        <div className="builder-card">
          <div className="bc-name">{match.name} <span className="bc-dist">{match.distLabel} away</span></div>
          {match.fullAddr && <div className="bc-line">📍 {match.fullAddr}</div>}
          {match.phone && <div className="bc-line">📞 <a href={'tel:' + match.phone.replace(/[^0-9+]/g, '')}>{match.phone}</a></div>}
          {hours && <div className="bc-line">🕒 {hours.join(' · ')}</div>}
          <div className="bc-line">🌐 <a href={websiteFor(match)} target="_blank" rel="noopener noreferrer">Website</a></div>
          <button className="file-btn" onClick={saveBuilderToPros}>
            <Icon.plus size={13} /> Save to My Pros
          </button>
        </div>
      )}

      <div className={'intake-field' + (v('gallons') ? ' filled' : '')}>
        <label htmlFor="pool-gallons">
          <span className="chk" aria-hidden="true">{v('gallons') ? '✓' : ''}</span>
          <span className="q">How many gallons?</span>
        </label>
        <input id="pool-gallons" type="text" inputMode="numeric" list="pool-gallons-dl"
          value={v('gallons')} placeholder="Pick or type…"
          onChange={(e) => onChange('gallons', e.target.value)} />
        <datalist id="pool-gallons-dl">
          {POOL_GALLONS.map((g) => <option key={g} value={g} />)}
        </datalist>
      </div>

      <Select id="pool-type" label="Type of pool" value={v('type')} options={POOL_TYPES}
        onChange={(val) => onChange('type', val)} />
      <Select id="pool-surface" label="Surface / finish" value={v('surface')} options={POOL_SURFACES}
        onChange={(val) => onChange('surface', val)} />
      <Select id="pool-sanitizer" label="Saltwater or chlorine?" value={v('sanitizer')} options={POOL_SANITIZERS}
        onChange={(val) => onChange('sanitizer', val)} />
      <Select id="pool-heated" label="Heated?" value={v('heated')} options={YESNO} allowOther={false}
        onChange={(val) => onChange('heated', val)} />
      <Select id="pool-hottub" label="Hot tub / spa attached?" value={v('hotTub')} options={YESNO} allowOther={false}
        onChange={(val) => onChange('hotTub', val)} />

      <div className="field-row">
        <div className={'intake-field' + (v('yearBuilt') ? ' filled' : '')} style={{ flex: 1 }}>
          <label htmlFor="pool-year"><span className="chk">{v('yearBuilt') ? '✓' : ''}</span><span className="q">Year built</span></label>
          <input id="pool-year" type="text" inputMode="numeric" value={v('yearBuilt')}
            placeholder="e.g. 2018" onChange={(e) => onChange('yearBuilt', e.target.value)} />
        </div>
        <div className={'intake-field' + (v('maxDepth') ? ' filled' : '')} style={{ flex: 1 }}>
          <label htmlFor="pool-depth"><span className="chk">{v('maxDepth') ? '✓' : ''}</span><span className="q">Deepest point</span></label>
          <input id="pool-depth" type="text" value={v('maxDepth')}
            placeholder="e.g. 8 ft" onChange={(e) => onChange('maxDepth', e.target.value)} />
        </div>
      </div>

      <div className={'intake-field' + (v('features') ? ' filled' : '')}>
        <label htmlFor="pool-features"><span className="chk">{v('features') ? '✓' : ''}</span><span className="q">Water features</span></label>
        <input id="pool-features" type="text" value={v('features')}
          placeholder="Waterfall, slide, tanning ledge, bubblers…"
          onChange={(e) => onChange('features', e.target.value)} />
      </div>

      <div className={'intake-field' + (v('notes') ? ' filled' : '')}>
        <label htmlFor="pool-notes"><span className="chk">{v('notes') ? '✓' : ''}</span><span className="q">Notes</span></label>
        <input id="pool-notes" type="text" value={v('notes')}
          placeholder="Resurfaced, equipment quirks, service schedule…"
          onChange={(e) => onChange('notes', e.target.value)} />
      </div>

      <div className="hint" style={{ marginTop: 4 }}>
        Saves as you go. Pool equipment itself (pump, filter, cleaner) lives as items in the
        Swimming Pool room.
      </div>
    </Sheet>
  )
}
