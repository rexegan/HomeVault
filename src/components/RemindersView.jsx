import { useMemo } from 'react'
import { Icon } from '../lib/icons.jsx'
import { buildReminders, downloadICS } from '../lib/reminders.js'

// Calendar reminders: every upcoming date HomeVault knows, ready for your calendar.
const KIND_CLASS = { Warranty: 'rk-warranty', 'Home Care': 'rk-care', Lawn: 'rk-lawn',
  Insurance: 'rk-money', Vehicle: 'rk-care', Taxes: 'rk-money', Replacement: 'rk-replace' }

export default function RemindersView({ state, intake, care, lawn, finance, finishes, vehicles, today }) {
  const events = useMemo(
    () => buildReminders({ state, intake, care, lawn, finance, finishes, vehicles, today }),
    [state, intake, care, lawn, finance, finishes, vehicles, today])

  const groups = useMemo(() => {
    const m = new Map()
    for (const e of events) {
      const k = e.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(e)
    }
    return [...m.entries()]
  }, [events])

  const counts = events.reduce((c, e) => { c[e.kind] = (c[e.kind] || 0) + 1; return c }, {})

  return (
    <div className="reminders">
      <div className="intake-lede">
        <h2>Calendar reminders</h2>
        <p>Every date HomeVault knows about — warranties ending, maintenance coming due, yard jobs,
          insurance and tax dates, and big replacements on the horizon — in one file you add to your
          calendar once. Your phone then nudges you ahead of each one.</p>
      </div>

      {events.length === 0 ? (
        <div className="pool-summary finishes-summary">
          <div className="pool-summary-empty">
            No upcoming dates yet. Add warranty dates to your items, or load the sample home, and
            they appear here.
          </div>
        </div>
      ) : (
        <>
          <div className="rem-cta">
            <button className="btn" onClick={() => downloadICS(events)}>
              📅 Add {events.length} reminders to my Calendar
            </button>
            <div className="hint">
              iPad / iPhone: tap the file when it downloads, then choose <b>Add All</b>.
              Mac: double-click the file. Run it again anytime — events update instead of duplicating.
            </div>
          </div>

          <div className="rem-counts">
            {Object.entries(counts).map(([k, n]) => (
              <span key={k} className={'rem-pill ' + (KIND_CLASS[k] || '')}>{k} <b>{n}</b></span>
            ))}
          </div>

          {groups.map(([month, list]) => (
            <div key={month}>
              <div className="section-row" style={{ marginTop: 18 }}><h3>{month}</h3></div>
              <div className="fin-entries">
                {list.map((e) => (
                  <div className="fin-entry rem-row" key={e.uid}>
                    <span className={'fe-kind rem-kind ' + (KIND_CLASS[e.kind] || '')}>{e.kind}</span>
                    <span className="fe-body">
                      <span className="fe-title">{e.title}</span>
                      {e.desc && <span className="fe-sub">{e.desc.split('\n')[0]}</span>}
                    </span>
                    <span className="fe-meta">
                      <span className="fe-date">
                        {e.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="intake-foot" style={{ marginTop: 16 }}>
            <Icon.shield size={18} />
            <span>The file is made on this device and goes straight to your calendar — nothing is uploaded.</span>
          </div>
        </>
      )}
    </div>
  )
}
