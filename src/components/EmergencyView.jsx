import { useMemo } from 'react'
import { Icon } from '../lib/icons.jsx'
import { TextField } from './FinishesForm.jsx'
import { KEY_FIELDS } from '../lib/intake.js'
import { parseLocation, findProvider } from '../lib/utilities.js'

// Emergency card: where the shutoffs are, who to call, and the family plan — on
// one screen you fill in once, and print for the fridge. Never store codes or
// passwords here; say where things are, not how to open them.

export const EMERGENCY_SECTIONS = [
  { title: '🚰 Shutoffs & panels', fields: [
    ['waterMain', 'Main water shutoff', 'Where, e.g. in the garage on the left wall, or by the street meter'],
    ['waterHeater', 'Water heater shutoff', 'Cold-water valve on top; gas or breaker location'],
    ['gas', 'Gas shutoff & meter', 'Meter location and the wrench you use'],
    ['panel', 'Main electrical panel', 'Where it is; which breaker is the main'],
    ['subpanel', 'Sub-panel / breaker notes', 'Garage sub-panel, pool, A/C breakers'],
    ['irrigation', 'Sprinkler shutoff', 'Backflow valve and controller location'],
    ['hvac', 'A/C & heating disconnect', 'Outdoor disconnect box and the indoor switch'],
    ['garageRelease', 'Garage door manual release', 'Red cord location'],
  ] },
  { title: '🧯 Safety gear', fields: [
    ['extinguishers', 'Fire extinguishers', 'Kitchen, garage, upstairs hall…'],
    ['detectors', 'Smoke & CO detectors', 'How many, and where'],
    ['firstAid', 'First-aid kit & flashlights', 'Where they live'],
    ['generator', 'Generator / transfer switch', 'Where it is and how to start it'],
    ['shelter', 'Storm shelter / safe room', 'Location'],
  ] },
  { title: '🔑 Access & valuables', fields: [
    ['spareKey', 'Spare keys', 'Who has one and where the hidden one is'],
    ['safe', 'Safe or fire box', 'Where it is — never the combination'],
    ['alarm', 'Alarm company', 'Company and phone — never the code'],
    ['attic', 'Attic / crawlspace access', 'Hatch location'],
    ['wifi', 'Wi-Fi network name', 'The name only — never the password'],
  ] },
  { title: '👪 Family plan', fields: [
    ['meet', 'Meeting spot outside', 'e.g. the mailbox, the neighbor’s driveway'],
    ['outOfTown', 'Out-of-town contact', 'Name and phone — everyone checks in with them'],
    ['neighbor', 'Neighbor with a key', 'Name, address, phone'],
    ['pets', 'Pets & who to call', 'Names, vet, who takes them'],
  ] },
]

const TRADE_RE = /plumb|electric|a\/c|hvac|heat|roof|locksmith|garage door|restoration|foundation|tree|septic|well/i

export default function EmergencyView({ values, onChange, profile, pros, finance, money, civicInfo }) {
  const address = (profile?.[KEY_FIELDS.address] || '').trim()
  const loc = parseLocation(address, civicInfo)
  const v = (k) => values?.[k] || ''
  const filled = EMERGENCY_SECTIONS.flatMap((s) => s.fields).filter(([k]) => v(k).trim()).length
  const total = EMERGENCY_SECTIONS.flatMap((s) => s.fields).length

  const g = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + q)
  const utilCalls = useMemo(() => {
    const out = []
    for (const [cat, key, what, query] of [
      ['electric', 'util.electricProv', 'Power outage', 'report power outage'],
      ['gas', 'util.gasProv', 'Gas leak / emergency', 'gas leak emergency number'],
      ['water', 'util.waterProv', 'Water emergency / main break', 'report water main break emergency'],
    ]) {
      const name = (money?.[key] || '').trim()
      if (!name || /^private well|^septic/i.test(name)) continue
      const hit = findProvider(cat, loc, name)
      out.push({ what, name, phone: /^atmos/i.test(name) ? '888-286-6700' : '',
        url: g(name + ' ' + query), site: hit?.url || '' })
    }
    return out
  }, [money, loc.city, loc.state, loc.county])

  const crew = useMemo(() => (pros || []).filter((p) => TRADE_RE.test(p.trade || '')).slice(0, 6), [pros])
  const ins = [finance?.['ins.company'], finance?.['ins.policy'] && 'Policy ' + finance['ins.policy']].filter(Boolean).join(' · ')

  const tel = (n) => 'tel:' + String(n).replace(/[^0-9+]/g, '')

  return (
    <div className="emergency">
      <div className="report-toolbar no-print">
        <div className="hint">Fill in what you know — it saves as you type. Then print it for the fridge or save it as a PDF.</div>
        <button className="btn" onClick={() => window.print()}><Icon.file size={18} /> Print / Save as PDF</button>
      </div>

      <div className="report-doc em-doc">
        <div className="report-head">
          <div className="report-title">
            <Icon.shield size={26} />
            <div>
              <h1>Emergency Card</h1>
              {address && <div className="report-addr">{address}</div>}
              <div className="report-date no-print">{filled} of {total} filled in</div>
            </div>
          </div>
        </div>

        <div className="em-call">
          <div className="em-call-title">In an emergency</div>
          <div className="em-call-grid">
            <a href="tel:911"><b>911</b><span>Fire · medical · break-in</span></a>
            <a href="tel:18002221222"><b>1-800-222-1222</b><span>Poison Control</span></a>
            <a href="tel:811"><b>811</b><span>Before you dig</span></a>
            {utilCalls.filter((u) => u.phone).map((u) => (
              <a key={u.what} href={tel(u.phone)}><b>{u.phone}</b><span>{u.name} — {u.what}</span></a>
            ))}
          </div>
          <div className="em-note">Smell gas? Leave the house first, then call — don’t flip switches or use a phone inside.</div>
        </div>

        {(utilCalls.some((u) => !u.phone) || ins || crew.length > 0) && (
          <div className="em-who">
            <h3>Who to call</h3>
            {utilCalls.filter((u) => !u.phone).map((u) => (
              <div className="em-row" key={u.what}>
                <span className="em-k">{u.what}</span>
                <span className="em-v">{u.name} — <a href={u.url} target="_blank" rel="noopener noreferrer" className="no-print">find their emergency line ↗</a>
                  <span className="print-only">see their website or your last bill</span></span>
              </div>
            ))}
            {ins && (
              <div className="em-row">
                <span className="em-k">Home insurance</span>
                <span className="em-v">{ins}{finance?.['ins.agentPhone'] ? <> · <a href={tel(finance['ins.agentPhone'])}>{finance['ins.agentPhone']}</a></> : null}</span>
              </div>
            )}
            {crew.map((p) => {
              const ph = p.cellPhone || p.officePhone
              return (
                <div className="em-row" key={p.id}>
                  <span className="em-k">{p.trade}</span>
                  <span className="em-v">{p.name}{ph ? <> · <a href={tel(ph)}>{ph}</a></> : null}</span>
                </div>
              )
            })}
          </div>
        )}

        {EMERGENCY_SECTIONS.map((sec) => (
          <section className="em-sec" key={sec.title}>
            <h3>{sec.title}</h3>
            <div className="em-fields">
              {sec.fields.map(([key, label, hint]) => (
                <div className="em-field" key={key}>
                  <TextField id={'em-' + key} label={label} value={v(key)}
                    onChange={(val) => onChange(key, val)} opt={{ hint }} />
                  <div className="em-print-val print-only"><b>{label}:</b> {v(key) || '________________'}</div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="report-foot">
          Say where things are — never write down codes, combinations or passwords.
          Kept privately in HomeVault on this device.
        </div>
      </div>
    </div>
  )
}
