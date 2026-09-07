import { useEffect, useRef, useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { KEY_FIELDS } from '../lib/intake.js'
import { lookupJurisdiction, civicLinks } from '../lib/civic.js'

// County / City: where the home officially sits — its incorporated city (or
// unincorporated county), county, school district — plus the local-government
// resources that matter to a homeowner.
export default function CivicView({ profile, weatherCache, cached, onCache }) {
  const address = (profile?.[KEY_FIELDS.address] || '').trim()
  const [info, setInfo] = useState(cached?.info || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const ran = useRef(false)

  const load = async () => {
    if (!address) { setError('Add your address in the Home Profile and this fills in automatically.'); return }
    setBusy(true); setError(null)
    try {
      const j = await lookupJurisdiction(address,
        weatherCache?.lat ? { lat: weatherCache.lat, lon: weatherCache.lon } : null)
      if (!j) { setError("Couldn't place that address — check it in the Home Profile."); setBusy(false); return }
      setInfo(j)
      onCache({ address, info: j })
    } catch (e) {
      console.warn('Jurisdiction lookup failed', e)
      setError('The lookup service didn\'t answer — try again in a minute.')
    } finally { setBusy(false) }
  }

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!cached?.info || cached.address !== address) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stateName = (address.match(/\b(TX|Texas)\b/i) ? 'Texas' : (address.split(',').slice(-1)[0] || '').replace(/\b\d{5}(-\d{4})?\b/, '').trim())
  const links = info ? civicLinks(info, stateName) : []

  return (
    <div className="civic">
      <div className="intake-lede">
        <h2>County / City</h2>
        <p>Where your home officially sits — and the local offices every homeowner eventually needs.</p>
      </div>

      {error && <div className="hw-error">{error}</div>}
      {busy && !info && (
        <div className="snap-reading" style={{ marginTop: 22 }}>
          <div className="snap-progress"><span className="snap-spinner" aria-hidden="true" /> Looking up your jurisdiction…</div>
        </div>
      )}

      {info && (
        <>
          <div className="hwc-grid" style={{ marginBottom: 18 }}>
            <div className="hwc-row">
              <span className="hwc-k">📍 Address</span>
              <span className="hwc-v">{info.matchedAddress || address}</span>
            </div>
            <div className="hwc-row">
              <span className="hwc-k">🏙️ City</span>
              <span className="hwc-v">{info.city
                ? info.city
                : <>Outside city limits — <b>unincorporated {info.countyName || 'county'}</b> (county rules apply)</>}</span>
            </div>
            <div className="hwc-row">
              <span className="hwc-k">🗺️ County</span>
              <span className="hwc-v">{info.countyName || 'Not found'}</span>
            </div>
            {info.schoolDistrict && (
              <div className="hwc-row">
                <span className="hwc-k">🎒 Schools</span>
                <span className="hwc-v">{info.schoolDistrict}</span>
              </div>
            )}
            {info.congressional && (
              <div className="hwc-row">
                <span className="hwc-k">🏛️ District</span>
                <span className="hwc-v">{info.congressional}</span>
              </div>
            )}
          </div>

          <div className="section-row"><h3>Your local offices</h3></div>
          <div className="items">
            {links.map(([icon, name, desc, url]) => (
              <a className="ref-row" key={name} href={url} target="_blank" rel="noopener noreferrer">
                <span className="wx-icon" style={{ fontSize: 20 }}>{icon}</span>
                <span className="ref-body">
                  <span className="ref-name">{name}</span>
                  <span className="ref-desc">{desc}</span>
                </span>
                <span className="ref-open">Open ↗</span>
              </a>
            ))}
          </div>

          <div className="intake-foot" style={{ marginTop: 16 }}>
            <Icon.shield size={18} />
            <span>Jurisdiction data from the US Census geocoder. Links open searches aimed at your
              county and city's official pages.</span>
          </div>
        </>
      )}
    </div>
  )
}
