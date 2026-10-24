import { useMemo, useState } from 'react'

// A simple calendar: three months at a time, and ONLY the days that have something
// due are colored — one color for each kind of reminder.
export const KIND_COLORS = {
  'Warranty': '#d6453a', 'Home Care': '#2f7fd1', 'Vehicle': '#0e9f8a', 'Lawn': '#52a83b',
  'Insurance': '#7b55c7', 'Taxes': '#c43d8d', 'Replacement': '#e8891a',
}
const color = (k) => KIND_COLORS[k] || '#5d7690'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

function fillFor(kinds) {
  if (kinds.length === 1) return color(kinds[0])
  const step = 100 / kinds.length
  return 'conic-gradient(' + kinds.map((k, i) => `${color(k)} ${i * step}% ${(i + 1) * step}%`).join(', ') + ')'
}

export default function ReminderCalendar({ events, today }) {
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [picked, setPicked] = useState(null)       // 'YYYY-MM-DD'

  const byDay = useMemo(() => {
    const m = new Map()
    for (const e of events) {
      const k = key(e.date)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(e)
    }
    return m
  }, [events])

  const years = []
  for (let y = today.getFullYear() - 1; y <= today.getFullYear() + 12; y++) years.push(y)

  const shift = (delta) => {
    const d = new Date(year, month + delta, 1)
    setMonth(d.getMonth()); setYear(d.getFullYear())
  }
  const shown = [0, 1, 2].map((i) => new Date(year, month + i, 1))
  const inView = events.filter((e) => shown.some((s) => s.getFullYear() === e.date.getFullYear() && s.getMonth() === e.date.getMonth()))
  const legend = Object.keys(KIND_COLORS).map((k) => [k, inView.filter((e) => e.kind === k).length]).filter(([, n]) => n > 0)
  const dayEvents = picked ? (byDay.get(picked) || []) : []

  return (
    <div className="rcal">
      <div className="rcal-bar">
        <button type="button" className="rcal-nav" onClick={() => shift(-1)} aria-label="Earlier months">‹</button>
        <label className="rcal-sel"><span>Month</span>
          <select id="rcal-month" value={month} onChange={(e) => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </label>
        <label className="rcal-sel"><span>Year</span>
          <select id="rcal-year" value={year} onChange={(e) => setYear(+e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <button type="button" className="rcal-nav" onClick={() => shift(1)} aria-label="Later months">›</button>
        <button type="button" className="rcal-today" onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}>Today</button>
      </div>

      <div className="rcal-legend">
        {legend.length === 0 && <span className="rcal-none">Nothing due in these months.</span>}
        {legend.map(([k, n]) => (
          <span className="rcal-key" key={k}><i style={{ background: color(k) }} />{k} <b>{n}</b></span>
        ))}
      </div>

      <div className="rcal-months">
        {shown.map((first) => {
          const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
          const blanks = first.getDay()
          const cells = []
          for (let i = 0; i < blanks; i++) cells.push(<span className="rcal-blank" key={'b' + i} />)
          for (let d = 1; d <= days; d++) {
            const dt = new Date(first.getFullYear(), first.getMonth(), d)
            const k = key(dt)
            const list = byDay.get(k)
            const kinds = list ? [...new Set(list.map((e) => e.kind))] : []
            const isToday = key(today) === k
            cells.push(list ? (
              <button type="button" key={d} className={'rcal-day has' + (picked === k ? ' sel' : '') + (isToday ? ' today' : '')}
                style={{ background: fillFor(kinds) }} onClick={() => setPicked(picked === k ? null : k)}
                aria-label={dt.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) + ': ' + list.length + ' reminder' + (list.length === 1 ? '' : 's')}>
                {d}{list.length > 1 && <sup>{list.length}</sup>}
              </button>
            ) : (
              <span key={d} className={'rcal-day' + (isToday ? ' today' : '')}>{d}</span>
            ))
          }
          return (
            <div className="rcal-month" key={first.getTime()}>
              <h4>{MONTHS[first.getMonth()]} <span>{first.getFullYear()}</span></h4>
              <div className="rcal-grid">
                {DOW.map((x) => <span className="rcal-dow" key={x}>{x}</span>)}
                {cells}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rcal-detail">
        {!picked && <div className="hint">Tap a colored day to see what’s due.</div>}
        {picked && (
          <>
            <div className="rcal-detail-title">
              {new Date(picked + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            {dayEvents.map((e) => (
              <div className="rcal-ev" key={e.uid} style={{ borderLeftColor: color(e.kind) }}>
                <span className="rcal-ev-kind" style={{ background: color(e.kind) }}>{e.kind}</span>
                <span className="rcal-ev-title">{e.title}</span>
                {e.desc && <span className="rcal-ev-desc">{e.desc.split('\n')[0]}</span>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
