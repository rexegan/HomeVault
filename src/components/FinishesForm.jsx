import Sheet from './Sheet.jsx'
import { formatPrice } from '../lib/storage.js'

// Paint & Finishes: the surfaces of one room, in granular, replace-it-exactly
// detail — paint codes, flooring product lines, costs to the penny, and who did
// the work. Saves as you type.
const money = (v) => formatPrice(v)
const maskDate = (v) => {
  if (!/^[\d/]*$/.test(v)) return v
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2)
  return d
}

const PAINT_BRANDS = ['Sherwin-Williams', 'Behr', 'Benjamin Moore', 'PPG', 'Valspar', 'Glidden', 'Kilz', 'Other']
const SHEENS = ['Flat', 'Matte', 'Eggshell', 'Satin', 'Semi-gloss', 'Gloss']
const FLOOR_TYPES = ['Carpet', 'Hardwood', 'Engineered wood', 'Laminate', 'Luxury vinyl plank',
  'Tile', 'Polished concrete', 'Other']

export const FINISH_SECTIONS = [
  {
    label: '🎨 Paint', fields: [
      ['paintBrand', 'Paint brand', { options: PAINT_BRANDS }],
      ['wallColor', 'Wall color — name & code', { hint: 'e.g. SW 7029 Agreeable Gray' }],
      ['sheen', 'Wall sheen', { options: SHEENS }],
      ['trimColor', 'Trim color & sheen', { hint: 'e.g. SW 7006 Extra White, semi-gloss' }],
      ['ceilingColor', 'Ceiling color', {}],
      ['paintStore', 'Bought at', { hint: 'Store & location' }],
      ['paintedDate', 'Last painted', { date: true }],
      ['paintedBy', 'Painted by', { hint: 'Company or "us"' }],
      ['gallons', 'Gallons used', { hint: 'For the next repaint' }],
      ['paintCost', 'Paint job cost', { money: true }],
    ],
  },
  {
    label: '🪵 Flooring', fields: [
      ['floorType', 'Flooring type', { options: FLOOR_TYPES }],
      ['floorBrand', 'Brand & product line', { hint: 'e.g. Shaw Paragon Plus' }],
      ['floorColor', 'Color / style name', {}],
      ['floorStore', 'Bought at', {}],
      ['floorInstaller', 'Installed by', {}],
      ['floorDate', 'Installed', { date: true }],
      ['floorArea', 'Square feet', { hint: 'This room' }],
      ['floorCostSqft', 'Cost per sq ft', { money: true }],
      ['floorCost', 'Total flooring cost', { money: true }],
    ],
  },
  {
    label: '🧱 Walls, tile & surfaces', fields: [
      ['wallpaper', 'Wallpaper — brand & pattern', {}],
      ['tile', 'Backsplash / tile', { hint: 'Brand, size, color, grout' }],
      ['countertops', 'Countertops', { hint: 'Material, brand, color' }],
      ['molding', 'Trim / crown molding', { hint: 'Profile & size' }],
      ['hardware', 'Hardware finish', { hint: 'Knobs, pulls, hinges — brand & finish' }],
      ['notes', 'Anything else to match later', { hint: 'Caulk color, texture, stain…' }],
    ],
  },
]

// Label lookup for the room's summary card.
export const FINISH_LABELS = FINISH_SECTIONS.flatMap((s) => s.fields.map(([k, l]) => [k, l]))

export default function FinishesForm({ area, values, onChange, onSaved, onClose }) {
  const v = (k) => values?.[k] || ''
  return (
    <Sheet title={area.name + ' — paint & finishes'} onClose={onClose}
      footer={<button className="btn" onClick={onSaved || onClose} style={{ flex: 1 }}>Save</button>}>

      <div className="hint" style={{ marginBottom: 6 }}>
        Capture it once, match it forever — colors, products and costs down to the penny.
      </div>

      {FINISH_SECTIONS.map((sec) => (
        <div key={sec.label}>
          <div className="form-section">{sec.label}</div>
          {sec.fields.map(([key, label, opt]) => {
            const raw = v(key)
            const filled = raw.trim() !== ''
            const custom = opt.options ? (filled && !opt.options.includes(raw)) : false
            const id = 'fx-' + key
            return (
              <div className={'intake-field' + (filled ? ' filled' : '')} key={key} style={{ marginBottom: 12 }}>
                <label htmlFor={id}>
                  <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
                  <span className="q">{label}</span>
                </label>
                {opt.options ? (
                  <>
                    <select id={id} value={custom ? '__other' : raw}
                      onChange={(e) => {
                        const val = e.target.value
                        onChange(key, val === '__other' ? (custom ? raw : ' ') : val)
                      }}>
                      <option value="">Pick one…</option>
                      {opt.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      <option value="__other">Other…</option>
                    </select>
                    {custom && (
                      <input type="text" value={raw.trim()} style={{ marginTop: 8 }}
                        placeholder="Type it in" onChange={(e) => onChange(key, e.target.value || ' ')} />
                    )}
                  </>
                ) : (
                  <input id={id} type="text" value={raw}
                    inputMode={opt.date || opt.money ? 'numeric' : undefined}
                    placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
                    onChange={(e) => onChange(key, opt.date ? maskDate(e.target.value) : e.target.value)}
                    onBlur={opt.money ? () => onChange(key, money(v(key))) : undefined} />
                )}
              </div>
            )
          })}
        </div>
      ))}
    </Sheet>
  )
}
