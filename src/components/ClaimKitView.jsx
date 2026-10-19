import { useMemo } from 'react'
import { Icon } from '../lib/icons.jsx'
import FileThumb from './FileThumb.jsx'
import { ZONES } from '../lib/defaults.js'
import { itemsForArea } from '../lib/storage.js'
import { homeFacts } from '../lib/intake.js'
import { INFLATION } from '../lib/forecast.js'

// Insurance claim kit: a room-by-room, photo-backed record of what you own, what
// you paid and what it would cost to replace today — plus how ready your records
// are, and what to do the day something happens. Print it or save it as a PDF.

const num = (v) => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
const money = (n) => '$' + Math.round(n).toLocaleString()
const parseISO = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }
const fmtDate = (s) => { const d = parseISO(s); return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—' }
const photoOf = (it) => (it.files || []).find((f) => f.type?.startsWith('image/'))

export default function ClaimKitView({ state, profile, finance, finishes, lawn, today, onOpenItem }) {
  const home = homeFacts(profile)
  const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  const calc = useMemo(() => {
    const rows = state.items.map((it) => {
      const paid = num(it.price)
      const d = parseISO(it.purchaseDate)
      const yrs = d ? Math.min(Math.max((today - d) / (365.25 * 86400000), 0), 25) : 0
      const repl = paid ? Math.round(paid * Math.pow(1 + INFLATION, yrs)) : 0
      return { it, paid, repl, photo: photoOf(it) }
    })
    const n = rows.length || 1
    const withPrice = rows.filter((r) => r.paid).length
    const withDate = rows.filter((r) => r.it.purchaseDate).length
    const withPhoto = rows.filter((r) => r.photo).length
    const withDoc = rows.filter((r) => (r.it.files || []).length).length
    const score = Math.round(((withPrice + withDate + withPhoto) / (3 * n)) * 100)
    const gaps = rows.filter((r) => !r.photo).sort((a, b) => b.paid - a.paid).slice(0, 14)
    return { rows, n: rows.length, withPrice, withDate, withPhoto, withDoc, score, gaps,
      paid: rows.reduce((t, r) => t + r.paid, 0), repl: rows.reduce((t, r) => t + r.repl, 0) }
  }, [state.items, today])

  const improvements = useMemo(() => {
    const out = []
    for (const area of state.areas) {
      const list = finishes?.[area.id] || []
      const total = list.reduce((t, e) => t + num(e.totalCost), 0)
      if (list.length) out.push({ room: area.name, count: list.length, total })
    }
    return out
  }, [state.areas, finishes])
  const lawnTotal = (lawn?.entries || []).reduce((t, e) => t + num(e.totalCost), 0)
  const areasWithItems = state.areas.filter((a) => itemsForArea(state, a.id).length > 0)
  const g = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + q)
  const insurer = finance?.['ins.company']

  return (
    <div className="claimkit">
      <div className="report-toolbar no-print">
        <div className="hint">Everything an adjuster asks for, in one document. Print it or save it as a PDF — and keep a copy off this device.</div>
        <button className="btn" onClick={() => window.print()}><Icon.file size={18} /> Print / Save as PDF</button>
      </div>

      <div className="report-doc">
        <div className="report-head">
          <div className="report-title">
            <Icon.shield size={26} />
            <div>
              <h1>Insurance Claim Kit</h1>
              {home.name && <div className="report-addr">{home.name}</div>}
              <div className="report-date">{home.facts.length > 0 ? home.facts.join(' · ') + ' · ' : ''}Prepared {dateStr} · HomeVault</div>
            </div>
          </div>
        </div>

        <div className="kit-box">
          <h3>Your policy</h3>
          {insurer ? (
            <dl className="bind-kv">
              <dt>Company</dt><dd>{insurer}</dd>
              {finance['ins.policy'] && (<><dt>Policy number</dt><dd>{finance['ins.policy']}</dd></>)}
              {finance['ins.agent'] && (<><dt>Agent</dt><dd>{finance['ins.agent']}{finance['ins.agentPhone'] ? ' · ' + finance['ins.agentPhone'] : ''}</dd></>)}
              {finance['ins.dwelling'] && (<><dt>Dwelling coverage</dt><dd>{finance['ins.dwelling']}</dd></>)}
              {finance['ins.personal'] && (<><dt>Personal property</dt><dd>{finance['ins.personal']}</dd></>)}
              {finance['ins.deductible'] && (<><dt>Deductible</dt><dd>{finance['ins.deductible']}</dd></>)}
              {finance['ins.windHail'] && (<><dt>Wind / hail deductible</dt><dd>{finance['ins.windHail']}</dd></>)}
              {finance['ins.renewal'] && (<><dt>Renews</dt><dd>{finance['ins.renewal']}</dd></>)}
            </dl>
          ) : (
            <p className="hint" style={{ margin: 0 }}>Add your insurance details on the Insurance / Taxes tab and they print here, ready for a claim call.</p>
          )}
          {insurer && (
            <p className="no-print" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
              <a href={g(insurer + ' file a homeowners claim')} target="_blank" rel="noopener noreferrer">Open {insurer}’s claim page ↗</a>
            </p>
          )}
        </div>

        <div className="report-summary">
          <Sum n={calc.n} l="Items recorded" />
          <Sum n={calc.paid ? money(calc.paid) : '—'} l="Total paid" />
          <Sum n={calc.repl ? money(calc.repl) : '—'} l="Est. replace today" />
          <Sum n={calc.withPhoto + ' / ' + calc.n} l="Have a photo" />
        </div>

        <div className="kit-box no-print">
          <h3>How claim-ready are your records? <b style={{ color: '#2f6b22' }}>{calc.score}%</b></h3>
          <div className="kit-meter"><span style={{ width: calc.score + '%' }} /></div>
          <div className="hint">
            {calc.withPrice} of {calc.n} have a price · {calc.withDate} have a purchase date · {calc.withPhoto} have a photo · {calc.withDoc} have a receipt or file.
          </div>
          {calc.gaps.length > 0 && (
            <>
              <div className="hint" style={{ marginTop: 8 }}>Most valuable items still missing a photo — tap one to add it:</div>
              <div className="kit-gap">
                {calc.gaps.map((r) => <button key={r.it.id} onClick={() => onOpenItem(r.it.id)}>{r.it.name}{r.paid ? ' · ' + money(r.paid) : ''}</button>)}
              </div>
            </>
          )}
        </div>

        {areasWithItems.length === 0 && <p className="report-empty">No items yet. Add what you own to each room and it appears here.</p>}

        {ZONES.map((zone) => {
          const zoneAreas = areasWithItems.filter((a) => a.zone === zone.id)
          if (!zoneAreas.length) return null
          return (
            <div className="report-zone" key={zone.id}>
              <h2 className="report-zone-title">{zone.label}</h2>
              {zoneAreas.map((area) => {
                const rows = calc.rows.filter((r) => r.it.areaId === area.id)
                const sub = rows.reduce((t, r) => t + r.repl, 0)
                return (
                  <div className="report-area" key={area.id}>
                    <div className="report-area-title"><b>{area.name}</b> <span className="muted">· {rows.length} item{rows.length === 1 ? '' : 's'}{sub ? ' · ≈ ' + money(sub) + ' to replace' : ''}</span></div>
                    <table className="report-table">
                      <thead><tr><th></th><th>Item</th><th>Bought</th><th>Where</th><th className="num">Paid</th><th className="num">Replace today*</th></tr></thead>
                      <tbody>
                        {rows.map(({ it, paid, repl, photo }) => (
                          <tr key={it.id} className="report-row" onClick={() => onOpenItem(it.id)}>
                            <td><span className="kit-thumb">{photo ? <FileThumb file={photo} /> : <Icon.photo size={18} />}</span></td>
                            <td><div className="cell-name">{it.name}</div>{it.notes && <div className="cell-notes">{it.notes}</div>}</td>
                            <td>{fmtDate(it.purchaseDate)}</td>
                            <td>{it.vendor || '—'}</td>
                            <td className="num">{paid ? money(paid) : '—'}</td>
                            <td className="num">{repl ? money(repl) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )
        })}

        {(improvements.length > 0 || lawnTotal > 0) && (
          <div className="kit-box">
            <h3>Improvements you’ve made</h3>
            <table className="report-table">
              <thead><tr><th>Where</th><th>What</th><th className="num">Spent</th></tr></thead>
              <tbody>
                {improvements.map((r) => (
                  <tr key={r.room}><td>{r.room}</td><td>Paint, flooring, wallpaper & finishes ({r.count})</td><td className="num">{r.total ? money(r.total) : '—'}</td></tr>
                ))}
                {lawnTotal > 0 && <tr><td>Yard</td><td>Lawn & landscape ({lawn.entries.length} jobs)</td><td className="num">{money(lawnTotal)}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        <div className="kit-box">
          <h3>If something happens — claim-day checklist</h3>
          <ol>
            <li><b>Make everyone safe first.</b> Then call 911 if there is fire, injury or a break-in.</li>
            <li><b>Stop more damage</b> — shut off water or power if it is safe, tarp the roof, board a window. Keep those receipts.</li>
            <li><b>Photograph and film everything</b> before you move or clean anything.</li>
            <li><b>Call your insurer</b> and write down the claim number, the adjuster’s name and phone, and the date.</li>
            <li><b>Don’t throw damaged items away</b> until the adjuster has seen them or said you may.</li>
            <li><b>Make a list of what was lost</b> — this document is that list, with what you paid for each.</li>
            <li><b>Ask about living expenses</b> if you cannot stay in the house.</li>
          </ol>
        </div>

        <div className="report-foot">
          * “Replace today” adds about {Math.round(INFLATION * 100)}% a year to what was paid — an estimate to help you start, not an appraisal.
          Your policy’s replacement-cost terms decide what is actually paid. Kept privately in HomeVault on this device.
        </div>
      </div>
    </div>
  )
}

function Sum({ n, l }) {
  return <div className="sum-cell"><div className="sum-n">{n}</div><div className="sum-l">{l}</div></div>
}
