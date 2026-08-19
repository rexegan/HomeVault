import { Icon } from '../lib/icons.jsx'
import { INTAKE, INTAKE_TOTAL } from '../lib/intake.js'

// The Home Profile: the full intake questionnaire, inside the app — but now every
// question is an input you fill in. Questions with a defined set of choices show a
// dropdown you can pick from OR type your own (a <datalist>); the rest are free text.
// Answers are held by App and persisted. Section 07 is a reference spec.
export default function HomeProfile({ values, onChange, onReset, filed = {}, onFile }) {
  const done = countFilled(values)
  const pct = INTAKE_TOTAL ? Math.round((done / INTAKE_TOTAL) * 100) : 0

  return (
    <div className="intake">
      <div className="intake-lede">
        <h2>Everything about your home</h2>
        <p>One pass through the whole property — front to back, roof to foundation, every room
          and system. Fill in what you know; pick from the dropdown or type your own. It saves as
          you go, and feeds your floor plan and vault.</p>
      </div>

      <div className="intake-progress">
        <div className="count"><b>{done}</b> / {INTAKE_TOTAL} filled in</div>
        <div className="bar"><div className="fill" style={{ width: pct + '%' }} /></div>
        <button className="reset" onClick={onReset} disabled={done === 0}>Reset</button>
      </div>

      <div className="intake-legend">
        <span><i className="dot ink" /> Structure &amp; spaces</span>
        <span><i className="dot record" /> Records &amp; fields</span>
        <span><i className="dot wood" /> People &amp; paperwork</span>
      </div>

      {INTAKE.map((sec) => (
        <section className="intake-sec" data-accent={sec.accent} key={sec.id}>
          <div className="intake-sec-head">
            <div className="intake-num">{sec.num}</div>
            <div>
              <h3>{sec.title}</h3>
              <p>{sec.intent}</p>
            </div>
          </div>

          {sec.type === 'spec' ? (
            <div className="intake-spec">
              {sec.fields.map(([name, hint], i) => (
                <div className="spec-cell" key={i}>
                  <div className="n">{String(i + 1).padStart(2, '0')}</div>
                  <div className="t">{name}</div>
                  <div className="h">{hint}</div>
                </div>
              ))}
            </div>
          ) : (
            sec.groups.map((g, gi) => (
              <div className="intake-group" key={gi}>
                {g.label && <div className="intake-grp-label">{g.label}</div>}
                <div className="intake-qs">
                  {g.items.map((item) => (
                    <Field key={item.id} item={item}
                      value={values[item.id] || ''} onChange={(v) => onChange(item.id, v)}
                      isFiled={!!filed[item.id]} onFile={onFile} />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      ))}

      <div className="intake-foot">
        <Icon.shield size={18} />
        <span>Your answers stay on this device. Sections 01–06 describe your home; 07–09 become
          the fields, contacts and documents in your vault.</span>
      </div>
    </div>
  )
}

function Field({ item, value, onChange, isFiled, onFile }) {
  const filled = value.trim() !== ''
  const listId = item.options ? 'dl-' + item.id.replace(/[:]/g, '-') : undefined
  return (
    <div className={'intake-field' + (filled ? ' filled' : '')}>
      <label htmlFor={item.id}>
        <span className="chk" aria-hidden="true">{filled ? '✓' : ''}</span>
        <span className="q">{item.q}</span>
      </label>
      <input
        id={item.id}
        type="text"
        list={listId}
        value={value}
        placeholder={item.hint || (item.options ? 'Pick or type…' : 'Add detail…')}
        onChange={(e) => onChange(e.target.value)}
      />
      {item.options && (
        <datalist id={listId}>
          {item.options.map((o) => <option key={o} value={o} />)}
        </datalist>
      )}
      {item.file && filled && (
        isFiled ? (
          <span className="file-done"><Icon.shield size={13} /> Filed in {item.file.room}</span>
        ) : (
          <button className="file-btn" onClick={() => onFile(item.id, item.file, value)}>
            <Icon.plus size={13} /> File “{item.file.item}” in {item.file.room}
          </button>
        )
      )}
    </div>
  )
}

function countFilled(values) {
  let n = 0
  for (const k in values) {
    // spec-section ids never appear here; only real question ids get stored
    if (String(values[k]).trim() !== '') n++
  }
  return n
}
