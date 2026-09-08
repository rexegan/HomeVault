import { useEffect, useRef, useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { KEY_FIELDS } from '../lib/intake.js'
import { geocodeAddress } from '../lib/hardware.js'
import { fetchForecast, wx, dayName, weatherAlerts, SEASONS } from '../lib/weather.js'

// Weather for the home: 3-day / 7-day / 2-week forecast for the home address,
// plus "Weather care" — forecast-driven alerts and the seasonal playbook.
const TABS = [
  { key: 3, label: '3 days' },
  { key: 7, label: '7 days' },
  { key: 14, label: '2 weeks' },
  { key: 'care', label: 'Weather care' },
]

export default function WeatherView({ profile, cached, onCache }) {
  const profileAddress = (profile?.[KEY_FIELDS.address] || '').trim()
  const [tab, setTab] = useState(7)
  const [days, setDays] = useState(cached?.days || null)
  const [place, setPlace] = useState(cached?.address || '')
  const [busy, setBusy] = useState(false)
  const [openDay, setOpenDay] = useState(null)
  const [error, setError] = useState(null)
  const ran = useRef(false)

  const load = async () => {
    if (!profileAddress && !cached?.lat) {
      setError('Add your address in the Home Profile and the forecast appears here automatically.')
      return
    }
    setBusy(true); setError(null)
    try {
      let lat = cached?.lat, lon = cached?.lon
      if (!lat || cached?.address !== profileAddress) {
        const geo = await geocodeAddress(profileAddress)
        if (!geo) { setError("Couldn't place your address — check it in the Home Profile."); setBusy(false); return }
        lat = geo.lat; lon = geo.lon
      }
      const fc = await fetchForecast(lat, lon)
      setDays(fc)
      setPlace(profileAddress)
      onCache({ address: profileAddress, lat, lon, days: fc, when: fc[0]?.date })
    } catch (e) {
      console.warn('Weather fetch failed', e)
      setError('The weather service didn\'t answer — try again in a minute.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    // Refresh whenever opened; cached data shows instantly in the meantime.
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shown = typeof tab === 'number' && days ? days.slice(0, tab) : null
  const alerts = days ? weatherAlerts(days) : []

  return (
    <div className="wxv">
      <div className="intake-lede">
        <h2>Weather at home</h2>
        <p>{place ? `Forecast for ${place}.` : 'The forecast for your address, and what it means for the house.'}</p>
      </div>

      <div className="wx-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={'wx-tab' + (tab === t.key ? ' on' : '')}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {error && <div className="hw-error">{error}</div>}
      {busy && !days && (
        <div className="snap-reading" style={{ marginTop: 22 }}>
          <div className="snap-progress"><span className="snap-spinner" aria-hidden="true" /> Getting your forecast…</div>
        </div>
      )}

      {shown && (
        <div className="items" style={{ marginTop: 4 }}>
          {shown.map((d, i) => {
            const w = wx(d.code)
            const open = openDay === d.date
            return (
              <div className={'wx-day' + (open ? ' open' : '')} key={d.date}>
                <div className="wx-day-main">
                  <span className="wx-icon">{w.icon}</span>
                  <span className="wx-body">
                    <span className="wx-name">{dayName(d.date, i)}
                      <span className="wx-cond"> — {w.label}{d.feels > d.hi + 2 ? ` · feels ${d.feels}°` : ''}</span>
                    </span>
                    <span className="wx-chips">
                      <span className="wx-chip">💧 {d.rain}% rain{d.rainAmt >= 0.05 ? ` · ${d.rainAmt}"` : ''}{d.rainHrs > 0 ? ` over ${d.rainHrs}h` : ''}</span>
                      <span className="wx-chip">💦 {d.hum}% humidity</span>
                      <span className="wx-chip">💨 {d.wind} mph{d.gust >= d.wind + 8 ? ` (gusts ${d.gust})` : ''}</span>
                      <span className="wx-chip">☀️ UV {d.uv}</span>
                      {d.sunrise && <span className="wx-chip">🌅 {d.sunrise}</span>}
                      {d.sunset && <span className="wx-chip">🌇 {d.sunset}</span>}
                    </span>
                  </span>
                  {d.hours?.length > 0 && (
                    <button className={'wx-hourly-btn' + (open ? ' on' : '')}
                      onClick={() => setOpenDay(open ? null : d.date)}>
                      Hourly {open ? '▴' : '▾'}
                    </button>
                  )}
                  <span className="wx-temps">
                    <b className={d.hi >= 100 ? 'hot' : ''}>{d.hi}°</b>
                    <span className={'lo' + (d.lo <= 32 ? ' cold' : '')}>{d.lo}°</span>
                  </span>
                </div>
                {open && (
                  <div className="wx-hours">
                    {d.hours.map((hr) => (
                      <div className="wx-hour" key={hr.label}>
                        <div className="wxh-t">{hr.label}</div>
                        <div className="wxh-i">{wx(hr.code).icon}</div>
                        <div className="wxh-temp">{hr.temp}°</div>
                        <div className={'wxh-rain' + (hr.rain >= 40 ? ' wet' : '')}>{hr.rain > 0 ? hr.rain + '%' : '·'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'care' && (
        <>
          <div className="section-row" style={{ marginTop: 6 }}>
            <h3>Coming up at your address</h3>
          </div>
          <div className="items">
            {alerts.map((a, i) => (
              <div className={'wx-alert ' + a.sev} key={i}>
                <span className="wx-icon">{a.icon}</span>
                <span className="wx-body">
                  <span className="wx-name">{a.title}</span>
                  <span className="wx-label">{a.detail}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="section-row" style={{ marginTop: 20 }}>
            <h3>The seasonal playbook</h3>
          </div>
          {SEASONS.map((s) => (
            <div className="wx-season" key={s.title}>
              <h4>{s.icon} {s.title}</h4>
              <ul>
                {s.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          ))}

          <div className="intake-foot" style={{ marginTop: 14 }}>
            <Icon.clock size={18} />
            <span>Alerts read your real forecast, so "cover the faucets" shows up before the freeze —
              not after. Routine versions of these live in Home Care too.</span>
          </div>
        </>
      )}
    </div>
  )
}
