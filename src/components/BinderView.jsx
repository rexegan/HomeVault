import { Fragment, useMemo, useState } from 'react'
import { Icon } from '../lib/icons.jsx'
import { INTAKE, homeFacts } from '../lib/intake.js'
import { ZONES } from '../lib/defaults.js'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'
import { careTasks } from '../lib/maintenance.js'
import { EMERGENCY_SECTIONS } from './EmergencyView.jsx'

// Home Binder: the handoff packet for the next owner — everything that makes the
// house easy to take over. You choose what to share; it never includes your
// mortgage, insurance, taxes, account numbers or what you paid for the house.

const num = (v) => { const n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n }
const money = (n) => '$' + Math.round(n).toLocaleString()
const parseISO = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }
const fmtISO = (s) => { const d = parseISO(s); return d ? d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '' }

// Profile answers that are about the house (not about you or your money).
const HOUSE_SECTIONS = ['property', 'exterior', 'systems', 'interior', 'garage', 'outdoors']
const SKIP_Q = new Set(['property:0:0', 'property:0:8', 'property:0:9', 'property:0:11'])
const POOL_LABELS = [['builder', 'Built by'], ['yearBuilt', 'Year built'], ['gallons', 'Gallons'], ['type', 'Type'], ['surface', 'Surface'],
  ['sanitizer', 'Sanitizer'], ['heated', 'Heated'], ['hotTub', 'Hot tub / spa'], ['maxDepth', 'Deepest point'], ['features', 'Water features'], ['notes', 'Notes']]
const UTIL = [['electric', 'Electric'], ['gas', 'Gas / propane'], ['water', 'Water / sewer'], ['trash', 'Trash'], ['internet', 'Internet'], ['security', 'Security']]

export default function BinderView({ state, profile, finishes, lawn, pool, money: moneyRec, pros, care, emergency, today }) {
  const [showPaid, setShowPaid] = useState(false)
  const [showPros, setShowPros] = useState(true)
  const [showUtilCost, setShowUtilCost] = useState(false)
  const [showEmergency, setShowEmergency] = useState(true)

  const home = homeFacts(profile)
  const dateStr = today.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  const house = useMemo(() => {
    const out = []
    for (const sec of INTAKE) {
      if (!HOUSE_SECTIONS.includes(sec.id)) continue
      const rows = []
      for (const grp of sec.groups) for (const it of grp.items) {
        const val = (profile?.[it.id] || '').trim()
        if (val && !SKIP_Q.has(it.id)) rows.push([it.q.replace(/\?$/, ''), val])
      }
      if (rows.length) out.push({ title: sec.title, rows })
    }
    return out
  }, [profile])

  const rooms = state.areas.filter((a) => itemsForArea(state, a.id).length > 0 || (finishes?.[a.id] || []).length > 0)
  const poolRows = POOL_LABELS.map(([k, l]) => [l, (pool?.[k] || '').trim()]).filter(([, v]) => v)
  const tasks = careTasks(profile || {}, state, care || {}, today).filter((t) => t.lastDone)
  const utils = UTIL.map(([k, l]) => [l, (moneyRec?.['util.' + k + 'Prov'] || '').trim(), moneyRec?.['util.' + k + 'Amt']]).filter(([, p]) => p)
  const plants = (lawn?.entries || []).filter((e) => e.status !== 'Died')
  const emRows = EMERGENCY_SECTIONS[0].fields.concat(EMERGENCY_SECTIONS[1].fields).map(([k, l]) => [l, (emergency?.[k] || '').trim()]).filter(([, v]) => v)

  return (
    <div className="binder">
      <div className="report-toolbar no-print" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div className="hint">The packet to hand a buyer — the paint colors, the equipment, who fixed what. Choose what to include, then print it or save it as a PDF.</div>
        <div className="bind-opts">
          <label><input type="checkbox" checked={showPaid} onChange={(e) => setShowPaid(e.target.checked)} /> Show what I paid for things</label>
          <label><input type="checkbox" checked={showPros} onChange={(e) => setShowPros(e.target.checked)} /> Include my pros’ names &amp; phones</label>
          <label><input type="checkbox" checked={showUtilCost} onChange={(e) => setShowUtilCost(e.target.checked)} /> Show typical monthly utility costs</label>
          <label><input type="checkbox" checked={showEmergency} onChange={(e) => setShowEmergency(e.target.checked)} /> Include shutoff locations</label>
        </div>
        <div><button className="btn" onClick={() => window.print()}><Icon.file size={18} /> Print / Save as PDF</button></div>
      </div>

      <div className="report-doc">
        <div className="report-head">
          <div className="report-title">
            <Icon.house size={26} />
            <div>
              <h1>Home Binder</h1>
              {home.name && <div className="report-addr">{home.name}</div>}
              <div className="report-date">{home.facts.length > 0 ? home.facts.join(' · ') + ' · ' : ''}Prepared {dateStr}</div>
            </div>
          </div>
        </div>

        <p className="bind-intro">Everything we learned about this house while we lived here — what’s in it, what we’ve done to it,
          and who we trust to fix it. We hope it makes taking over easy.</p>

        {house.map((s) => (
          <section className="bind-sec" key={s.title}>
            <h2>{s.title}</h2>
            <dl className="bind-kv">{s.rows.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
          </section>
        ))}

        {showEmergency && emRows.length > 0 && (
          <section className="bind-sec">
            <h2>Shutoffs &amp; safety</h2>
            <dl className="bind-kv">{emRows.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
          </section>
        )}

        {ZONES.map((zone) => {
          const zr = rooms.filter((a) => a.zone === zone.id)
          if (!zr.length) return null
          return (
            <section className="bind-sec" key={zone.id}>
              <h2>{zone.label}: equipment, appliances &amp; finishes</h2>
              {zr.map((area) => {
                const items = itemsForArea(state, area.id)
                const fin = finishes?.[area.id] || []
                return (
                  <div className="report-area" key={area.id}>
                    <div className="report-area-title"><b>{area.name}</b></div>
                    {items.length > 0 && (
                      <table className="report-table">
                        <thead><tr><th>Item</th><th>Bought</th><th>Where</th>{showPaid && <th className="num">Paid</th>}<th>Warranty</th></tr></thead>
                        <tbody>
                          {items.map((it) => {
                            const w = warrantyStatus(it, today)
                            return (
                              <tr key={it.id}>
                                <td><div className="cell-name">{it.name}</div>{it.notes && <div className="cell-notes">{it.notes}</div>}</td>
                                <td>{fmtISO(it.purchaseDate) || '—'}</td>
                                <td>{it.vendor || '—'}</td>
                                {showPaid && <td className="num">{it.price ? money(num(it.price)) : '—'}</td>}
                                <td>{w ? (w.state === 'expired' ? 'Ended ' + fmtISO(it.warrantyExpires) : 'Through ' + fmtISO(it.warrantyExpires)) : '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                    {fin.length > 0 && (
                      <table className="report-table" style={{ marginTop: 8 }}>
                        <thead><tr><th>Finish</th><th>Where</th><th>Product &amp; color</th><th>Done</th>{showPaid && <th className="num">Cost</th>}</tr></thead>
                        <tbody>
                          {fin.map((e) => (
                            <tr key={e.id}>
                              <td>{e.kind}</td><td>{e.where || '—'}</td>
                              <td>{[e.product, e.grade, e.colorName, e.finish].filter(Boolean).join(' · ') || '—'}{e.store ? <div className="cell-notes">Bought at {e.store}</div> : null}</td>
                              <td>{e.date || '—'}</td>
                              {showPaid && <td className="num">{e.totalCost || '—'}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )
              })}
            </section>
          )
        })}

        {poolRows.length > 0 && (
          <section className="bind-sec"><h2>Swimming pool</h2>
            <dl className="bind-kv">{poolRows.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
          </section>
        )}

        {(Object.keys(lawn?.profile || {}).length > 0 || plants.length > 0) && (
          <section className="bind-sec"><h2>Lawn &amp; landscape</h2>
            {Object.keys(lawn?.profile || {}).length > 0 && (
              <dl className="bind-kv">
                {[['Grass', lawn.profile.grass], ['Lawn size (sq ft)', lawn.profile.sqft], ['Soil', lawn.profile.soil], ['Sun', lawn.profile.sun],
                  ['Sprinklers', lawn.profile.irrigation], ['Controller', lawn.profile.controller], ['Mowing height', lawn.profile.mowHeight],
                  ['Lawn service', lawn.profile.service]].filter(([, v]) => v).map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}
              </dl>
            )}
            {plants.length > 0 && (
              <table className="report-table" style={{ marginTop: 8 }}>
                <thead><tr><th>Job</th><th>Where</th><th>What</th><th>Done</th>{showPaid && <th className="num">Cost</th>}</tr></thead>
                <tbody>
                  {plants.map((e) => (
                    <tr key={e.id}><td>{e.kind}</td><td>{e.where || '—'}</td>
                      <td>{[e.product, e.brand, e.size, e.qty && '× ' + e.qty].filter(Boolean).join(' · ') || '—'}</td>
                      <td>{e.date || '—'}</td>{showPaid && <td className="num">{e.totalCost || '—'}</td>}</tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {utils.length > 0 && (
          <section className="bind-sec"><h2>Utilities</h2>
            <dl className="bind-kv">
              {utils.map(([l, p, amt]) => (<Fragment key={l}><dt>{l}</dt><dd>{p}{showUtilCost && amt ? ' — about ' + amt + '/mo' : ''}</dd></Fragment>))}
            </dl>
          </section>
        )}

        {tasks.length > 0 && (
          <section className="bind-sec"><h2>Maintenance log</h2>
            <dl className="bind-kv">
              {tasks.map((t) => (<Fragment key={t.id}><dt>{t.title}</dt><dd>Last done {fmtISO(t.lastDone)} · {t.months < 12 ? 'every ' + t.months + ' months' : t.months === 12 ? 'once a year' : 'every ' + Math.round(t.months / 12) + ' years'}</dd></Fragment>))}
            </dl>
          </section>
        )}

        {(pros || []).length > 0 && (
          <section className="bind-sec"><h2>People we trust &amp; the work they’ve done</h2>
            {pros.map((p) => (
              <div className="report-area" key={p.id} style={{ breakInside: 'avoid' }}>
                <div className="report-area-title"><b>{p.name}</b> <span className="muted">· {p.trade}{showPros && (p.officePhone || p.cellPhone) ? ' · ' + (p.officePhone || p.cellPhone) : ''}</span></div>
                {(p.jobs || []).length > 0 ? (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 13.5 }}>
                    {[...p.jobs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((j) => (
                      <li key={j.id}><b>{fmtISO(j.date) || 'Date unknown'}</b> — {j.work}</li>
                    ))}
                  </ul>
                ) : <div className="hint" style={{ margin: '2px 0 0' }}>No work logged.</div>}
              </div>
            ))}
          </section>
        )}

        <div className="report-foot">
          Prepared from the homeowner’s HomeVault records on {dateStr}. Dates and details are as recorded by the owner;
          please verify anything important with the home inspection.
        </div>
      </div>
    </div>
  )
}
