import { useMemo } from 'react'
import { Icon } from '../lib/icons.jsx'
import { buildForecast, bucketForecast, INFLATION } from '../lib/forecast.js'

// Replacement forecast: what will need replacing, when, and about what it costs.
const money = (n) => '$' + Math.round(n).toLocaleString()
const monthYear = (d) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

export default function ForecastView({ state, finishes, today, onOpenItem }) {
  const { rows, skipped } = useMemo(() => buildForecast({ state, finishes, today }), [state, finishes, today])
  const buckets = useMemo(() => bucketForecast(rows), [rows])

  const y0 = today.getFullYear()
  const fiveYears = rows.filter((r) => r.past || r.yearsLeft <= 5)
  const fiveTotal = fiveYears.reduce((t, r) => t + r.estCost, 0)
  const perMonth = fiveTotal / 60
  const pastCount = rows.filter((r) => r.past).length

  // Year-by-year budget: past-due things land in the current year.
  const years = useMemo(() => {
    const m = new Map()
    for (let y = y0; y < y0 + 8; y++) m.set(y, { n: 0, cost: 0 })
    for (const r of rows) {
      const y = Math.max(r.replaceOn.getFullYear(), y0)
      if (m.has(y)) { const c = m.get(y); c.n += 1; c.cost += r.estCost }
    }
    return [...m.entries()]
  }, [rows, y0])
  const maxYear = Math.max(1, ...years.map(([, v]) => v.cost))

  return (
    <div className="forecast">
      <div className="intake-lede">
        <h2>Replacement forecast</h2>
        <p>What in your house will wear out, roughly when, and about what it will cost to replace —
          built from the purchase dates and prices you've already entered. Lifespans are typical for
          normal use, not predictions: a well-kept water heater can outlast them.</p>
      </div>

      {rows.length === 0 ? (
        <div className="pool-summary finishes-summary">
          <div className="pool-summary-empty">
            Nothing to forecast yet. Add purchase dates and prices to your appliances and equipment
            (or load the sample home) and this fills in.
          </div>
        </div>
      ) : (
        <>
          <div className="fin-quick">
            <div className="stat"><div className="n" style={{ fontSize: 18 }}>{rows.length}</div><div className="l">Things tracked</div></div>
            <div className="stat"><div className="n" style={{ fontSize: 18 }}>{pastCount}</div><div className="l">Past typical life</div></div>
            <div className="stat"><div className="n" style={{ fontSize: 18 }}>{money(fiveTotal)}</div><div className="l">Next 5 years</div></div>
            <div className="stat"><div className="n" style={{ fontSize: 18 }}>{money(perMonth)}</div><div className="l">Set aside / month</div></div>
          </div>

          <div className="section-row" style={{ marginTop: 18 }}><h3>Year by year</h3></div>
          <div className="fc-years">
            {years.map(([y, v]) => (
              <div className="fc-year" key={y}>
                <span className="fc-y">{y}</span>
                <span className="fc-bar"><span style={{ width: Math.max(v.cost / maxYear * 100, v.n ? 2 : 0) + '%' }} /></span>
                <span className="fc-amt">{v.n ? money(v.cost) : '—'}<em>{v.n ? ' · ' + v.n + (v.n === 1 ? ' item' : ' items') : ''}</em></span>
              </div>
            ))}
          </div>

          {buckets.map((b) => (
            <div key={b.key}>
              <div className="section-row" style={{ marginTop: 20 }}>
                <h3>{b.title} <span className="fc-count">{b.rows.length}</span></h3>
              </div>
              {b.hint && <div className="hint" style={{ margin: '0 2px 8px' }}>{b.hint}</div>}
              <div className="fin-entries">
                {b.rows.map((r) => (
                  <div className={'fin-entry fc-row' + (r.past ? ' past' : '')} key={r.id}>
                    <span className="fe-kind fc-kind">{r.source === 'finish' ? 'Finish' : 'Item'}</span>
                    <span className="fe-body">
                      <span className="fe-title">{r.name}</span>
                      <span className="fe-sub">
                        {[r.room, 'bought ' + monthYear(r.bought),
                          Math.max(r.yearsAge, 0).toFixed(1) + ' of ~' + r.life + ' yrs'].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="fe-meta">
                      <span className="fe-date">{r.past ? 'due now' : '≈ ' + monthYear(r.replaceOn)}</span>
                      {r.estCost > 0 && <span className="fe-cost">{money(r.estCost)}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="intake-foot" style={{ marginTop: 16 }}>
            <Icon.clock size={18} />
            <span>Cost estimates take what you paid and add about {Math.round(INFLATION * 100)}% a year for price
              creep. {skipped > 0 ? skipped + ' item' + (skipped === 1 ? '' : 's') + ' without a purchase date or a known lifespan ' + (skipped === 1 ? 'is' : 'are') + ' left out. ' : ''}
              Add a purchase date to any item and it joins the forecast.</span>
          </div>
        </>
      )}
    </div>
  )
}
