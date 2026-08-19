import { useMemo, useRef, useEffect } from 'react'
import { Icon } from '../lib/icons.jsx'
import { CATEGORIES } from '../lib/defaults.js'
import { areaById } from '../lib/storage.js'
import ItemResult from './ItemResult.jsx'

// House-wide search across every stored item: name, store/brand, notes, category
// and the room name all match.
export default function SearchView({ state, today, query, setQuery, onOpenItem }) {
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return state.items
      .map((it) => ({ it, area: areaById(state, it.areaId) }))
      .filter(({ it, area }) => {
        const cat = CATEGORIES.find((c) => c.id === it.category)?.label || ''
        const hay = [it.name, it.vendor, it.notes, cat, area?.name].filter(Boolean).join(' ').toLowerCase()
        return hay.includes(q)
      })
  }, [state, query])

  const q = query.trim()

  return (
    <>
      <div className="search-bar">
        <Icon.search size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search all rooms — fridge, roof, Home Depot…"
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && <button className="clear" onClick={() => setQuery('')} aria-label="Clear">×</button>}
      </div>

      {!q && (
        <div className="empty">
          <div className="big">🔎</div>
          <p><strong>Search your whole house.</strong></p>
          <p>Find anything by name, store, brand, note or room.</p>
        </div>
      )}

      {q && results.length === 0 && (
        <div className="empty">
          <div className="big">🤔</div>
          <p><strong>No matches for “{q}”.</strong></p>
          <p>Try a different word — a brand, store or item name.</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="section-row"><h3>{results.length} {results.length === 1 ? 'result' : 'results'}</h3></div>
          <div className="items">
            {results.map(({ it, area }) => (
              <ItemResult key={it.id} item={it} area={area} today={today} onClick={() => onOpenItem(it.id)} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
