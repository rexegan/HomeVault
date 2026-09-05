import { useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { KEY_FIELDS } from '../lib/intake.js'
import { geocodeAddress, findHardwareStores, directionsURL, fallbackSearchURL } from '../lib/hardware.js'

// Local Hardware: the closest hardware & home-improvement stores to the home
// address, sorted by distance, with one-tap directions.
export default function HardwareView({ profile, cached, onCache }) {
  const profileAddress = (profile?.[KEY_FIELDS.address] || '').trim()
  const [address, setAddress] = useState(cached?.address || profileAddress)
  const [stores, setStores] = useState(cached?.stores || null)
  const [searchedFor, setSearchedFor] = useState(cached?.address || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const search = async () => {
    const q = address.trim()
    if (!q || busy) return
    setBusy(true); setError(null)
    try {
      const geo = await geocodeAddress(q)
      if (!geo) { setError("Couldn't find that address — try adding the city and state."); setBusy(false); return }
      const found = await findHardwareStores(geo.lat, geo.lon)
      setStores(found)
      setSearchedFor(q)
      onCache({ address: q, stores: found, when: new Date().toISOString().slice(0, 10) })
      if (found.length === 0) setError('No hardware stores found within 15 miles of that address.')
    } catch (e) {
      console.warn('Local Hardware lookup failed', e)
      setError('The store lookup service didn’t answer — try again in a minute.')
    } finally {
      setBusy(false)
    }
  }

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
        <button className="btn" onClick={search} disabled={busy || !address.trim()}>
          {busy ? 'Searching…' : (stores ? 'Refresh' : 'Find stores')}
        </button>
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

      {!busy && stores && stores.length > 0 && (
        <>
          <div className="section-row" style={{ marginTop: 18 }}>
            <h3>{stores.length} closest to {searchedFor}</h3>
          </div>
          <div className="items">
            {stores.map((s, i) => (
              <a className="hw-store" key={i} href={directionsURL(s)} target="_blank" rel="noopener noreferrer">
                <span className="hw-rank">{i + 1}</span>
                <span className="hw-body">
                  <span className="hw-name">{s.name} {s.chain && <em className="hw-chain">chain</em>}</span>
                  {s.addr && <span className="hw-addr">{s.addr}</span>}
                </span>
                <span className="hw-dist">{s.distLabel}</span>
                <span className="hw-go">Directions ›</span>
              </a>
            ))}
          </div>
          <div className="intake-foot" style={{ marginTop: 16 }}>
            <Icon.shield size={18} />
            <span>Store data from OpenStreetMap. Your address is sent only to OpenStreetMap's free
              lookup services to find coordinates — never stored anywhere but this device.</span>
          </div>
        </>
      )}
    </div>
  )
}
