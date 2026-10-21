import { useState } from 'react'

// A drop-down with a check box beside every choice, so several can be picked at
// once. What's picked shows right in the box. Saved as one text value, "A; B; C".
export const splitMulti = (v) => String(v || '').split(/;\s*/).map((x) => x.trim()).filter(Boolean)

export default function MultiSelect({ id, label, value, options, onChange, otherHint = 'Add another…' }) {
  const [open, setOpen] = useState(false)
  const [extra, setExtra] = useState('')
  const picked = splitMulti(value)
  const custom = picked.filter((p) => !options.includes(p))
  const toggle = (opt) => {
    const next = picked.includes(opt) ? picked.filter((p) => p !== opt) : [...picked, opt]
    onChange(next.join('; '))
  }
  const addExtra = () => {
    const t = extra.trim()
    if (!t) return
    if (!picked.includes(t)) onChange([...picked, t].join('; '))
    setExtra('')
  }
  return (
    <div className={'intake-field' + (picked.length ? ' filled' : '')}>
      <label htmlFor={id}>
        <span className="chk" aria-hidden="true">{picked.length ? '✓' : ''}</span>
        <span className="q">{label}</span>
      </label>
      <button type="button" id={id} className="multi-box" aria-expanded={open} aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}>
        <span className="multi-vals">
          {picked.length === 0
            ? <span className="multi-ph">Pick all that apply…</span>
            : picked.map((p) => <span className="multi-chip" key={p}>{p}</span>)}
        </span>
        <span className="multi-caret" aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="multi-panel" role="listbox" aria-multiselectable="true">
          {options.map((o) => (
            <label className="multi-opt" key={o}>
              <input type="checkbox" checked={picked.includes(o)} onChange={() => toggle(o)} />
              <span>{o}</span>
            </label>
          ))}
          {custom.map((o) => (
            <label className="multi-opt" key={o}>
              <input type="checkbox" checked onChange={() => toggle(o)} />
              <span>{o}</span>
            </label>
          ))}
          <div className="multi-add">
            <input type="text" value={extra} placeholder={otherHint} data-enter-own="1"
              onChange={(e) => setExtra(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExtra() } }} />
            <button type="button" className="btn small" onClick={addExtra} disabled={!extra.trim()}>Add</button>
          </div>
          <button type="button" className="btn small multi-done" onClick={() => setOpen(false)}>Done</button>
        </div>
      )}
    </div>
  )
}
