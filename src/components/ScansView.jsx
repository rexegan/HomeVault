import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import { Icon } from '../lib/icons.jsx'
import { saveFile, getFileURL, deleteFile } from '../lib/db.js'

// 3D Home Scans: import GLB models exported by scanning apps (Scaniverse,
// Polycam, Luma AI…) and view them as spinnable 3D models, right in the vault.
// Model files live in IndexedDB on this device like every other attachment.
export default function ScansView({ scans, onAdd, onDelete }) {
  const [viewing, setViewing] = useState(null)   // scan being viewed
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      alert('That file isn\'t a 3D model. Export your scan as a .glb file (in Scaniverse: Share → Export model → GLB).')
      return
    }
    if (file.size > 300 * 1024 * 1024) {
      alert('That model is over 300 MB — export a smaller version (most apps offer a "reduced" export).')
      return
    }
    setBusy(true)
    try {
      const stored = await saveFile(file)
      onAdd({
        fileId: stored.id,
        name: file.name.replace(/\.(glb|gltf)$/i, ''),
        size: file.size,
      })
    } catch (err) {
      console.warn('Could not store 3D scan', err)
      alert('Couldn\'t save that model — it may be too large for this browser\'s storage.')
    } finally {
      setBusy(false)
    }
  }

  const mb = (n) => (n / (1024 * 1024)).toFixed(1) + ' MB'

  return (
    <div className="scans">
      <div className="intake-lede">
        <h2>3D Home Scans</h2>
        <p>Walk your rooms or yard with a free scanning app — <b>Scaniverse</b>, <b>Polycam</b>, or
          <b> Luma AI</b> — export the model as a <b>GLB</b> file, and add it here. Your house
          becomes something you can spin, tilt and walk around, stored privately on this device.</p>
      </div>

      <button className="btn block" onClick={() => inputRef.current?.click()} disabled={busy}>
        <Icon.plus size={18} /> {busy ? 'Saving model…' : 'Add a 3D scan (.glb)'}
      </button>
      <input ref={inputRef} type="file" accept=".glb,.gltf,model/gltf-binary"
        style={{ display: 'none' }} onChange={onPick} />

      {scans.length === 0 ? (
        <div className="empty" style={{ marginTop: 16 }}>
          <div className="big">🏠</div>
          <p><strong>No scans yet.</strong></p>
          <p>Try it: scan one room with Scaniverse (free, ~5 minutes), export as GLB, and add it
            here. LiDAR iPads/iPhones give the best results, but photo mode works too.</p>
        </div>
      ) : (
        <div className="items" style={{ marginTop: 16 }}>
          {scans.map((s) => (
            <div className="scan-row" key={s.id}>
              <button className="scan-main" onClick={() => setViewing(s)}>
                <span className="scan-cube" aria-hidden="true">◇</span>
                <span className="scan-body">
                  <span className="scan-name">{s.name}</span>
                  <span className="scan-sub">{mb(s.size)} · added {fmt(s.added)}</span>
                </span>
                <span className="scan-view">View in 3D ›</span>
              </button>
              <button className="scan-delete" aria-label="Delete scan"
                onClick={async () => {
                  if (!confirm(`Delete the "${s.name}" scan?`)) return
                  try { await deleteFile(s.fileId) } catch { /* ignore */ }
                  onDelete(s.id)
                }}>
                <Icon.trash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="intake-foot" style={{ marginTop: 16 }}>
        <Icon.shield size={18} />
        <span>Models are stored only in this device's browser, like everything else in your vault.
          Big scans use real storage — delete ones you no longer need.</span>
      </div>

      {viewing && <ModelSheet scan={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

// Full-width sheet that renders the model with orbit controls.
function ModelSheet({ scan, onClose }) {
  const [url, setUrl] = useState(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true, created = null
    // Load the 3D engine only when a scan is actually opened.
    import('@google/model-viewer')
      .then(() => getFileURL(scan.fileId))
      .then((u) => {
        if (!active) { if (u) URL.revokeObjectURL(u); return }
        if (!u) { setFailed(true); return }
        created = u; setUrl(u); setReady(true)
      })
      .catch((e) => { console.warn('3D viewer failed to load', e); if (active) setFailed(true) })
    return () => { active = false; if (created) URL.revokeObjectURL(created) }
  }, [scan.fileId])

  return (
    <Sheet title={scan.name} onClose={onClose}
      footer={<button className="btn secondary" onClick={onClose} style={{ flex: 1 }}>Close</button>}>
      {failed ? (
        <div className="empty"><p><strong>Couldn't open this model.</strong></p>
          <p>Re-export it as a standard GLB and add it again.</p></div>
      ) : !ready ? (
        <div className="snap-reading">
          <div className="snap-progress"><span className="snap-spinner" aria-hidden="true" /> Loading 3D viewer…</div>
        </div>
      ) : (
        <>
          <model-viewer
            src={url}
            loading="eager"
            camera-controls=""
            auto-rotate=""
            touch-action="none"
            interaction-prompt="none"
            style={{ width: '100%', height: 'min(62vh, 560px)', background: '#eceadf', borderRadius: '14px' }}
          />
          <div className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
            Drag to spin · pinch or scroll to zoom · two-finger drag to move
          </div>
        </>
      )}
    </Sheet>
  )
}

function fmt(d) {
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt)) return d || ''
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
