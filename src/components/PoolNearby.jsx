import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPoolBusinesses, POOL_KINDS } from '../lib/pool.js'
import { geocodeAddress, directionsURL, websiteFor, formatHours } from '../lib/hardware.js'

// Everything a pool owner needs nearby: supply stores, repair & service companies
// and builders within a distance you choose — with a one-tap path to each one's
// coupons, hours, directions and website, plus the big online pool retailers.
const DISTANCES = [5, 7, 10, 12, 15, 20, 25, 30, 35, 40, 50, 75, 100]
const KEY = 'homevault:poolnear:v2'
const g = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + q)   // straight to the official page
const ONLINE = [
  ["Leslie's", "Pool supplies, water testing & chemicals", "Leslie's pool supplies coupons promo codes"],
  ['In The Swim', 'Chemicals, covers, pumps & parts', 'In The Swim pool supplies coupons'],
  ['Pool Supply World', 'Equipment, cleaners & accessories', 'Pool Supply World coupons deals'],
  ["Doheny's", 'Pool & spa supplies and parts', "Doheny's pool supplies coupons"],
]

export default function PoolNearby({ address, coords, poolCare = [], onAddPro }) {
  const [radius, setRadius] = useState(15)
  const [kind, setKind] = useState('all')
  const [list, setList] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null')?.list || null } catch { return null } })
  const [fetched, setFetched] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY) || 'null')?.fetched || 0 } catch { return 0 } })
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const ran = useRef(false)

  const load = async () => {
    setBusy(true); setError(null)
    try {
      let lat = coords?.lat, lon = coords?.lon
      if (lat == null) {
        if (!address) { setError('Add your address in the Home Profile and pool companies near you appear here.'); setBusy(false); return }
        const geo = await geocodeAddress(address)
        if (!geo) { setError('Couldn’t place your address — check it in the Home Profile.'); setBusy(false); return }
        lat = geo.lat; lon = geo.lon
      }
      // Ask for everything out to 100 miles; if the map service is too busy for that, settle for less.
      let found = null, used = 0, lastErr = null
      for (const r of [100, 50, 25]) {
        try { found = await fetchPoolBusinesses(lat, lon, r); used = r; break } catch (e) { lastErr = e }
      }
      if (!found) throw lastErr || new Error('lookup failed')
      setList(found); setFetched(used)
      try { localStorage.setItem(KEY, JSON.stringify({ list: found, address, fetched: used })) } catch { /* ignore */ }
    } catch (e) {
      console.warn('Pool lookup failed', e)
      setError('The map service is busy right now.')
    } finally { setBusy(false) }
  }

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    let cached = null
    try { cached = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { /* ignore */ }
    if (!cached?.list?.length || cached.address !== address) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = useMemo(() => (list || []).filter((b) => b.dist <= radius && (kind === 'all' || b.kind === kind)), [list, radius, kind])
  const visible = showAll ? shown : shown.slice(0, 20)
  const counts = useMemo(() => {
    const c = { all: 0, supply: 0, service: 0, builder: 0, other: 0 }
    for (const b of list || []) if (b.dist <= radius) { c.all++; c[b.kind]++ }
    return c
  }, [list, radius])

  const savePro = (b) => onAddPro && onAddPro({
    trade: b.kind === 'builder' ? 'Pool service' : 'Pool service', name: b.name, owner: '', officePhone: b.phone || '', cellPhone: '', email: '',
    website: b.website || '', street: b.street || '', city: b.city || '', state: b.state || '', zip: b.zip || '', license: '',
    referredBy: 'Pool help near me', notes: POOL_KINDS[b.kind], jobs: [],
  })

  return (
    <div className="pool-near">
      <div className="pool-near-head">
        <span>🛒 Pool help near you</span>
        <label className="pool-near-dist">
          <span>Within</span>
          <select id="pool-near-radius" value={radius} onChange={(e) => setRadius(+e.target.value)}>
            {DISTANCES.map((m) => <option key={m} value={m}>{m} miles</option>)}
          </select>
        </label>
      </div>

      <div className="lawn-areas" role="group" aria-label="Type of business">
        {[['all', 'All'], ['supply', 'Supply stores'], ['service', 'Repair & service'], ['builder', 'Builders']].map(([k, label]) => (
          <button key={k} className={'lawn-chip' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>
            {label} <span>{counts[k]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="hw-error">{error} <button type="button" className="pn-retry" onClick={load} disabled={busy}>Try again</button></div>
      )}
      {busy && <div className="snap-progress" style={{ margin: '10px 0' }}><span className="snap-spinner" aria-hidden="true" /> Finding pool companies near you…</div>}

      {!busy && list && shown.length === 0 && (
        <div className="hint" style={{ margin: '8px 0' }}>
          None of that type within {radius} miles{(list || []).some((b) => b.dist > radius) ? ' — try a bigger distance.' : '.'}
        </div>
      )}

      <div className="pool-near-list">
        {visible.map((b) => {
          const hours = formatHours(b.hours)
          return (
            <div className="pn-row" key={b.name}>
              <div className="pn-top">
                <span className="pn-name">{b.name}</span>
                <span className={'pn-kind pn-' + b.kind}>{POOL_KINDS[b.kind]}</span>
                <span className="pn-dist">{b.distLabel}</span>
              </div>
              {(b.fullAddr || b.addr) && <div className="pn-sub">{b.fullAddr || b.addr}</div>}
              {hours && <div className="pn-sub">🕒 {hours.slice(0, 2).join(' · ')}</div>}
              <div className="pn-actions">
                {b.phone && <a href={'tel:' + b.phone.replace(/[^0-9+]/g, '')}>📞 {b.phone}</a>}
                <a href={websiteFor(b)} target="_blank" rel="noopener noreferrer">🌐 Website</a>
                <a href={directionsURL(b)} target="_blank" rel="noopener noreferrer">🧭 Directions</a>
                <a href={g(b.name + ' ' + (b.city || '') + ' coupons deals specials')} target="_blank" rel="noopener noreferrer" className="pn-deal">🏷️ Coupons & deals</a>
                {onAddPro && b.kind !== 'supply' && <button type="button" onClick={() => savePro(b)}>+ Save to My Pros</button>}
              </div>
            </div>
          )
        })}
      </div>

      {shown.length > visible.length && (
        <button type="button" className="btn secondary small" style={{ marginTop: 10 }} onClick={() => setShowAll(true)}>
          Show all {shown.length}
        </button>
      )}
      {list && fetched > 0 && radius > fetched && (
        <div className="hint" style={{ marginTop: 8 }}>
          The map service only reached out to {fetched} miles this time.{' '}
          <button type="button" className="pn-retry" onClick={load} disabled={busy}>Search farther</button>
        </div>
      )}
      {list && (
        <div className="hint" style={{ marginTop: 8 }}>
          {shown.length} within {radius} miles.{' '}
          <button type="button" className="pn-retry" onClick={load} disabled={busy}>Refresh</button>
        </div>
      )}

      <div className="pn-sec">Online pool stores — deals &amp; coupons</div>
      <div className="pn-online">
        {ONLINE.map(([name, desc, q]) => (
          <a key={name} href={g(q)} target="_blank" rel="noopener noreferrer">
            <b>{name}</b><span>{desc}</span><em>Coupons ↗</em>
          </a>
        ))}
      </div>

      {poolCare.length > 0 && (
        <>
          <div className="pn-sec">Coming up for your pool</div>
          <div className="pn-care">
            {poolCare.slice(0, 4).map((t) => (
              <div className={'pn-care-row ' + t.status} key={t.id}>
                <b>{t.title}</b>
                <span>{t.neverDone ? 'not logged yet' : t.days < 0 ? Math.abs(t.days) + ' days overdue' : 'in ' + t.days + ' days'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
