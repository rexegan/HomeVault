import { Icon } from '../lib/icons.jsx'
import { formatPrice } from '../lib/storage.js'

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

const LENDERS = ['Rocket Mortgage', 'Chase', 'Wells Fargo', 'Mr. Cooper', 'PennyMac',
  'U.S. Bank', 'Bank of America', 'Freedom Mortgage', 'Veterans United',
  'Local bank / credit union', 'Paid off — no mortgage', 'Other']
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
      ['electric', 'Electric — provider & account #', {}],
      ['electricAmt', 'Electric — average monthly', { money: true }],
      ['gas', 'Gas / propane — provider & account #', {}],
      ['gasAmt', 'Gas / propane — average monthly', { money: true }],
      ['water', 'Water / sewer — provider & account #', {}],
      ['waterAmt', 'Water / sewer — average monthly', { money: true }],
      ['trash', 'Trash — provider & account #', {}],
      ['trashAmt', 'Trash — monthly', { money: true }],
      ['internet', 'Internet — provider & account #', {}],
      ['internetAmt', 'Internet — monthly', { money: true }],
      ['security', 'Security / monitoring — provider & account #', {}],
      ['securityAmt', 'Security — monthly', { money: true }],
    ],
  },
]

const num = (v) => {
  const n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

export default function MoneyView({ values, onChange }) {
  const v = (sec, key) => values?.[sec + '.' + key] || ''
  const set = (sec, key, val) => onChange(sec + '.' + key, val)

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
              const custom = opt.options ? (filled && !opt.options.includes(raw)) : false
              return (
                <div className={'intake-field' + (filled ? ' filled' : '')} key={key}>
                  <label htmlFor={id}>
                    <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
                    <span className="q">{label}</span>
                  </label>
                  {opt.options ? (
                    <>
                      <select id={id} value={custom ? '__other' : raw}
                        onChange={(e) => {
                          const val = e.target.value
                          set(sec.id, key, val === '__other' ? (custom ? raw : ' ') : val)
                        }}>
                        <option value="">Pick one…</option>
                        {opt.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        <option value="__other">Other…</option>
                      </select>
                      {custom && (
                        <input type="text" value={raw.trim()} style={{ marginTop: 8 }}
                          placeholder="Type it in" onChange={(e) => set(sec.id, key, e.target.value || ' ')} />
                      )}
                    </>
                  ) : (
                    <input id={id} type="text" value={raw}
                      inputMode={opt.date || opt.money ? 'numeric' : (opt.tel ? 'tel' : undefined)}
                      placeholder={opt.date ? 'MM/DD/YYYY — just type the numbers' : (opt.hint || 'Add detail…')}
                      onChange={(e) => set(sec.id, key, opt.date ? maskDate(e.target.value) : e.target.value)}
                      onBlur={opt.money ? () => set(sec.id, key, money(v(sec.id, key))) : undefined} />
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
