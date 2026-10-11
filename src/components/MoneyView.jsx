import { Icon } from '../lib/icons.jsx'
import { formatPrice } from '../lib/storage.js'
import { findLender, isDirectoryPhone, LENDER_NAMES } from '../lib/lenders.js'
import { parseLocation, providerOptions, findProvider } from '../lib/utilities.js'

// Financial: the complete money picture of the home — mortgage, value & equity,
// and every utility account, saving as you type. (Never store passwords here.)
const money = (v) => formatPrice(v)
const maskDate = (v) => {
  if (!/^[\d/]*$/.test(v)) return v
  const d = v.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4)
  if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2)
  return d
}

const LENDERS = [...LENDER_NAMES, 'Local bank / credit union', 'Paid off — no mortgage']
const LOAN_TYPES = ['30-year fixed', '20-year fixed', '15-year fixed', 'ARM',
  'FHA', 'VA', 'USDA', 'Jumbo', 'Other']
const YESNO = ['Yes', 'No']

const SECTIONS = [
  {
    id: 'mtg', icon: '🏦', title: 'Mortgage',
    intent: 'The loan behind the house — everything you need at refinance or payoff time.',
    fields: [
      ['lender', 'Mortgage company', { options: LENDERS }],
      ['account', 'Loan / account number', {}],
      ['phone', 'Servicer phone', { tel: true }],
      ['payment', 'Monthly payment', { money: true }],
      ['rate', 'Interest rate', { hint: 'e.g. 6.25%' }],
      ['loanType', 'Loan type', { options: LOAN_TYPES }],
      ['original', 'Original loan amount', { money: true }],
      ['balance', 'Current balance', { money: true }],
      ['startDate', 'Loan start date', { date: true }],
      ['escrow', 'Taxes & insurance in escrow?', { options: YESNO }],
      ['pmi', 'Paying PMI?', { options: YESNO, hint: 'Ask to drop it at 20% equity' }],
      ['extra', 'Extra principal each month', { money: true }],
      ['notes', 'Notes', { hint: 'Payoff goals, recast plans — never passwords' }],
    ],
  },
  {
    id: 'val', icon: '📈', title: 'Value & equity',
    intent: 'What it cost, what it\'s worth, and what\'s yours.',
    fields: [
      ['purchase', 'Purchase price', { money: true }],
      ['value', 'Current estimated value', { money: true, hint: 'Zillow tab is one tap away' }],
      ['heloc', 'HELOC / second lien?', { options: YESNO }],
      ['helocDetail', 'HELOC lender & balance', {}],
      ['improvements', 'Major improvements $ (for cost basis)', { money: true }],
    ],
  },
  {
    id: 'util', icon: '🔌', title: 'Utilities',
    intent: 'Every account that keeps the house running, with what it costs a month.',
    fields: [
      ['electricProv', 'Electric provider', { provider: 'electric' }],
      ['electric', 'Electric — account #', {}],
      ['electricAmt', 'Electric — average monthly', { money: true }],
      ['gasProv', 'Gas / propane provider', { provider: 'gas' }],
      ['gas', 'Gas / propane — account #', {}],
      ['gasAmt', 'Gas / propane — average monthly', { money: true }],
      ['waterProv', 'Water / sewer provider', { provider: 'water' }],
      ['water', 'Water / sewer — account #', {}],
      ['waterAmt', 'Water / sewer — average monthly', { money: true }],
      ['trashProv', 'Trash pickup provider', { provider: 'trash' }],
      ['trash', 'Trash — account #', {}],
      ['trashAmt', 'Trash — monthly', { money: true }],
      ['internetProv', 'Internet provider', { provider: 'internet' }],
      ['internet', 'Internet — account #', {}],
      ['internetAmt', 'Internet — monthly', { money: true }],
      ['securityProv', 'Security / monitoring provider', { provider: 'security' }],
      ['security', 'Security — account #', {}],
      ['securityAmt', 'Security — monthly', { money: true }],
    ],
  },
]

const num = (v) => {
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

// Customer-service number for the picked / typed mortgage company, shown right
// under the lender field. Tap to call; one tap copies it into "Servicer phone".
function LenderCard({ lender, phone, onUse }) {
  const name = (lender || '').trim()
  if (!name || /^(paid off|local bank|other)/i.test(name)) return null
  const hit = findLender(name)
  const g = (q) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + q)  // straight to the official page
  if (!hit) {
    return (
      <div className="lender-card unknown">
        <div className="lc-name">{name}</div>
        <div className="lc-line">I don't have a verified customer-service number for this company yet.</div>
        <div className="lc-line">
          <a href={g(name + ' mortgage customer service contact us')} target="_blank" rel="noopener noreferrer">
            Open their official contact page ↗
          </a>
        </div>
        <div className="lc-line lc-small">Your monthly statement lists the number too — type it into Servicer phone below.</div>
      </div>
    )
  }
  const tel = hit.phone.replace('(800) 4-ROCKET', '800-476-2538').replace(/[^0-9+]/g, '')
  const used = phone && phone.replace(/\D/g, '') === hit.phone.replace(/\D/g, '')
  return (
    <div className="lender-card">
      <div className="lc-name">{hit.name} <span className="lc-dept">{hit.label}</span></div>
      <div className="lc-phone">
        <a href={'tel:' + tel}>📞 {hit.phone}</a>
        {!used && <button type="button" className="file-btn" onClick={() => onUse(hit.phone)}>Use as Servicer phone</button>}
        {used && <span className="file-done">✓ Saved as Servicer phone</span>}
      </div>
      {hit.hours && <div className="lc-line">🕒 {hit.hours}</div>}
      <div className="lc-line">
        <a href={hit.page} target="_blank" rel="noopener noreferrer">Official contact page ↗</a>
      </div>
      <div className="lc-line lc-small">From the lender's own website. Your monthly statement is always the final word.</div>
    </div>
  )
}

// Provider picker for one utility: choices that serve this address first.
function ProviderPicker({ id, cat, loc, label, value, onChange }) {
  const { options, check, where, isLocal } = providerOptions(cat, loc)
  const filled = value.trim() !== ''
  const known = findProvider(cat, loc, value)
  const custom = value !== '' && !known
  const local = options.filter((o) => o.local)
  const rest = options.filter((o) => !o.local)
  const hit = known || null
  return (
    <>
      <select id={id} value={custom ? '__other' : value}
        onChange={(e) => {
          const val = e.target.value
          onChange(val === '__other' ? (custom ? value : ' ') : val)
        }}>
        <option value="">Pick one…</option>
        {local.length > 0 && (
          <optgroup label={'Serves the ' + (loc.city || (loc.county ? loc.county + ' County' : 'your')) + ' area'}>
            {local.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
          </optgroup>
        )}
        <optgroup label={isLocal ? 'Other popular options' : 'Popular options' + (where !== 'your area' ? ' near ' + where : '')}>
          {rest.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
        </optgroup>
        <option value="__other">Someone else…</option>
      </select>
      {custom && (
        <input type="text" value={value.trim()} style={{ marginTop: 8 }}
          placeholder="Type the provider's name" onChange={(e) => onChange(e.target.value || ' ')} />
      )}
      {(hit || check) && (
        <div className="prov-card">
          {hit && <div className="pv-name">{hit.name}{hit.note ? <span className="pv-note"> — {hit.note}</span> : null}</div>}
          <div className="pv-links">
            {hit?.url && <a href={hit.url} target="_blank" rel="noopener noreferrer">Official site ↗</a>}
            {check && <a href={check.url} target="_blank" rel="noopener noreferrer">{check.label} ↗</a>}
          </div>
        </div>
      )}
    </>
  )
}

export default function MoneyView({ values, onChange, address, civicInfo }) {
  const loc = parseLocation(address, civicInfo)
  const v = (sec, key) => values?.[sec + '.' + key] || ''
  const set = (sec, key, val) => onChange(sec + '.' + key, val)
  // When the lender is picked or typed, drop its customer-service number into
  // Servicer phone — unless the person typed their own number there.
  const autoPhone = (lenderText) => {
    const hit = findLender(lenderText)
    const cur = v('mtg', 'phone').trim()
    if (hit && (!cur || isDirectoryPhone(cur))) set('mtg', 'phone', hit.phone)
    // A different, unlisted company: don't leave the previous lender's number behind.
    else if (!hit && cur && isDirectoryPhone(cur)) set('mtg', 'phone', '')
  }

  const utilTotal = ['electricAmt', 'gasAmt', 'waterAmt', 'trashAmt', 'internetAmt', 'securityAmt']
    .reduce((t, k) => t + num(v('util', k)), 0)
  const equity = num(v('val', 'value')) - num(v('mtg', 'balance'))

  const quick = [
    ['Mortgage / mo', money(v('mtg', 'payment')) || '—'],
    ['Rate', v('mtg', 'rate') || '—'],
    ['Balance', money(v('mtg', 'balance')) || '—'],
    ['Equity (est.)', v('val', 'value') && v('mtg', 'balance') ? money(String(equity)) : '—'],
    ['Utilities / mo', utilTotal ? money(String(utilTotal)) : '—'],
  ]

  return (
    <div className="fin">
      <div className="intake-lede">
        <h2>Financial</h2>
        <p>The complete money picture of this home — mortgage, value, equity, and every utility
          account. Fill in what you know; it saves as you type and never leaves this device.</p>
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
        <section className="intake-sec" data-accent={sec.id === 'mtg' ? 'record' : (sec.id === 'util' ? 'wood' : 'ink')} key={sec.id}>
          <div className="intake-sec-head">
            <div className="intake-num">{sec.icon}</div>
            <div>
              <h3>{sec.title}</h3>
              <p>{sec.intent}</p>
            </div>
          </div>
          <div className="intake-qs" style={{ marginTop: 10 }}>
            {sec.fields.map(([key, label, opt]) => {
              const id = 'money-' + sec.id + '-' + key
              const raw = v(sec.id, key)
              const filled = raw.trim() !== ''
              // ' ' (one space) is the "Other…" placeholder: show the type-it-in box straight away.
              const custom = opt.options ? (raw !== '' && !opt.options.includes(raw)) : false
              return (
                <div className={'intake-field' + (filled ? ' filled' : '')} key={key}>
                  <label htmlFor={id}>
                    <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
                    <span className="q">{label}</span>
                  </label>
                  {opt.provider ? (
                    <ProviderPicker id={id} cat={opt.provider} loc={loc} label={label} value={raw}
                      onChange={(val) => set(sec.id, key, val)} />
                  ) : opt.options ? (
                    <>
                      <select id={id} value={custom ? '__other' : raw}
                        onChange={(e) => {
                          const val = e.target.value
                          set(sec.id, key, val === '__other' ? (custom ? raw : ' ') : val)
                          if (sec.id === 'mtg' && key === 'lender') autoPhone(val)
                        }}>
                        <option value="">Pick one…</option>
                        {opt.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        <option value="__other">Other…</option>
                      </select>
                      {custom && (
                        <input type="text" value={raw.trim()} style={{ marginTop: 8 }}
                          placeholder="Type it in" onChange={(e) => {
                            set(sec.id, key, e.target.value || ' ')
                            if (sec.id === 'mtg' && key === 'lender') autoPhone(e.target.value)
                          }} />
                      )}
                    </>
                  ) : (
                    <input id={id} type="text" value={raw}
                      inputMode={opt.date || opt.money ? 'numeric' : (opt.tel ? 'tel' : undefined)}
                      placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
                      onChange={(e) => set(sec.id, key, opt.date ? maskDate(e.target.value) : e.target.value)}
                      onBlur={opt.money ? () => set(sec.id, key, money(v(sec.id, key))) : undefined} />
                  )}
                  {sec.id === 'mtg' && key === 'lender' && (
                    <LenderCard lender={raw} phone={v('mtg', 'phone')} onUse={(ph) => set('mtg', 'phone', ph)} />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <div className="intake-foot" style={{ marginTop: 16 }}>
        <Icon.shield size={18} />
        <span>Account numbers stay on this device. Never store passwords here — a password manager
          is the right home for those.</span>
      </div>
    </div>
  )
}
