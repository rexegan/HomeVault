// Backup & restore: bundle the whole vault — item metadata AND the uploaded
// file blobs — into a single portable JSON file, and restore it on any device.

import { getFile, saveFileWithId } from './db.js'
import { save } from './storage.js'

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

// Build the backup object (state + every referenced file, base64-encoded).
export async function buildBackup(state) {
  const files = []
  const seen = new Set()
  for (const item of state.items) {
    for (const f of item.files || []) {
      if (seen.has(f.id)) continue
      seen.add(f.id)
      const rec = await getFile(f.id)
      if (rec?.blob) {
        files.push({ id: f.id, name: f.name, type: f.type, dataUrl: await blobToDataURL(rec.blob) })
      }
    }
  }
  return { app: 'homevault', version: 1, exportedAt: new Date().toISOString(), state, files }
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
  return payload.files.length
}

// Read a backup file, restore its blobs to IndexedDB and its state to storage.
// Returns the restored state so the app can swap it in.
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
  save(payload.state)
  return payload.state
}
