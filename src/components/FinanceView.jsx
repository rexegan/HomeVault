import { Icon } from '../lib/icons.jsx'
import { formatPrice } from '../lib/storage.js'
import MultiSelect from './MultiSelect.jsx'

// Insurance / Taxes: the money side of the home in one place — the full
// homeowners-insurance record, the property-tax record, and the county links.
const INSURERS = ['State Farm', 'Allstate', 'Farm Bureau', 'USAA', 'Farmers',
  'Liberty Mutual', 'Progressive', 'Nationwide', 'Travelers', 'Germania',
  'Texas Fair Plan', 'Lemonade', 'Other']
const YESNO = ['Yes', 'No']
const COVERAGES = ['Homeowners (HO-3)', 'Dwelling fire (DP-3)', 'Windstorm / hail', 'Flood', 'Earthquake', 'Umbrella / liability',
  'Water / sewer backup', 'Scheduled valuables', 'Equipment breakdown', 'Home warranty plan', 'Renters / personal property',
  'Landlord / rental dwelling', 'Pool & outdoor structures', 'Identity theft']

const money = (v) => formatPrice(v)
const maskDate = (v) => {
  if (!/^[\d/]*$/.test(v)) return v
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2)
  return d
}

const SECTIONS = [
  {
    id: 'ins', icon: '🛡️', title: 'Homeowners insurance',
    intent: 'Everything you need the day you file a claim — before you need it.',
    fields: [
      ['coverage', 'Types of coverage', { multi: COVERAGES }],
      ['company', 'Insurance company', { options: INSURERS }],
      ['policy', 'Policy number', {}],
      ['agent', 'Agent name', {}],
      ['agentPhone', 'Agent phone', { tel: true }],
      ['premium', 'Annual premium', { money: true }],
      ['renewal', 'Renewal date', { date: true }],
      ['dwelling', 'Dwelling coverage', { money: true }],
      ['personal', 'Personal property coverage', { money: true }],
      ['deductible', 'Deductible (all perils)', { hint: '$ or % of dwelling' }],
      ['windHail', 'Wind / hail deductible', { hint: 'Often 1–2% in Texas' }],
      ['flood', 'Separate flood policy?', { options: YESNO }],
      ['floodPolicy', 'Flood policy number', {}],
      ['notes', 'Notes', { hint: 'Claims filed, discounts, roof credit…' }],
    ],
  },
  {
    id: 'tax', icon: '🏛️', title: 'Property taxes',
    intent: 'What the county thinks your home is worth, and what that costs you.',
    fields: [
      ['county', 'County', {}],
      ['account', 'Appraisal district account #', {}],
      ['appraised', 'Appraised value', { money: true }],
      ['annualTax', 'Annual property tax', { money: true }],
      ['homestead', 'Homestead exemption filed?', { options: YESNO, hint: 'Free money if you live here — file it!' }],
      ['dueDate', 'Taxes due', { date: true, hint: 'Texas: January 31' }],
      ['protested', 'Last protested value', { hint: 'Year & outcome' }],
      ['notes', 'Notes', {}],
    ],
  },
]

export default function FinanceView({ values, onChange, civicInfo }) {
  const v = (sec, key) => values?.[sec + '.' + key] || ''
  const set = (sec, key, val) => onChange(sec + '.' + key, val)

  // Prefill county from the County/City lookup once known.
  const countyGuess = civicInfo?.countyName || ''
  const county = v('tax', 'county') || countyGuess

  const quick = [
    ['Premium', money(v('ins', 'premium')) || '—'],
    ['Deductible', v('ins', 'deductible') || '—'],
    ['Appraised', money(v('tax', 'appraised')) || '—'],
    ['Annual tax', money(v('tax', 'annualTax')) || '—'],
  ]

  const g = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + q)  // straight to the official page
  const links = county ? [
    ['🏛️', county + ' Appraisal District', 'Look up your appraised value & exemptions.', g(county + ' appraisal district property search')],
    ['💰', 'Pay / view property taxes', 'Statements and payment for ' + county + '.', g(county + ' tax office pay property tax')],
    ['📉', 'Protest your appraisal', 'Deadlines and how-to for ' + county + '.', g('how to protest property appraisal ' + county)],
  ] : []

  return (
    <div className="fin">
      <div className="intake-lede">
        <h2>Insurance / Taxes</h2>
        <p>Complete financial awareness for the house — your insurance file, your tax record,
          and the county offices behind them. Fill in what you know; it saves as you type.</p>
      </div>

      <div className="fin-quick">
        {quick.map(([l, n]) => (
          <div className="stat" key={l}>
            <div className="n" style={{ fontSize: 18 }}>{n}</div>
            <div className="l">{l}</div>
          </div>
        ))}
      </div>

      {SECTIONS.map((sec) => (
        <section className="intake-sec" data-accent={sec.id === 'ins' ? 'record' : 'ink'} key={sec.id}>
          <div className="intake-sec-head">
            <div className="intake-num">{sec.icon}</div>
            <div>
              <h3>{sec.title}</h3>
              <p>{sec.intent}</p>
            </div>
          </div>
          <div className="intake-qs" style={{ marginTop: 10 }}>
            {sec.fields.map(([key, label, opt]) => {
              const id = 'fin-' + sec.id + '-' + key
              const raw = sec.id === 'tax' && key === 'county' ? county : v(sec.id, key)
              const filled = raw.trim() !== ''
              const handle = (val) => {
                if (opt.date) val = maskDate(val)
                set(sec.id, key, val)
              }
              return (
                opt.multi ? (
                  <MultiSelect key={key} id={id} label={label} value={raw} options={opt.multi}
                    onChange={(val) => set(sec.id, key, val)} />
                ) : (
                <div className={'intake-field' + (filled ? ' filled' : '')} key={key}>
                  <label htmlFor={id}>
                    <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
                    <span className="q">{label}</span>
                  </label>
                  {opt.options ? (
                    <>
                      <select id={id} value={raw !== '' && !opt.options.includes(raw) ? '__other' : raw}
                        onChange={(e) => {
                          const val = e.target.value
                          set(sec.id, key, val === '__other' ? (raw !== '' && !opt.options.includes(raw) ? raw : ' ') : val)
                        }}>
                        <option value="">Pick one…</option>
                        {opt.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        <option value="__other">Other…</option>
                      </select>
                      {raw !== '' && !opt.options.includes(raw) && (
                        <input type="text" value={raw.trim()} style={{ marginTop: 8 }}
                          placeholder="Type it in" onChange={(e) => set(sec.id, key, e.target.value || ' ')} />
                      )}
                    </>
                  ) : (
                    <input id={id} type="text" value={raw}
                      inputMode={opt.date || opt.money ? 'numeric' : (opt.tel ? 'tel' : undefined)}
                      placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
                      onChange={(e) => handle(e.target.value)}
                      onBlur={opt.money ? () => set(sec.id, key, money(v(sec.id, key))) : undefined} />
                  )}
                </div>
                )
              )
            })}
          </div>
        </section>
      ))}

      {links.length > 0 && (
        <>
          <div className="section-row"><h3>{county} offices</h3></div>
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
        </>
      )}

      <div className="intake-foot" style={{ marginTop: 16 }}>
        <Icon.shield size={18} />
        <span>Policy numbers and financial details stay on this device, like everything else in
          your vault.</span>
      </div>
    </div>
  )
}
