import Sheet from './Sheet.jsx'
import { useRef, useState } from 'react'
import FileThumb from './FileThumb.jsx'
import { ocrImage, parseReceipt } from '../lib/scan.js'
import { saveFile } from '../lib/db.js'
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

const mdyToIso = (v) => {
  const m = String(v || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? m[3] + '-' + m[1].padStart(2, '0') + '-' + m[2].padStart(2, '0') : ''
}
const isoToMdy = (v) => {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? m[2] + '/' + m[3] + '/' + m[1] : ''
}

export const FINISH_KINDS = ['Paint', 'Flooring', 'Wallpaper', 'Tile / backsplash',
  'Countertops', 'Trim / molding', 'Hardware', 'Other']

// "Where in the room?" depends on the work: paint goes on walls, flooring goes on floors.
export const WHERE_BY_KIND = {
  'Paint': ['Whole room', 'Accent wall', 'Ceiling', 'Front wall', 'Back wall', 'Side walls', 'Trim & baseboards', 'Cabinets', 'Doors', 'Hallway walls', 'Stairwell walls'],
  'Flooring': ['Whole room', 'Hallway', 'Stairs', 'Stair landing', 'Entry / foyer', 'Closet', 'Pantry', 'Half of the room', 'Just one section', 'Transition strip / threshold'],
  'Wallpaper': ['Whole room', 'Accent wall', 'Front wall', 'Back wall', 'Side walls', 'Ceiling', 'Behind the bed', 'Behind the vanity', 'Closet', 'Hallway'],
  'Tile / backsplash': ['Backsplash', 'Shower walls', 'Tub surround', 'Shower floor', 'Floor', 'Fireplace surround', 'Accent wall', 'Entry / foyer floor', 'Whole room'],
  'Countertops': ['Kitchen counters', 'Island', 'Bathroom vanity', 'Bar', 'Laundry counter', 'Outdoor kitchen', 'Desk / built-in'],
  'Trim / molding': ['Baseboards', 'Crown molding', 'Door casings', 'Window casings', 'Chair rail', 'Wainscoting', 'Whole room'],
  'Hardware': ['Cabinet knobs & pulls', 'Door handles & locks', 'Hinges', 'Light switches & outlets', 'Towel bars & hooks', 'Drawer pulls', 'Whole room'],
  'Other': ['Whole room', 'Accent wall', 'Ceiling', 'Floor', 'Walls', 'Cabinets', 'Stairs', 'Hallway'],
}
const whereFor = (kind) => WHERE_BY_KIND[kind] || WHERE_BY_KIND.Other
const ALL_WHERE = new Set(Object.values(WHERE_BY_KIND).flat())

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

// Paint lines by brand, grouped into the usual Good / Better / Best retail tiers.
// (Tiers are how each brand positions its lines at the store — Best usually costs
// the most and covers, scrubs and lasts the best.)
const L = (tier, ...names) => names.map((n) => n + ' (' + tier + ')')
export const PAINT_GRADES = {
  'Sherwin-Williams': [...L('Good', 'ProMar 200 Zero VOC', 'A-100 Exterior'), ...L('Better', 'SuperPaint', 'ProClassic', 'Harmony', 'Latitude Exterior'),
    ...L('Best', 'Duration', 'Emerald', 'Cashmere', 'Resilience Exterior')],
  'Behr': [...L('Good', 'Premium Plus'), ...L('Better', 'Ultra'), ...L('Best', 'Ultra Scuff Defense', 'Marquee', 'Dynasty'), ...L('Contractor', 'Behr Pro')],
  'Benjamin Moore': [...L('Good', 'Ultra Spec 500'), ...L('Better', 'Ben', 'Regal Select'), ...L('Best', 'Aura', 'Natura'),
    ...L('Specialty', 'Advance (trim & cabinets)', 'Scuff-X', 'Waterborne Ceiling Paint')],
  'PPG': [...L('Good', 'Speedhide'), ...L('Better', 'Pure Performance'), ...L('Best', 'Timeless', 'Manor Hall'),
    ...L('Specialty', 'Break-Through! (trim & cabinets)', 'Seal-Grip (primer)')],
  'Valspar': [...L('Good', 'Ultra'), ...L('Better', 'Signature'), ...L('Best', 'Reserve', 'Duramax Exterior')],
  'Glidden': [...L('Good', 'Essentials'), ...L('Better', 'Premium'), ...L('Best', 'Diamond')],
  'Kilz': L('Primer', 'Original (oil-based)', '2 All-Purpose', 'Premium', 'Adhesion', 'Restoration', 'Complete'),
  'Zinsser': L('Primer', 'Bulls Eye 1-2-3', 'Cover Stain (oil-based)', 'B-I-N (shellac)', 'Gardz (sealer)', 'Smart Prime', 'Perma-White'),
  'Rust-Oleum': L('Specialty', "Painter's Touch 2X", 'Universal', 'Cabinet Transformations', 'Chalked', 'Stops Rust', 'EpoxyShield (garage floor)'),
  'Magnolia Home': L('Better', 'Magnolia Home Interior', 'Magnolia Home Exterior'),
}
// Flooring: first pick the kind of flooring, then the specific type (which wood,
// which carpet fiber, which tile…). Each category lists its own choices.
const HARDWOODS = ['Red oak', 'White oak', 'Hickory', 'Maple', 'Walnut', 'Cherry', 'Ash', 'Birch', 'Beech',
  'Pine (heart / southern yellow)', 'Mahogany', 'Teak', 'Brazilian cherry (Jatoba)', 'Brazilian walnut (Ipe)', 'Tigerwood', 'Acacia', 'Reclaimed wood']
export const FLOOR_CATEGORIES = {
  'Wood': { label: 'Type of wood', options: [...HARDWOODS.map((h) => 'Solid hardwood — ' + h), 'Engineered hardwood', 'Waterproof engineered hardwood'] },
  'Carpet': { label: 'Carpet fiber / style', options: ['Carpet — Nylon', 'Carpet — Triexta', 'Carpet — Polyester', 'Carpet — Wool', 'Carpet — Olefin', 'Carpet — Berber / loop', 'Carpet tile'] },
  'Tile': { label: 'Tile material', options: ['Tile — Porcelain', 'Tile — Ceramic', 'Tile — Wood-look porcelain', 'Tile — Glass', 'Tile — Mosaic', 'Tile — Cement / encaustic'] },
  'Brick': { label: 'Brick type', options: ['Brick — Clay paver', 'Brick — Thin brick', 'Brick — Herringbone pattern', 'Brick — Basket-weave pattern', 'Brick — Reclaimed / antique'] },
  'Laminate': { label: 'Laminate type', options: ['Waterproof laminate', 'Water-resistant laminate', 'Laminate'] },
  'Vinyl': { label: 'Vinyl type', options: ['Waterproof luxury vinyl plank (LVP)', 'Luxury vinyl plank (LVP)', 'Luxury vinyl tile (LVT)', 'Rigid-core vinyl (SPC / WPC)', 'Sheet vinyl'] },
  'Natural stone': { label: 'Stone type', options: ['Stone — Slate', 'Stone — Travertine', 'Stone — Marble', 'Stone — Granite', 'Stone — Limestone', 'Stone — Flagstone'] },
  'Concrete': { label: 'Concrete finish', options: ['Polished concrete', 'Stained concrete', 'Stamped concrete', 'Epoxy-coated concrete'] },
  'Bamboo': { label: 'Bamboo type', options: ['Bamboo (strand-woven)', 'Bamboo'] },
  'Cork': { label: 'Cork type', options: ['Cork'] },
  'Linoleum': { label: 'Linoleum type', options: ['Linoleum'] },
  'Terrazzo': { label: 'Terrazzo type', options: ['Terrazzo'] },
  'Epoxy / garage coating': { label: 'Coating type', options: ['Epoxy (garage floor)', 'Polyaspartic coating', 'Interlocking garage tiles'] },
  'Rubber': { label: 'Rubber type', options: ['Rubber flooring'] },
  'Artificial turf': { label: 'Turf type', options: ['Artificial turf'] },
}
const ALL_FLOOR_TYPES = Object.values(FLOOR_CATEGORIES).flatMap((c) => c.options)
// Guess the category from an older entry's free-text type.
function inferFloorCategory(text) {
  const t = (text || '').toLowerCase()
  if (!t) return ''
  if (/carpet|berber/.test(t)) return 'Carpet'
  if (/brick|paver/.test(t)) return 'Brick'
  if (/laminate/.test(t)) return 'Laminate'
  if (/vinyl|lvp|lvt|spc|wpc/.test(t)) return 'Vinyl'
  if (/slate|marble|travertine|granite|limestone|flagstone|stone/.test(t)) return 'Natural stone'
  if (/tile|porcelain|ceramic/.test(t)) return 'Tile'
  if (/concrete/.test(t)) return 'Concrete'
  if (/bamboo/.test(t)) return 'Bamboo'
  if (/cork/.test(t)) return 'Cork'
  if (/linoleum/.test(t)) return 'Linoleum'
  if (/terrazzo/.test(t)) return 'Terrazzo'
  if (/epoxy|polyaspartic/.test(t)) return 'Epoxy / garage coating'
  if (/hardwood|wood|oak|maple|hickory|walnut|cherry|ash|pine|teak|mahogany/.test(t)) return 'Wood'
  return ''
}
const GENERIC_TIERS = ['Economy / builder grade', 'Standard', 'Premium', 'Ultra-premium', 'Contractor grade', 'Primer', 'Specialty / cabinet & trim']
const SHEENS = ['Flat', 'Matte', 'Low-luster / Velvet', 'Eggshell', 'Satin', 'Pearl', 'Semi-gloss', 'Gloss', 'High-gloss']

const COLOR_LABEL = {
  'Paint': ['Color name or code', 'e.g. SW 7029 Agreeable Gray'],
  'Wallpaper': ['Pattern name or number', 'Pattern, colorway & roll count'],
  'Flooring': ['Color / style — name or code', 'e.g. Cut Pine, Tahoe Taupe'],
  'Tile / backsplash': ['Color / style — name or code', 'e.g. Arctic White 3x6'],
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

export function Select({ id, label, value, options, onChange, otherLabel = 'Other…' }) {
  // ' ' (one space) is the "Other…" placeholder: show the type-it-in box straight away.
  const custom = value !== '' && !options.some((o) => (o.value ?? o) === value)
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

export function TextField({ id, label, value, onChange, opt = {} }) {
  const filled = value.trim() !== ''
  return (
    <div className={'intake-field' + (filled ? ' filled' : '')} style={{ marginBottom: 12 }}>
      <label htmlFor={id}>
        <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
        <span className="q">{label}</span>
      </label>
      {opt.date ? (
        <input id={id} type="date" value={mdyToIso(value)}
          onChange={(e) => onChange(isoToMdy(e.target.value))} />
      ) : (
      <input id={id} type="text" value={value}
        inputMode={opt.date || opt.money || opt.miles ? 'numeric' : undefined}
        placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
        onChange={(e) => onChange(opt.date ? maskDate(e.target.value) : e.target.value)}
        onBlur={opt.money ? () => onChange(money(value))
          : opt.miles ? () => { const n = parseInt(String(value).replace(/\D/g, ''), 10); if (!isNaN(n)) onChange(n.toLocaleString()) }
          : undefined} />
      )}
    </div>
  )
}

// Paint quantity: unit dropdown + a 1–10 count dropdown, stored as "3 gallons".
const QTY_UNITS = [
  ['sample', 'Sample size', 'sample size'],
  ['pint', 'Pints', 'pint'],
  ['quart', 'Quarts', 'quart'],
  ['gallon', 'Gallons', 'gallon'],
  ['five', '5-gallon buckets', '5-gallon bucket'],
]
const composeQty = (unit, count) => {
  const u = QTY_UNITS.find(([k]) => k === unit)
  if (!u || !count) return ''
  const n = +count
  if (unit === 'sample') return n + ' ' + (n === 1 ? 'sample' : 'samples')
  return n + ' ' + (n === 1 ? u[2] : u[1].toLowerCase())
}
function parseQty(q) {
  const m = String(q || '').match(/^(\d+)\s+(.*)$/)
  if (!m) return {}
  const t = m[2].toLowerCase()
  const unit = /sample|oz/.test(t) ? 'sample' : /pint/.test(t) ? 'pint' : /quart|\bqt/.test(t) ? 'quart'
    : /5.?gal|bucket/.test(t) ? 'five' : /gal/.test(t) ? 'gallon' : ''
  return unit && +m[1] >= 1 && +m[1] <= 10 ? { qtyUnit: unit, qtyCount: m[1] } : {}
}

// Which of My Pros fit each kind of work (shown first in "Done by").
const TRADE_FOR = {
  'Paint': /paint/i, 'Wallpaper': /paint|wall/i, 'Flooring': /floor/i, 'Tile / backsplash': /floor|tile/i,
  'Countertops': /contractor|countertop|handyman/i, 'Trim / molding': /handyman|contractor|carpent/i,
  'Hardware': /handyman|contractor/i,
}
const PRO_TRADE = { 'Paint': 'Painter', 'Wallpaper': 'Painter', 'Flooring': 'Flooring', 'Tile / backsplash': 'Flooring',
  'Countertops': 'General contractor', 'Trim / molding': 'Handyman', 'Hardware': 'Handyman' }

export default function FinishesForm({ area, entry, nearbyStores = [], pros = [], knownPeople = [], onAddPro, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => {
    const d = { kind: 'Paint', ...parseQty(entry?.qty), ...entry }
    if (d.kind === 'Flooring' && !d.floorCategory && d.finish) d.floorCategory = inferFloorCategory(d.finish)
    return d
  })
  const [scan, setScan] = useState(null)          // null | { busy, msg }
  const camRef = useRef(null)
  const libRef = useRef(null)
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

  const floorCatKey = v('floorCategory').trim()
  const floorCat = floorCatKey ? (FLOOR_CATEGORIES[floorCatKey] || { label: '', options: [] }) : null
  const floorCatKnown = !!(floorCat && FLOOR_CATEGORIES[floorCatKey])
  const setQty = (unit, count) => setDraft((d) => ({ ...d, qtyUnit: unit, qtyCount: count, qty: composeQty(unit, count) || d.qty }))

  // "Done by": Us, then the pros who fit this work, the rest of My Pros, then
  // anyone typed in on earlier jobs — so a name typed once is always held.
  const tradeRe = TRADE_FOR[kind]
  const sortedPros = [...pros].sort((a, b) => (tradeRe && tradeRe.test(b.trade || '') ? 1 : 0) - (tradeRe && tradeRe.test(a.trade || '') ? 1 : 0))
  const proNames = new Set(pros.map((p) => (p.name || '').trim().toLowerCase()))
  const doneByOptions = [
    { value: 'Us', text: 'Us — did it ourselves' },
    ...sortedPros.map((p) => ({ value: p.name, text: p.name + (p.trade ? ' · ' + p.trade : '') })),
    ...knownPeople.filter((n) => n && n !== 'Us' && !proNames.has(n.toLowerCase())).map((n) => ({ value: n, text: n + ' · used before' })),
  ]
  const doneByCustom = v('doneBy').trim() !== '' && !doneByOptions.some((o) => o.value === v('doneBy'))
  const isUs = v('doneBy').trim().toLowerCase() === 'us'

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
      const found = []
      setDraft((d) => {
        const next = { ...d }
        if (r.price) { next.totalCost = r.price; found.push('total ' + r.price) }
        if (r.purchaseDate && !d.date) { next.date = isoToMdy(r.purchaseDate); found.push('date') }
        const match = r.vendor && storeOptions.find((o) => (o.value ?? o).toLowerCase().includes(r.vendor.toLowerCase()) || r.vendor.toLowerCase().includes(String(o.value ?? o).toLowerCase().replace(/ store$| dealer$/, '')))
        if (match && !d.store) { next.store = match.value ?? match; found.push('store') }
        return next
      })
      setScan(r.price
        ? { msg: 'Read ' + r.price + (r.vendor ? ' from ' + r.vendor : '') + ' — please check it, and fix anything that looks off. Receipt attached.' }
        : { msg: 'Receipt attached, but I couldn’t read a total — type it in above.', err: true })
    } catch (err) {
      console.warn('Receipt scan failed', err)
      setScan({ msg: 'Couldn’t read that photo — type the total in. (It was still attached.)', err: true })
    }
  }

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
          <button className="btn" onClick={() => onSave({ ...draft, grade: kind === 'Paint' ? draft.grade : '', floorCategory: kind === 'Flooring' ? draft.floorCategory : '' })}>Save</button>
        </>
      }>

      <div className="intake-field filled" style={{ marginBottom: 12 }}>
        <label htmlFor="fx-kind"><span className="chk">✓</span><span className="q">What was done?</span></label>
        <select id="fx-kind" value={kind} onChange={(e) => {
          const next = e.target.value
          setDraft((d) => {
            const w = (d.where || '').trim()
            const stale = w && ALL_WHERE.has(w) && !whereFor(next).includes(w)
            return { ...d, kind: next, where: stale ? '' : d.where }
          })
        }}>
          {FINISH_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <Select id="fx-where" label="Where in the room?" value={v('where')}
        options={whereFor(kind)} onChange={(val) => set('where', val)} otherLabel="Somewhere else…" />

      {kind === 'Flooring' && (
        <Select id="fx-floorCategory" label="What type of flooring?" value={v('floorCategory')} options={Object.keys(FLOOR_CATEGORIES)}
          onChange={(val) => setDraft((d) => {
            const opts = FLOOR_CATEGORIES[val.trim()]?.options || []
            return { ...d, floorCategory: val, finish: opts.includes(d.finish) ? d.finish : '' }
          })}
          otherLabel="Something else…" />
      )}

      {brandOptions.length > 0 ? (
        <Select id="fx-product" label={kind + ' brand'} value={v('product')}
          options={brandOptions}
          onChange={(val) => setDraft((d) => {
            const lines = PAINT_GRADES[val.trim()] || GENERIC_TIERS
            return { ...d, product: val, grade: lines.includes(d.grade) ? d.grade : '' }
          })}
          otherLabel="Another brand…" />
      ) : (
        <TextField id="fx-product" label="Brand & product" value={v('product')}
          onChange={(val) => set('product', val)} opt={{ hint: 'Brand & product line' }} />
      )}

      {kind === 'Flooring' && (floorCat ? (
        floorCatKnown ? (
          <Select id="fx-finish" label={floorCat.label} value={v('finish')} options={floorCat.options}
            onChange={(val) => set('finish', val)} otherLabel="Another type…" />
        ) : (
          <TextField id="fx-finish" label="Describe the flooring" value={v('finish')}
            onChange={(val) => set('finish', val)} opt={{ hint: 'What is it made of?' }} />
        )
      ) : (
        <Select id="fx-finish" label="Type of wood (or flooring)" value={v('finish')} options={ALL_FLOOR_TYPES}
          onChange={(val) => set('finish', val)} otherLabel="Another type…" />
      ))}

      {kind === 'Paint' && (
        <Select id="fx-grade" label="Paint grade / quality tiers" value={v('grade')}
          options={PAINT_GRADES[v('product').trim()] || GENERIC_TIERS}
          onChange={(val) => set('grade', val)} otherLabel="Another line…" />
      )}

      <TextField id="fx-colorName" label={(COLOR_LABEL[kind] || ['Color / pattern — name & code'])[0]} value={v('colorName')}
        onChange={(val) => set('colorName', val)} opt={{ hint: (COLOR_LABEL[kind] || ['', 'e.g. color name and code'])[1] }} />
      {kind === 'Paint' ? (
        <Select id="fx-finish" label="Sheen type" value={v('finish')} options={SHEENS}
          onChange={(val) => set('finish', val)} otherLabel="Another sheen…" />
      ) : kind === 'Flooring' ? null : (
        <TextField id="fx-finish" label="Sheen / type" value={v('finish')}
          onChange={(val) => set('finish', val)} opt={{ hint: '3x6 subway, matte, brushed…' }} />
      )}

      <Select id="fx-store" label="Bought at" value={v('store')}
        options={storeOptions} onChange={(val) => set('store', val)} otherLabel="Somewhere else…" />

      <Select id="fx-doneBy" label="Done by" value={v('doneBy')} options={doneByOptions}
        onChange={(val) => set('doneBy', val)} otherLabel="Someone else — type it in…" />
      {doneByCustom && !isUs && onAddPro && (
        <div className="hint" style={{ margin: '-4px 2px 12px' }}>
          Remembered for next time.{' '}
          <button type="button" className="file-btn" onClick={() => {
            onAddPro({ trade: PRO_TRADE[kind] || 'Handyman', name: v('doneBy').trim(), owner: '', officePhone: '', cellPhone: '', email: '',
              website: '', street: '', city: '', state: '', zip: '', license: '', referredBy: '', notes: 'Added from a ' + kind.toLowerCase() + ' job in ' + area.name, jobs: [] })
          }}>+ Save to My Pros</button>
        </div>
      )}
      <TextField id="fx-date" label="When" value={v('date')}
        onChange={(val) => set('date', val)} opt={{ date: true }} />

      {kind === 'Paint' ? (
        <div className={'intake-field' + (v('qty') ? ' filled' : '')} style={{ marginBottom: 12 }}>
          <label htmlFor="fx-qtyUnit"><span className="chk" aria-hidden="true">{v('qty') ? '✓' : ''}</span><span className="q">Quantity</span></label>
          <div className="hoa-row">
            <select id="fx-qtyUnit" value={v('qtyUnit')} aria-label="Container size"
              onChange={(e) => setQty(e.target.value, v('qtyCount') || '1')}>
              <option value="">Pick a size…</option>
              {QTY_UNITS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <select id="fx-qtyCount" value={v('qtyCount')} aria-label="How many" style={{ maxWidth: 110 }}
              onChange={(e) => setQty(v('qtyUnit'), e.target.value)}>
              <option value="">How many…</option>
              {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {v('qty') && !v('qtyUnit') && <div className="hint" style={{ marginTop: 6 }}>Currently: {v('qty')} — pick a size and number to change it.</div>}
        </div>
      ) : (
        <TextField id="fx-qty" label="Quantity" value={v('qty')}
          onChange={(val) => set('qty', val)} opt={{ hint: 'sq ft, boxes, rolls…' }} />
      )}

      <TextField id="fx-totalCost" label="Total cost" value={v('totalCost')}
        onChange={(val) => set('totalCost', val)} opt={{ money: true }} />
      <div className="fx-scan">
        <button type="button" className="file-btn" onClick={() => camRef.current?.click()} disabled={scan?.busy}>📷 Snap the receipt</button>
        <button type="button" className="file-btn" onClick={() => libRef.current?.click()} disabled={scan?.busy}>🖼 Choose a photo</button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onReceipt} />
        <input ref={libRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={onReceipt} />
        {scan?.msg && <div className={'hint' + (scan.err ? ' err' : '')} style={{ width: '100%' }}>{scan.busy && <span className="snap-spinner" aria-hidden="true" style={{ marginRight: 6 }} />}{scan.msg}</div>}
        {(draft.files || []).length > 0 && (
          <div className="attach-list" style={{ width: '100%' }}>
            {draft.files.map((f) => (
              <div className="attach" key={f.id}>
                <span className="th"><FileThumb file={f} /></span>
                <span className="nm">{f.name}</span>
                <button type="button" className="rm" onClick={() => set('files', draft.files.filter((x) => x.id !== f.id))} aria-label="Remove">×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <TextField id="fx-notes" label="Notes to match it later" value={v('notes')}
        onChange={(val) => set('notes', val)} opt={{ hint: 'Grout color, texture, leftover cans…' }} />
    </Sheet>
  )
}
