import Sheet from './Sheet.jsx'
import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { formatPrice } from '../lib/storage.js'

// One Paint / Flooring / Wallpaper entry. Where, brand and store are dropdowns
// that change with the kind of work — brands per trade, and stores that mix the
// usual chains with real shops within ~20 miles of the home.
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

const WHERE_OPTIONS = ['Whole room', 'Accent wall', 'Ceiling', 'Front wall', 'Back wall',
  'Side walls', 'Backsplash', 'Trim & baseboards', 'Floor', 'Cabinets', 'Stairs / hallway']

const BRANDS = {
  'Paint': ['Sherwin-Williams', 'Behr', 'Benjamin Moore', 'PPG', 'Valspar', 'Glidden',
    'Kilz', 'Zinsser', 'Rust-Oleum', 'Magnolia Home'],
  'Flooring': ['Shaw', 'Mohawk', 'Pergo', 'LifeProof', 'COREtec', 'Armstrong',
    'Mannington', 'TrafficMaster', 'Bruce Hardwood', 'Karndean'],
  'Wallpaper': ['York', 'Brewster', 'Graham & Brown', 'RoomMates', 'NuWallpaper',
    'Tempaper', 'A-Street Prints', 'Rifle Paper Co.', 'Magnolia Home', 'Milton & King'],
  'Tile / backsplash': ['Daltile', 'MSI', 'American Olean', 'Marazzi', 'Merola Tile',
    'Jeffrey Court', 'Arizona Tile', 'Bedrosians', 'SomerTile', 'Emser'],
  'Countertops': ['Silestone', 'Cambria', 'Caesarstone', 'MSI Q Quartz', 'Corian',
    'Formica', 'Wilsonart', 'LG Viatera', 'Granite (slab yard)', 'Butcher block'],
  'Trim / molding': ['Metrie', 'Woodgrain', 'Alexandria Moulding', 'Finished Elegance',
    'House of Fara', 'Royal PVC', 'MDF (generic)', 'Pine (generic)'],
  'Hardware': ['Amerock', 'Liberty', 'Franklin Brass', 'Top Knobs', 'Kwikset',
    'Schlage', 'Baldwin', 'Emtek', 'Richelieu', 'Hickory Hardware'],
  'Other': [],
}

const STORES = {
  'Paint': ['Sherwin-Williams store', 'Home Depot', "Lowe's", 'Benjamin Moore dealer',
    'PPG Paints store', 'Ace Hardware', 'Walmart', 'Menards', 'True Value', 'Amazon'],
  'Flooring': ['Floor & Decor', 'Home Depot', "Lowe's", 'LL Flooring', 'Carpet One',
    'Flooring America', 'Local flooring showroom', 'Costco', 'Menards', 'Amazon'],
  'Wallpaper': ['Home Depot', "Lowe's", 'Amazon', 'Wayfair', 'Sherwin-Williams store',
    'Walmart', 'Etsy', 'Spoonflower', 'Local wallpaper showroom'],
  'Tile / backsplash': ['Floor & Decor', 'Daltile showroom', 'Home Depot', "Lowe's",
    'MSI dealer', 'Arizona Tile', 'Bedrosians', 'Local tile shop', 'Wayfair', 'Amazon'],
  'Countertops': ['Local stone fabricator', 'Home Depot', "Lowe's", 'IKEA', 'Costco',
    'MSI dealer', 'Floor & Decor', 'Stone slab yard'],
  'Trim / molding': ['Home Depot', "Lowe's", 'Local lumber yard', "McCoy's", 'Menards',
    '84 Lumber', 'Ace Hardware'],
  'Hardware': ['Home Depot', "Lowe's", 'Amazon', 'Ace Hardware', 'Build.com', 'Wayfair',
    'Menards', 'Walmart', 'Restoration Hardware'],
  'Other': ['Home Depot', "Lowe's", 'Amazon', 'Walmart', 'Costco', 'Ace Hardware'],
}

function Select({ id, label, value, options, onChange, otherLabel = 'Other…' }) {
  const custom = value.trim() !== '' && !options.some((o) => (o.value ?? o) === value)
  return (
    <div className={'intake-field' + (value.trim() ? ' filled' : '')} style={{ marginBottom: 12 }}>
      <label htmlFor={id}>
        <span className="chk" aria-hidden="true">{value.trim() ? '✓' : ''}</span>
        <span className="q">{label}</span>
      </label>
      <select id={id} value={custom ? '__other' : value}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === '__other' ? (custom ? value : ' ') : val)
        }}>
        <option value="">Pick one…</option>
        {options.map((o) => {
          const val = o.value ?? o
          return <option key={val} value={val}>{o.text ?? o}</option>
        })}
        <option value="__other">{otherLabel}</option>
      </select>
      {custom && (
        <input type="text" value={value.trim()} style={{ marginTop: 8 }}
          placeholder="Type it in" onChange={(e) => onChange(e.target.value || ' ')} />
      )}
    </div>
  )
}

function TextField({ id, label, value, onChange, opt = {} }) {
  const filled = value.trim() !== ''
  return (
    <div className={'intake-field' + (filled ? ' filled' : '')} style={{ marginBottom: 12 }}>
      <label htmlFor={id}>
        <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
        <span className="q">{label}</span>
      </label>
      <input id={id} type="text" value={value}
        inputMode={opt.date || opt.money ? 'numeric' : undefined}
        placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
        onChange={(e) => onChange(opt.date ? maskDate(e.target.value) : e.target.value)}
        onBlur={opt.money ? () => onChange(money(value)) : undefined} />
    </div>
  )
}

export default function FinishesForm({ area, entry, nearbyStores = [], onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ kind: 'Paint', ...entry }))
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const v = (k) => draft[k] || ''
  const editing = !!entry?.id
  const kind = v('kind') || 'Other'

  const brandOptions = BRANDS[kind] || []
  // Stores: the usual places for this kind of work, plus real stores near home.
  const baseStores = STORES[kind] || STORES.Other
  const nearby = nearbyStores
    .filter((s) => !baseStores.some((b) => b.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(b.toLowerCase().replace(' store', '').replace(' dealer', ''))))
    .map((s) => ({ value: s.name, text: s.name + ' · ' + s.distLabel }))
  const storeOptions = [...baseStores, ...nearby]

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

      <div className="intake-field filled" style={{ marginBottom: 12 }}>
        <label htmlFor="fx-kind"><span className="chk">✓</span><span className="q">What was done?</span></label>
        <select id="fx-kind" value={kind} onChange={(e) => set('kind', e.target.value)}>
          {FINISH_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <Select id="fx-where" label="Where in the room?" value={v('where')}
        options={WHERE_OPTIONS} onChange={(val) => set('where', val)} otherLabel="Somewhere else…" />

      {brandOptions.length > 0 ? (
        <Select id="fx-product" label={kind + ' brand'} value={v('product')}
          options={brandOptions} onChange={(val) => set('product', val)} otherLabel="Another brand…" />
      ) : (
        <TextField id="fx-product" label="Brand & product" value={v('product')}
          onChange={(val) => set('product', val)} opt={{ hint: 'Brand & product line' }} />
      )}

      <TextField id="fx-colorName" label="Color / pattern — name & code" value={v('colorName')}
        onChange={(val) => set('colorName', val)} opt={{ hint: 'e.g. SW 7029 Agreeable Gray' }} />
      <TextField id="fx-finish" label="Sheen / type" value={v('finish')}
        onChange={(val) => set('finish', val)} opt={{ hint: 'Eggshell, LVP, 3x6 subway…' }} />

      <Select id="fx-store" label="Bought at" value={v('store')}
        options={storeOptions} onChange={(val) => set('store', val)} otherLabel="Somewhere else…" />

      <TextField id="fx-doneBy" label="Done by" value={v('doneBy')}
        onChange={(val) => set('doneBy', val)} opt={{ hint: 'Company or "us"' }} />
      <TextField id="fx-date" label="When" value={v('date')}
        onChange={(val) => set('date', val)} opt={{ date: true }} />
      <TextField id="fx-qty" label="Quantity" value={v('qty')}
        onChange={(val) => set('qty', val)} opt={{ hint: 'Gallons, sq ft, rolls…' }} />
      <TextField id="fx-totalCost" label="Total cost" value={v('totalCost')}
        onChange={(val) => set('totalCost', val)} opt={{ money: true }} />
      <TextField id="fx-notes" label="Notes to match it later" value={v('notes')}
        onChange={(val) => set('notes', val)} opt={{ hint: 'Grout color, texture, leftover cans…' }} />
    </Sheet>
  )
}
