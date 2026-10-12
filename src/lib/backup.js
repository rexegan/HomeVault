// Backup & restore: bundle the WHOLE vault — rooms & items, the Home Profile,
// pros, paint & finishes, pool, lawn, money, care log, weather/county caches and
// every uploaded file (receipt photos, PDFs, 3D scans) — into one portable JSON
// file, and restore it on any device. (Version 1 backups held only the items.)

import { getAllFiles, getFile, saveFileWithId } from './db.js'
import { save } from './storage.js'

const PREFIX = 'homevault:'
const STAMP_KEY = 'homevault:lastBackup'

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

function dataURLToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',')
  const mime = (head.match(/data:(.*?);base64/) || [])[1] || 'application/octet-stream'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function lastBackupDate() {
  try { return localStorage.getItem(STAMP_KEY) || '' } catch { return '' }
}

// Build the backup object: every homevault:* setting + every stored file.
export async function buildBackup(state) {
  const local = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX) && k !== STAMP_KEY) local[k] = localStorage.getItem(k)
  }
  const files = []
  for (const rec of await getAllFiles()) {
    if (!rec?.blob) continue
    files.push({ id: rec.id, name: rec.name, type: rec.type, dataUrl: await blobToDataURL(rec.blob) })
  }
  return { app: 'homevault', version: 2, exportedAt: new Date().toISOString(), state, local, files }
}

// Trigger a download of the backup as a .json file.
export async function exportBackup(state) {
  const payload = await buildBackup(state)
  const json = JSON.stringify(payload)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `homevault-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  try { localStorage.setItem(STAMP_KEY, stamp) } catch { /* ignore */ }
  return { files: payload.files.length, settings: Object.keys(payload.local).length, mb: json.length / 1e6 }
}

// Read a backup file and restore it. A version 2 backup replaces every setting
// and file, then the app reloads itself; a version 1 backup restores items only.
export async function importBackup(file) {
  const text = await file.text()
  const payload = JSON.parse(text)
  if (!payload || payload.app !== 'homevault' || !payload.state?.areas) {
    throw new Error('This does not look like a HomeVault backup file.')
  }
  for (const f of payload.files || []) {
    try {
      const blob = dataURLToBlob(f.dataUrl)
      await saveFileWithId(f.id, blob, f.name, f.type)
    } catch (e) {
      console.warn('Skipped a file during restore', e)
    }
  }
  if (payload.version >= 2 && payload.local) {
    const stamp = lastBackupDate()
    const old = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) old.push(k)
    }
    old.forEach((k) => localStorage.removeItem(k))
    for (const [k, val] of Object.entries(payload.local)) localStorage.setItem(k, val)
    if (stamp) localStorage.setItem(STAMP_KEY, stamp)
    return { reload: true, everything: true }
  }
  save(payload.state)
  return { reload: false, state: payload.state, everything: false }
}

export { getFile }
