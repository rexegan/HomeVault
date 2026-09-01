// Data model + persistence (localStorage). Uploaded file blobs live in db.js;
// here we only keep light metadata so localStorage stays small and fast.
//
// Shape:
//   state = {
//     areas: [{ id, name, icon, zone, variant? }],
//     items: [{ id, areaId, name, category, vendor, purchaseDate,
//               warrantyExpires, price, notes, files:[{id,name,type,size}] }],
//   }

import { defaultAreas } from './defaults.js'

const KEY = 'homevault:v2'

let counter = 0
function id(prefix) {
  counter += 1
  const rand = (typeof crypto !== 'undefined' && crypto.getRandomValues)
    ? crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 1e9)
  return `${prefix}_${rand.toString(36)}_${counter.toString(36)}`
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.areas)) return parsed
    }
  } catch (e) {
    console.warn('HomeVault: could not read saved data', e)
  }
  return seed()
}

function seed() {
  const areas = defaultAreas().map((a) => ({ id: id('a'), ...a }))
  const state = { areas, items: [] }
  save(state)
  return state
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch (e) {
    console.warn('HomeVault: could not save data', e)
  }
}

// ---- Home Profile (intake) checklist state ----
// Stored separately as a map of { questionId: 1 } for checked questions.
const INTAKE_KEY = 'homevault:intake:v1'

export function loadIntake() {
  try {
    const raw = localStorage.getItem(INTAKE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch (e) {
    console.warn('HomeVault: could not read intake', e)
  }
  return {}
}

export function saveIntake(map) {
  try {
    localStorage.setItem(INTAKE_KEY, JSON.stringify(map))
  } catch (e) {
    console.warn('HomeVault: could not save intake', e)
  }
}

// ---- Generic small stores (Home Care dates, service pros) ----
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch (e) {
    console.warn('HomeVault: could not read ' + key, e)
  }
  return fallback
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch (e) { console.warn('HomeVault: could not save ' + key, e) }
}

const CARE_KEY = 'homevault:care:v1'   // { taskId: 'YYYY-MM-DD' last done }
export const loadCare = () => loadJSON(CARE_KEY, {})
export const saveCare = (map) => saveJSON(CARE_KEY, map)

const PROS_KEY = 'homevault:pros:v1'   // [{ id, trade, name, phone, email, notes }]
export const loadPros = () => loadJSON(PROS_KEY, []).filter?.((p) => p && p.id) || []
export const savePros = (list) => saveJSON(PROS_KEY, list)
export const newProId = () => id('p')

// ---- Areas ----
export function addArea(state, data) {
  const area = { id: id('a'), name: data.name || 'New area', icon: data.icon || 'box', zone: data.zone || 'inside', variant: data.variant }
  return { ...state, areas: [...state.areas, area] }
}

export function updateArea(state, areaId, data) {
  return { ...state, areas: state.areas.map((a) => (a.id === areaId ? { ...a, ...data } : a)) }
}

export function deleteArea(state, areaId) {
  return {
    ...state,
    areas: state.areas.filter((a) => a.id !== areaId),
    items: state.items.filter((it) => it.areaId !== areaId),
  }
}

// ---- Items ----
export function addItem(state, areaId, data) {
  const item = { id: id('i'), areaId, files: [], ...data }
  return { ...state, items: [...state.items, item] }
}

export function updateItem(state, itemId, data) {
  return { ...state, items: state.items.map((it) => (it.id === itemId ? { ...it, ...data } : it)) }
}

export function deleteItem(state, itemId) {
  return { ...state, items: state.items.filter((it) => it.id !== itemId) }
}

// ---- Selectors ----
export function itemsForArea(state, areaId) {
  return state.items.filter((it) => it.areaId === areaId)
}

export function areaById(state, areaId) {
  return state.areas.find((a) => a.id === areaId) || null
}

// Warranty status relative to `today` (a Date). Returns null when no warranty.
export function warrantyStatus(item, today) {
  if (!item.warrantyExpires) return null
  const exp = new Date(item.warrantyExpires + 'T00:00:00')
  if (isNaN(exp)) return null
  const days = Math.round((exp - today) / 86400000)
  if (days < 0) return { state: 'expired', days }
  if (days <= 45) return { state: 'soon', days }
  return { state: 'ok', days }
}
