import { useMemo } from 'react'
import { areaById, warrantyStatus } from '../lib/storage.js'
import ItemResult from './ItemResult.jsx'

// Every warranty across the house, grouped and sorted so the most urgent is on top.
export default function ExpiringView({ state, today, onOpenItem }) {
  const groups = useMemo(() => {
    const withW = state.items
      .map((it) => ({ it, area: areaById(state, it.areaId), w: warrantyStatus(it, today) }))
      .filter((r) => r.w)
      .sort((a, b) => a.w.days - b.w.days) // most negative (expired longest) → soonest first
    return {
      expired: withW.filter((r) => r.w.state === 'expired'),
      soon: withW.filter((r) => r.w.state === 'soon'),
      later: withW.filter((r) => r.w.state === 'ok'),
    }
  }, [state, today])

  const total = groups.expired.length + groups.soon.length + groups.later.length

  if (total === 0) {
    return (
      <div className="empty">
        <div className="big">✅</div>
        <p><strong>No warranties tracked yet.</strong></p>
        <p>Add a warranty expiration date to any item and it'll show up here,
          with a heads-up before it lapses.</p>
      </div>
    )
  }

  return (
    <>
      <Group title="Expired" items={groups.expired} tone="danger" state={state} today={today} onOpenItem={onOpenItem} />
      <Group title="Expiring within 45 days" items={groups.soon} tone="warn" state={state} today={today} onOpenItem={onOpenItem} />
      <Group title="Still covered" items={groups.later} tone="ok" state={state} today={today} onOpenItem={onOpenItem} />
    </>
  )
}

function Group({ title, items, tone, today, onOpenItem }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="section-row">
        <h3><span className={'dot ' + tone} /> {title} <span className="muted">· {items.length}</span></h3>
      </div>
      <div className="items">
        {items.map(({ it, area }) => (
          <ItemResult key={it.id} item={it} area={area} today={today} onClick={() => onOpenItem(it.id)} />
        ))}
      </div>
    </div>
  )
}
