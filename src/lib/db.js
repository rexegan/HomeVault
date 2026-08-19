// Tiny IndexedDB wrapper for storing uploaded files (receipt/warranty photos, PDFs).
// Files are kept as Blobs here (IndexedDB has far more room than localStorage),
// while the lightweight item metadata lives in localStorage (see storage.js).

const DB_NAME = 'homevault'
const STORE = 'files'
const VERSION = 1

let dbPromise = null

function open() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(mode) {
  return open().then((db) => db.transaction(STORE, mode).objectStore(STORE))
}

let counter = 0
function makeId() {
  // Time-free unique id (Date.now/Math.random avoided per environment rules is
  // not a concern in the browser, but keep it robust regardless).
  counter += 1
  const rand = (crypto?.getRandomValues
    ? crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 1e9))
  return `f_${rand.toString(36)}_${counter.toString(36)}`
}

export async function saveFile(file) {
  const id = makeId()
  const record = {
    id,
    name: file.name || 'file',
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    blob: file, // Blobs/Files are structured-cloneable
  }
  const store = await tx('readwrite')
  await promisify(store.put(record))
  return { id, name: record.name, type: record.type, size: record.size }
}

// Store a file blob under a specific id (used when restoring a backup).
export async function saveFileWithId(id, blob, name, type) {
  const record = {
    id,
    name: name || 'file',
    type: type || blob.type || 'application/octet-stream',
    size: blob.size || 0,
    blob,
  }
  const store = await tx('readwrite')
  await promisify(store.put(record))
  return { id, name: record.name, type: record.type, size: record.size }
}

export async function getFile(id) {
  const store = await tx('readonly')
  const rec = await promisify(store.get(id))
  return rec || null
}

export async function getFileURL(id) {
  const rec = await getFile(id)
  if (!rec) return null
  return URL.createObjectURL(rec.blob)
}

export async function deleteFile(id) {
  const store = await tx('readwrite')
  await promisify(store.delete(id))
}

function promisify(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
