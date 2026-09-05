import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { KEY_FIELDS } from '../lib/intake.js'
import { geocodeAddress, findHardwareStores, directionsURL, fallbackSearchURL, webSearchURL, formatHours } from '../lib/hardware.js'

// Local Hardware: the closest hardware & home-improvement stores to the home
// address, sorted by distance, with one-tap directions.
export default function HardwareView({ profile, cached, onCache }) {
  const profileAddress = (profile?.[KEY_FIELDS.address] || '').trim()
  const [address, setAddress] = useState(cached?.address || profileAddress)
  const [stores, setStores] = useState(cached?.stores || null)
  const [searchedFor, setSearchedFor] = useState(cached?.address || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [radius, setRadius] = useState(cached?.radius || 15)
  const [openStore, setOpenStore] = useState(null)
  const ranAuto = useRef(false)

  const changeRadius = (r) => {
    setRadius(r)
    if (stores) onCache({ address: searchedFor || address, stores, radius: r, when: new Date().toISOString().slice(0, 10) })
  }

  const search = async (q) => {
    q = (q ?? address).trim()
    if (!q || busy) return
    setBusy(true); setError(null)
    try {
      const geo = await geocodeAddress(q)
      if (!geo) {
        setError("Couldn't place that address — check the spelling, or search by just your ZIP code or city and state.")
        setBusy(false); return
      }
      const found = await findHardwareStores(geo.lat, geo.lon)
      setStores(found)
      setSearchedFor(q)
      onCache({ address: q, stores: found, radius, when: new Date().toISOString().slice(0, 10) })
      if (found.length === 0) setError('No hardware stores found near that address.')
    } catch (e) {
      console.warn('Local Hardware lookup failed', e)
      setError('The store lookup service didn’t answer — try again in a minute.')
    } finally {
      setBusy(false)
    }
  }

  const shown = stores ? stores.filter((s) => s.dist <= radius).slice(0, 20) : null

  // Pull up the list automatically: cached results show instantly; otherwise
  // search the Home Profile address the moment this screen opens.
  useEffect(() => {
    if (ranAuto.current) return
    ranAuto.current = true
    if (!cached?.stores?.length && (cached?.address || profileAddress)) {
      search(cached?.address || profileAddress)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="hw">
      <div className="intake-lede">
        <h2>Local Hardware</h2>
        <p>The closest hardware and home-improvement stores to your front door — so mid-project
          runs for a part take seconds to plan. Distances are as the crow flies; tap a store for
          driving directions.</p>
      </div>

      <div className="hw-search">
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Search near</label>
          <input type="text" value={address}
            placeholder={profileAddress || 'Your home address (street, city, state)'}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') search() }} />
        </div>
        <button className="btn" onClick={() => search()} disabled={busy || !address.trim()}>
          {busy ? 'Searching…' : (stores ? 'Refresh' : 'Find stores')}
        </button>
      </div>

      <div className="hw-controls">
        <label htmlFor="hw-radius">Distance</label>
        <select id="hw-radius" value={radius} onChange={(e) => changeRadius(+e.target.value)}>
          {[5, 7, 10, 12, 15, 20, 25, 30, 35].map((m) => <option key={m} value={m}>{m} miles</option>)}
        </select>
      </div>
      {!profileAddress && !address && (
        <div className="hint" style={{ margin: '8px 2px 0' }}>
          Tip: fill in your address in the Home Profile and it's used here automatically.
        </div>
      )}

      {error && <div className="hw-error">{error} {address.trim() && (
        <a href={fallbackSearchURL(address)} target="_blank" rel="noopener noreferrer">Search on the map instead →</a>
      )}</div>}

      {busy && (
        <div className="snap-reading" style={{ marginTop: 22 }}>
          <div className="snap-progress"><span className="snap-spinner" aria-hidden="true" /> Finding stores near you…</div>
        </div>
      )}

      {!busy && shown && shown.length === 0 && stores.length > 0 && (
        <div className="hw-note-empty">
          No stores within {radius} miles — the closest is {stores[0].distLabel} away.
          Pick a bigger distance to see it.
        </div>
      )}

      {!busy && shown && shown.length > 0 && (
        <>
          <div className="section-row" style={{ marginTop: 18 }}>
            <h3>{shown.length} within {radius} miles of {searchedFor}</h3>
          </div>
          <div className="items">
            {shown.map((s, i) => (
              <button className="hw-store" key={i} onClick={() => setOpenStore(s)}>
                <span className="hw-rank">{i + 1}</span>
                <span className="hw-body">
                  <span className="hw-name">{s.name} {s.chain && <em className="hw-chain">chain</em>}</span>
                  {s.addr && <span className="hw-addr">{s.addr}</span>}
                </span>
                <span className="hw-dist">{s.distLabel}</span>
                <span className="hw-go">Details ›</span>
              </button>
            ))}
          </div>
          <div className="intake-foot" style={{ marginTop: 16 }}>
            <Icon.shield size={18} />
            <span>Store data from OpenStreetMap. Your address is sent only to free public geocoders
              to find coordinates — never stored anywhere but this device.</span>
          </div>
        </>
      )}

      {openStore && <StoreCard store={openStore} onClose={() => setOpenStore(null)} />}
    </div>
  )
}

// The store "database card": everything known about the business in one box.
function StoreCard({ store, onClose }) {
  const hours = formatHours(store.hours)
  const site = store.website
    ? (/^https?:\/\//i.test(store.website) ? store.website : 'https://' + store.website)
    : null
  return (
    <Sheet
      title={store.name}
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>Close</button>
          <a className="btn" href={directionsURL(store)} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}>Directions</a>
        </>
      }
    >
      <div className="hwc-top">
        {store.chain && <em className="hw-chain" style={{ marginLeft: 0 }}>chain</em>}
        <span className="hwc-dist">{store.distLabel} from home</span>
      </div>

      <div className="hwc-grid">
        <div className="hwc-row">
          <span className="hwc-k">📍 Location</span>
          <span className="hwc-v">
            {store.fullAddr || store.addr || 'Address not listed'}
          </span>
        </div>
        <div className="hwc-row">
          <span className="hwc-k">🕒 Hours</span>
          <span className="hwc-v">
            {hours ? hours.map((h, i) => <span className="hwc-hour" key={i}>{h}</span>) : 'Not listed'}
          </span>
        </div>
        <div className="hwc-row">
          <span className="hwc-k">📞 Phone</span>
          <span className="hwc-v">
            {store.phone
              ? <a href={'tel:' + store.phone.replace(/[^0-9+]/g, '')}>{store.phone}</a>
              : 'Not listed'}
          </span>
        </div>
        <div className="hwc-row">
          <span className="hwc-k">🌐 Website</span>
          <span className="hwc-v">
            {site
              ? <a href={site} target="_blank" rel="noopener noreferrer">{site.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</a>
              : 'Not listed'}
          </span>
        </div>
      </div>

      <a className="hwc-more" href={webSearchURL(store)} target="_blank" rel="noopener noreferrer">
        Look up more about this store →
      </a>
    </Sheet>
  )
}
