import { useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { Select, TextField } from './FinishesForm.jsx'

// Lawn & Landscape: the full history of everything done to the front, back and
// side yards — grass, fertilizer, weed & pest control, plants, trees, mulch,
// irrigation, hardscape — with who/where/when/how much, plus a lawn profile.

export const LAWN_AREAS = ['Front yard', 'Back yard', 'Left side yard', 'Right side yard',
  'Whole property', 'Flower beds', 'Around the pool', 'Fence line', 'Vegetable garden', 'Driveway & walks']

const GRASSES = ['Bermuda', 'St. Augustine', 'Zoysia', 'Tall fescue', 'Kentucky bluegrass',
  'Buffalo grass', 'Centipede', 'Ryegrass (overseed)', 'Mixed / not sure']
const STATUSES = ['Thriving', 'Doing OK', 'Struggling', 'Died', 'Replaced']
const SIZES = ['Seed / plug', '1 gallon', '3 gallon', '5 gallon', '15 gallon', '30 gallon', '45 gallon+', 'Sod pallet', 'Bagged / bulk']

// What each kind of work looks like: its "what exactly" prompt, brand list, and
// whether it is a living thing (which gets size & status).
const KINDS = [
  { k: 'Grass — sod / seed', plant: true, what: 'Grass type', grass: true,
    brands: ['Scotts', 'Pennington', 'Jonathan Green', 'Local sod farm', 'Hydroseed crew'] },
  { k: 'Fertilizer', what: 'Product & analysis', hint: 'e.g. 15-5-10 slow-release, 5,000 sq ft bag',
    brands: ['Scotts', 'Milorganite', 'Espoma', 'Miracle-Gro', 'Pennington', 'BioAdvanced', 'Andersons', "Nature's Guide", 'Lesco', 'Dr. Earth'] },
  { k: 'Weed control', what: 'Product', hint: 'Pre-emergent, post-emergent, spot spray…',
    brands: ['Spectracide', 'Ortho', 'Roundup', 'Bonide', 'BioAdvanced', 'Preen', 'Barricade', 'Scotts', 'Image'] },
  { k: 'Pest / insect control', what: 'Product', hint: 'Grubs, fire ants, fleas, chinch bugs…',
    brands: ['BioAdvanced', 'Ortho', 'Amdro', 'Spectracide', 'Talstar', 'Sevin', 'Bonide'] },
  { k: 'Mowing & edging', what: 'What was done', hint: 'Weekly mow, edge & blow…', brands: [] },
  { k: 'Aeration / dethatching / topdressing', what: 'What was done', hint: 'Core aeration, compost topdress…', brands: [] },
  { k: 'Trees', plant: true, what: 'Tree species', hint: 'e.g. Live oak, Shumard oak, Crape myrtle',
    brands: ['Local nursery', "Calloway's", 'Home Depot', "Lowe's", 'Tractor Supply'] },
  { k: 'Shrubs & hedges', plant: true, what: 'Shrub variety', hint: 'e.g. Boxwood, Indian hawthorn, Yaupon holly',
    brands: ['Local nursery', "Calloway's", 'Home Depot', "Lowe's", 'Proven Winners', 'Encore Azalea'] },
  { k: 'Flowers & annuals', plant: true, what: 'Flower variety', hint: 'e.g. Pentas, Vinca, Pansies',
    brands: ['Local nursery', "Calloway's", 'Home Depot', "Lowe's", 'Proven Winners'] },
  { k: 'Perennials & groundcover', plant: true, what: 'Plant variety', hint: 'e.g. Salvia, Lantana, Liriope',
    brands: ['Local nursery', "Calloway's", 'Home Depot', "Lowe's", 'Proven Winners'] },
  { k: 'Vegetable / herb garden', plant: true, what: 'What was planted', hint: 'e.g. Tomatoes, peppers, basil',
    brands: ['Local nursery', 'Home Depot', "Lowe's", 'Burpee', 'Park Seed'] },
  { k: 'Mulch / soil / compost', what: 'Product', hint: 'e.g. Hardwood mulch, topsoil, compost',
    brands: ['Vigoro', 'Scotts', 'Miracle-Gro', 'Back to Nature', 'Local landscape supply'] },
  { k: 'Irrigation / sprinklers', what: 'What was done', hint: 'New zone, heads, controller, drip line…',
    brands: ['Rain Bird', 'Hunter', 'Toro', 'Orbit', 'Rachio', 'Netafim'] },
  { k: 'Hardscape / edging / walls', what: 'What was built', hint: 'Flagstone path, retaining wall, steel edging…', brands: [] },
  { k: 'Outdoor lighting', what: 'What was installed', hint: 'Path lights, uplights, string lights…',
    brands: ['Kichler', 'Hampton Bay', 'Malibu', 'FX Luminaire', 'Hinkley', 'Philips Hue'] },
  { k: 'Tree trimming / removal', what: 'What was done', hint: 'Trimmed oak, removed dead cedar, stump grind…', brands: [] },
  { k: 'Other', what: 'What was done', hint: '', brands: [] },
]
const KIND = Object.fromEntries(KINDS.map((x) => [x.k, x]))

const STORES = ['Home Depot', "Lowe's", 'Tractor Supply', 'Local nursery / garden center', "Calloway's Nursery",
  'Walmart Garden Center', 'Ace Hardware', 'Atwoods', 'Costco', 'SiteOne Landscape Supply',
  'Landscape supply yard', 'Farm & feed co-op', 'Amazon']

const SOILS = ['Clay', 'Sandy', 'Loam', 'Caliche / rocky', 'Black clay (blackland)', 'Not sure']
const SUN = ['Full sun', 'Part sun', 'Part shade', 'Mostly shade', 'Mixed']
const YESNO = ['Yes', 'No']
const WHO = ['We mow it ourselves', 'Lawn service mows it', 'Mixed']

const PROFILE = [
  ['grass', 'Grass type', 'select', GRASSES],
  ['sqft', 'Lawn size (sq ft)', 'text', null, 'e.g. 11,500'],
  ['soil', 'Soil type', 'select', SOILS],
  ['sun', 'Sun exposure', 'select', SUN],
  ['irrigation', 'Sprinkler / irrigation system?', 'select', YESNO],
  ['controller', 'Irrigation controller & zones', 'text', null, 'e.g. Rachio 3, 8 zones'],
  ['mowHeight', 'Mowing height', 'text', null, 'e.g. 3.5 inches'],
  ['who', 'Who mows?', 'select', WHO],
  ['service', 'Lawn service company', 'text', null, 'Company & phone'],
  ['water', 'Water source', 'select', ['City water', 'Rural water district', 'Private well', 'Rainwater / mixed']],
]

const num = (v) => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
const dollars = (n) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 })
const mdy = (s) => {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? new Date(+m[3], +m[1] - 1, +m[2]).getTime() : 0
}

export default function LawnView({ lawn, onProfile, onSaveEntry, onDeleteEntry, nearbyStores = [] }) {
  const [editing, setEditing] = useState(null)   // null | {} (new) | entry
  const [areaFilter, setAreaFilter] = useState('')
  const profile = lawn?.profile || {}
  const entries = lawn?.entries || []

  const sorted = useMemo(
    () => [...entries].sort((a, b) => mdy(b.date) - mdy(a.date)),
    [entries])
  const shown = areaFilter ? sorted.filter((e) => e.where === areaFilter) : sorted

  const total = entries.reduce((t, e) => t + num(e.totalCost), 0)
  const plants = entries
    .filter((e) => KIND[e.kind]?.plant && e.kind !== 'Grass — sod / seed' && e.status !== 'Died')
    .reduce((t, e) => t + (parseInt(e.qty, 10) || 1), 0)
  const lastFert = sorted.find((e) => e.kind === 'Fertilizer' && e.date)
  const dueSoon = entries.filter((e) => mdy(e.nextDue) > 0).sort((a, b) => mdy(a.nextDue) - mdy(b.nextDue))[0]

  const areas = useMemo(() => {
    const m = new Map()
    for (const e of entries) {
      const a = e.where || 'Unspecified'
      const cur = m.get(a) || { n: 0, cost: 0 }
      cur.n += 1; cur.cost += num(e.totalCost); m.set(a, cur)
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n)
  }, [entries])

  return (
    <div className="lawn">
      <div className="intake-lede">
        <h2>Lawn &amp; Landscape</h2>
        <p>Everything ever done to the front, back and side yards — every grass job, fertilizer
          and weed treatment, every plant and tree you bought, the sprinklers, the mulch — with
          what it cost, when it was done and when it's due again.</p>
      </div>

      <div className="fin-quick">
        <div className="stat"><div className="n" style={{ fontSize: 18 }}>{entries.length ? dollars(total) : '—'}</div><div className="l">Total spent</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 18 }}>{entries.length}</div><div className="l">Jobs logged</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 18 }}>{plants || '—'}</div><div className="l">Plants &amp; trees living</div></div>
        <div className="stat"><div className="n" style={{ fontSize: 16 }}>{lastFert?.date || '—'}</div><div className="l">Last fertilized</div></div>
      </div>

      <section className="intake-sec" data-accent="wood">
        <div className="intake-sec-head">
          <div className="intake-num">🌱</div>
          <div><h3>Your lawn</h3></div>
        </div>
        <div className="intake-qs" style={{ marginTop: 10 }}>
          {PROFILE.map(([key, label, type, opts, hint]) => (
            type === 'select' ? (
              <Select key={key} id={'lawn-p-' + key} label={label} value={profile[key] || ''}
                options={opts} onChange={(val) => onProfile(key, val)} />
            ) : (
              <TextField key={key} id={'lawn-p-' + key} label={label} value={profile[key] || ''}
                onChange={(val) => onProfile(key, val)} opt={{ hint }} />
            )
          ))}
        </div>
      </section>

      <div className="section-row" style={{ marginTop: 22 }}>
        <h3>Everything we've done</h3>
        <button className="btn small" onClick={() => setEditing({})}><Icon.plus size={14} /> Add a job</button>
      </div>

      {areas.length > 0 && (
        <div className="lawn-areas" role="group" aria-label="Filter by part of the yard">
          <button className={'lawn-chip' + (areaFilter ? '' : ' on')} onClick={() => setAreaFilter('')}>
            All <span>{entries.length}</span>
          </button>
          {areas.map(([a, val]) => (
            <button key={a} className={'lawn-chip' + (areaFilter === a ? ' on' : '')}
              onClick={() => setAreaFilter(areaFilter === a ? '' : a)}>
              {a} <span>{val.n}{val.cost ? ' · ' + dollars(val.cost) : ''}</span>
            </button>
          ))}
        </div>
      )}

      {dueSoon && (
        <div className="lawn-due">⏰ Next due: <b>{dueSoon.kind}</b> · {dueSoon.where || 'yard'} — {dueSoon.nextDue}</div>
      )}

      {shown.length === 0 ? (
        <div className="pool-summary finishes-summary">
          <div className="pool-summary-empty">
            No jobs logged yet. Add the sod you laid, the fertilizer you spread, the crape myrtles you
            planted — each one becomes a dated entry here, front yard, back yard or sides.
          </div>
        </div>
      ) : (
        <div className="fin-entries lawn-entries">
          {shown.map((e) => {
            const kd = KIND[e.kind]
            return (
              <button className="fin-entry" key={e.id} onClick={() => setEditing(e)}>
                <span className="fe-kind lawn-kind">{(e.kind || 'Other').split(' — ')[0].split(' / ')[0]}</span>
                <span className="fe-body">
                  <span className="fe-title">
                    {[e.where, e.product].filter(Boolean).join(' — ') || e.kind}
                    {e.qty ? <span className="fe-qty"> × {e.qty}</span> : null}
                  </span>
                  <span className="fe-sub">
                    {[e.brand, e.size, kd?.plant && e.status, e.store && '@ ' + e.store, e.doneBy && 'by ' + e.doneBy,
                      e.nextDue && 'next ' + e.nextDue].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="fe-meta">
                  {e.date && <span className="fe-date">{e.date}</span>}
                  {e.totalCost && <span className="fe-cost">{e.totalCost}</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className="intake-foot" style={{ marginTop: 16 }}>
        <Icon.shield size={18} />
        <span>Your yard history stays on this device. Photograph receipts and plant tags with Snap &amp; File
          and they land in the Backyard or Storage Shed with the rest of your vault.</span>
      </div>

      {editing && (
        <LawnEntryForm
          entry={editing.id ? editing : null}
          nearbyStores={nearbyStores}
          onClose={() => setEditing(null)}
          onSave={(draft) => { onSaveEntry(editing.id || null, draft); setEditing(null) }}
          onDelete={() => { onDeleteEntry(editing.id); setEditing(null) }}
        />
      )}
    </div>
  )
}

function LawnEntryForm({ entry, nearbyStores, onSave, onDelete, onClose }) {
  const [draft, setDraft] = useState(() => ({ kind: 'Fertilizer', where: 'Front yard', ...entry }))
  const set = (k, val) => setDraft((d) => ({ ...d, [k]: val }))
  const v = (k) => draft[k] || ''
  const editing = !!entry?.id
  const kd = KIND[v('kind')] || KIND.Other

  const nearby = nearbyStores
    .filter((s) => !STORES.some((b) => b.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(b.toLowerCase())))
    .map((s) => ({ value: s.name, text: s.name + ' · ' + s.distLabel }))
  const storeOptions = [...STORES, ...nearby]

  return (
    <Sheet title={editing ? 'Edit yard job' : 'New yard job'} onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="link-danger" onClick={() => { if (confirm('Delete this entry?')) onDelete() }}>
              <Icon.trash size={18} />
            </button>
          )}
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onSave(draft)}>Save</button>
        </>
      }>

      <div className="intake-field filled" style={{ marginBottom: 12 }}>
        <label htmlFor="lw-kind"><span className="chk">✓</span><span className="q">What was done?</span></label>
        <select id="lw-kind" value={v('kind')} onChange={(e) => set('kind', e.target.value)}>
          {KINDS.map((x) => <option key={x.k} value={x.k}>{x.k}</option>)}
        </select>
      </div>

      <Select id="lw-where" label="Where in the yard?" value={v('where')} options={LAWN_AREAS}
        onChange={(val) => set('where', val)} otherLabel="Somewhere else…" />

      {kd.grass ? (
        <Select id="lw-product" label="Grass type" value={v('product')} options={GRASSES}
          onChange={(val) => set('product', val)} />
      ) : (
        <TextField id="lw-product" label={kd.what} value={v('product')}
          onChange={(val) => set('product', val)} opt={{ hint: kd.hint || 'Add detail…' }} />
      )}

      {kd.brands.length > 0 && (
        <Select id="lw-brand" label={kd.plant ? 'Where it came from / brand' : 'Brand'} value={v('brand')}
          options={kd.brands} onChange={(val) => set('brand', val)} otherLabel="Another brand…" />
      )}

      {kd.plant && (
        <>
          <Select id="lw-size" label="Size when bought" value={v('size')} options={SIZES}
            onChange={(val) => set('size', val)} />
          <Select id="lw-status" label="How is it doing?" value={v('status')} options={STATUSES}
            onChange={(val) => set('status', val)} />
        </>
      )}

      <Select id="lw-store" label="Bought at" value={v('store')} options={storeOptions}
        onChange={(val) => set('store', val)} otherLabel="Somewhere else…" />

      <TextField id="lw-doneBy" label="Done by" value={v('doneBy')}
        onChange={(val) => set('doneBy', val)} opt={{ hint: 'Us, or the company' }} />
      <TextField id="lw-date" label="When" value={v('date')}
        onChange={(val) => set('date', val)} opt={{ date: true }} />
      <TextField id="lw-qty" label="How many / how much" value={v('qty')}
        onChange={(val) => set('qty', val)} opt={{ hint: kd.plant ? 'Number of plants' : 'Bags, sq ft, cubic yards…' }} />
      <TextField id="lw-totalCost" label="Total cost" value={v('totalCost')}
        onChange={(val) => set('totalCost', val)} opt={{ money: true }} />
      <TextField id="lw-nextDue" label="Next due" value={v('nextDue')}
        onChange={(val) => set('nextDue', val)} opt={{ date: true }} />
      <TextField id="lw-notes" label="Notes" value={v('notes')}
        onChange={(val) => set('notes', val)} opt={{ hint: 'Coverage rate, planting depth, what to try next…' }} />
    </Sheet>
  )
}
