import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './lib/icons.jsx'
import * as store from './lib/storage.js'
import { warrantyStatus } from './lib/storage.js'
import { exportBackup, importBackup } from './lib/backup.js'
import FloorPlan from './components/FloorPlan.jsx'
import AreaView from './components/AreaView.jsx'
import AreaForm from './components/AreaForm.jsx'
import ItemForm from './components/ItemForm.jsx'
import ItemDetail from './components/ItemDetail.jsx'
import SearchView from './components/SearchView.jsx'
import ExpiringView from './components/ExpiringView.jsx'
import ReportView from './components/ReportView.jsx'
import HomeProfile from './components/HomeProfile.jsx'
import WelcomeIntro from './components/WelcomeIntro.jsx'
import SnapCapture from './components/SnapCapture.jsx'
import HomeCare from './components/HomeCare.jsx'
import ProsView from './components/ProsView.jsx'
import HardwareView from './components/HardwareView.jsx'
import ReferralsView from './components/ReferralsView.jsx'
import { careTasks, careCounts } from './lib/maintenance.js'
import { INTAKE_QUESTIONS, INTAKE_TOTAL } from './lib/intake.js'

export default function App() {
  const [state, setState] = useState(store.load)
  // view: {name:'home'} | {name:'area', areaId} | {name:'search'} | {name:'expiring'}
  const [view, setView] = useState({ name: 'home' })
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [query, setQuery] = useState('')
  const [intake, setIntake] = useState(store.loadIntake)
  // The welcome intro greets you on every open; the X only hides it for this session.
  const [showWelcome, setShowWelcome] = useState(true)
  const importRef = useRef(null)

  const dismissWelcome = () => setShowWelcome(false)

  // "Today" at midnight — stable for the session, used for warranty math.
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  // Persist on every change.
  useEffect(() => { store.save(state) }, [state])
  useEffect(() => { store.saveIntake(intake) }, [intake])

  const setIntakeValue = (id, value) => setIntake((m) => {
    const next = { ...m }
    if (!value || !value.trim()) delete next[id]
    else next[id] = value
    return next
  })

  // Which Home Profile answers have been filed into a room's vault: {questionId: itemId}
  const [filed, setFiled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:filed') || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem('homevault:filed', JSON.stringify(filed)) } catch { /* ignore */ }
  }, [filed])

  // Create a real vault item in the mapped room from a filled-in profile answer.
  const fileFromProfile = (questionId, mapping, value) => {
    const area = state.areas.find((a) => a.name.toLowerCase() === mapping.room.toLowerCase())
    if (!area) { flash(`Add a "${mapping.room}" room first`); return }
    const next = store.addItem(state, area.id, { name: mapping.item, category: mapping.category, notes: value })
    const created = next.items[next.items.length - 1]
    setState(next)
    setFiled((f) => ({ ...f, [questionId]: created.id }))
    flash(`Filed in ${area.name}`)
  }

  // Home Care: last-done dates per maintenance task.
  const [care, setCare] = useState(store.loadCare)
  useEffect(() => { store.saveCare(care) }, [care])
  const markCareDone = (taskId) => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    const iso = d.toISOString().slice(0, 10)
    setCare((m) => ({ ...m, [taskId]: iso }))
    flash('Nice — logged for today')
  }
  const undoCare = (taskId) => setCare((m) => {
    const next = { ...m }; delete next[taskId]; return next
  })
  const careDue = careCounts(careTasks(intake, state, care, today)).due

  // My Pros: the home's service contacts.
  const [pros, setPros] = useState(() => store.loadPros().map((p) => ({
    officePhone: '', cellPhone: p.phone || '', email: '', website: '', owner: '',
    street: '', city: '', state: '', zip: '', license: '', referredBy: '',
    jobs: [], ...p,
  })))
  useEffect(() => { store.savePros(pros) }, [pros])
  const addPro = (data) => { setPros((l) => [...l, { id: store.newProId(), ...data }]); flash('Added') }
  const updatePro = (proId, data) => { setPros((l) => l.map((p) => (p.id === proId ? { ...p, ...data } : p))); flash('Saved') }
  const deletePro = (proId) => { setPros((l) => l.filter((p) => p.id !== proId)); flash('Deleted') }

  // Local Hardware: cached nearby-store results.
  const [hardware, setHardware] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:hardware:v3') || 'null') } catch { return null }
  })
  const cacheHardware = (data) => {
    setHardware(data)
    try { localStorage.setItem('homevault:hardware:v3', JSON.stringify(data)) } catch { /* ignore */ }
  }

  // Snap & File: create the scanned item in its room and confirm.
  const saveSnap = (areaId, data) => {
    setState((s) => store.addItem(s, areaId, data))
    const area = store.areaById(state, areaId)
    flash(area ? `Filed in ${area.name}` : 'Filed')
    setModal(null)
  }

  // Filings whose vault item still exists (so a deleted item lets you re-file).
  const validFiled = {}
  for (const qid in filed) {
    if (state.items.some((it) => it.id === filed[qid])) validFiled[qid] = true
  }
  const resetIntake = () => {
    if (!confirm('Clear all Home Profile answers? This cannot be undone.')) return
    setIntake({})
    flash('Home Profile cleared')
  }
  const intakeDone = INTAKE_QUESTIONS.filter((id) => intake[id] && String(intake[id]).trim() !== '').length

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 1800) }

  const currentArea = view.name === 'area' ? store.areaById(state, view.areaId) : null
  // If the open area was deleted, fall back home.
  useEffect(() => {
    if (view.name === 'area' && !currentArea) setView({ name: 'home' })
  }, [view, currentArea])

  // Warranty counts for the dashboard strip and topbar badge.
  const dashTotals = useMemo(() => {
    let soon = 0, expired = 0
    for (const it of state.items) {
      const w = warrantyStatus(it, today)
      if (w?.state === 'soon') soon++
      else if (w?.state === 'expired') expired++
    }
    return { soon, expired }
  }, [state, today])
  const attention = dashTotals.soon + dashTotals.expired

  // ---- Area actions ----
  const saveArea = (data) => {
    if (modal.area) {
      setState((s) => store.updateArea(s, modal.area.id, data))
      flash('Area updated')
    } else {
      setState((s) => store.addArea(s, data))
      flash('Area added')
    }
    setModal(null)
  }
  const removeArea = () => {
    const a = modal.area
    if (!confirm(`Delete "${a.name}" and everything stored in it? This can't be undone.`)) return
    setState((s) => store.deleteArea(s, a.id))
    setModal(null)
    setView({ name: 'home' })
    flash('Area deleted')
  }

  // ---- Item actions ----
  const saveItem = (data) => {
    if (modal.item) {
      setState((s) => store.updateItem(s, modal.item.id, data))
      flash('Saved')
    } else {
      setState((s) => store.addItem(s, modal.areaId, data))
      flash('Added')
    }
    setModal(null)
  }
  const removeItem = () => {
    if (!confirm('Delete this item?')) return
    setState((s) => store.deleteItem(s, modal.item.id))
    setModal(null)
    flash('Deleted')
  }

  // ---- Backup ----
  const doExport = async () => {
    try {
      const n = await exportBackup(state)
      flash(`Backup saved (${n} file${n === 1 ? '' : 's'})`)
    } catch (e) {
      console.warn(e); alert('Sorry, the backup could not be created.')
    }
  }
  const onImportPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!confirm('Restoring a backup will replace everything currently in HomeVault. Continue?')) return
    try {
      const restored = await importBackup(file)
      setState(restored)
      setView({ name: 'home' })
      flash('Backup restored')
    } catch (err) {
      console.warn(err)
      alert(err.message || 'That file could not be restored.')
    }
  }

  // Re-read a possibly-updated item for the detail modal.
  const liveItem = (id) => state.items.find((it) => it.id === id) || null
  const openItem = (id) => setModal({ type: 'itemDetail', itemId: id })

  const titles = { search: 'Search', expiring: 'Warranties', report: 'Inventory report', intake: 'Home Profile', care: 'Home Care', pros: 'My Pros', hardware: 'Local Hardware', referrals: 'Repair Referrals' }

  return (
    <div className="app">
      <header className="topbar">
        {view.name === 'home' ? (
          <div className="brand"><Icon.house size={24} /> HomeVault</div>
        ) : (
          <button className="back-btn" onClick={() => setView({ name: 'home' })}>
            <Icon.back size={22} /> {view.name === 'area' && currentArea ? 'Home' : 'Home'}
          </button>
        )}
        <div className="spacer" />

        {view.name === 'home' && (
          <>
            <button className="ghost" onClick={() => setModal({ type: 'snap' })} aria-label="Snap and file a receipt">
              <Icon.camera size={18} /> Snap
            </button>
            <button className="icon-btn" onClick={() => { setQuery(''); setView({ name: 'search' }) }} aria-label="Search">
              <Icon.search size={20} />
            </button>
            <button className="icon-btn" onClick={() => setView({ name: 'expiring' })} aria-label="Warranties">
              <Icon.clock size={20} />
              {attention > 0 && <span className="dot-badge">{attention}</span>}
            </button>
            <button className="ghost" onClick={() => setModal({ type: 'area', area: null, zone: 'inside' })}>
              <Icon.plus size={18} /> Add area
            </button>
          </>
        )}
        {view.name === 'area' && currentArea && (
          <button className="ghost" onClick={() => setModal({ type: 'item', item: null, areaId: currentArea.id })}>
            <Icon.plus size={18} /> Add
          </button>
        )}
        {(view.name === 'search' || view.name === 'expiring' || view.name === 'report' || view.name === 'intake' || view.name === 'care' || view.name === 'pros' || view.name === 'hardware' || view.name === 'referrals') && (
          <div className="brand" style={{ fontSize: 18 }}>{titles[view.name]}</div>
        )}
      </header>

      <main className={'content' + (view.name === 'home' ? ' wide' : '')}>
        {view.name === 'home' && (
          <>
            {showWelcome && <WelcomeIntro onDismiss={dismissWelcome} />}

            <div className="dash">
              <div className="stat">
                <div className="n">{state.items.length}</div>
                <div className="l">Things stored</div>
              </div>
              <div className="stat">
                <div className="n">{state.areas.length}</div>
                <div className="l">Rooms &amp; areas</div>
              </div>
              <button className={'stat as-btn' + (dashTotals.soon ? ' alert' : '')} onClick={() => setView({ name: 'expiring' })}>
                <div className="n">{dashTotals.soon}</div>
                <div className="l">Warranties expiring soon</div>
              </button>
              <button className={'stat as-btn' + (dashTotals.expired ? ' danger' : '')} onClick={() => setView({ name: 'expiring' })}>
                <div className="n">{dashTotals.expired}</div>
                <div className="l">Warranties expired</div>
              </button>
            </div>

            <div className="home-grid">
              <div className="home-center">
                <FloorPlan
                  state={state}
                  today={today}
                  profile={intake}
                  onOpenArea={(areaId) => setView({ name: 'area', areaId })}
                  onAddArea={(zone) => setModal({ type: 'area', area: null, zone })}
                  onOpenProfile={() => setView({ name: 'intake' })}
                />
              </div>

              <aside className="home-rail rail-left">
            <button className="profile-card" onClick={() => setView({ name: 'care' })}>
              <span className="profile-icon care-icon"><Icon.clock size={22} /></span>
              <span className="profile-body">
                <strong>Home Care</strong>
                <span className="profile-sub">Your house's own maintenance schedule — what to do and when.</span>
              </span>
              {careDue > 0 && <span className="care-due-pill">{careDue} due</span>}
              <span className="profile-chev"><Icon.chevron size={20} /></span>
            </button>

            <button className="profile-card" onClick={() => setView({ name: 'pros' })}>
              <span className="profile-icon pros-icon"><Icon.tools size={22} /></span>
              <span className="profile-body">
                <strong>My Pros</strong>
                <span className="profile-sub">Plumber, electrician, A/C, appliance repair — your home's call list.</span>
              </span>
              {pros.length > 0 && <span className="pros-count-pill">{pros.length}</span>}
              <span className="profile-chev"><Icon.chevron size={20} /></span>
            </button>

            <button className="profile-card" onClick={() => setView({ name: 'hardware' })}>
              <span className="profile-icon hw-icon"><Icon.storefront size={22} /></span>
              <span className="profile-body">
                <strong>Local Hardware</strong>
                <span className="profile-sub">The closest hardware stores to your address, with directions.</span>
              </span>
              <span className="profile-chev"><Icon.chevron size={20} /></span>
            </button>

            <button className="profile-card" onClick={() => setView({ name: 'referrals' })}>
              <span className="profile-icon refs-icon"><Icon.referral size={22} /></span>
              <span className="profile-body">
                <strong>Repair Referrals</strong>
                <span className="profile-sub">Angi, Christian home repair, Thumbtack — trusted ways to find help.</span>
              </span>
              <span className="profile-chev"><Icon.chevron size={20} /></span>
            </button>
              </aside>

              <aside className="home-rail rail-right">
            <button className="profile-card" onClick={() => setView({ name: 'intake' })}>
              <span className="profile-icon"><Icon.book size={22} /></span>
              <span className="profile-body">
                <strong>Home Profile</strong>
                <span className="profile-sub">Capture everything about your home — exterior, systems, every room, and documents.</span>
                <span className="profile-meter">
                  <span className="pm-bar"><span className="pm-fill" style={{ width: (INTAKE_TOTAL ? (intakeDone / INTAKE_TOTAL * 100) : 0) + '%' }} /></span>
                  <span className="pm-n">{intakeDone} / {INTAKE_TOTAL}</span>
                </span>
              </span>
              <span className="profile-chev"><Icon.chevron size={20} /></span>
            </button>

            <div className="backup-bar">
              <div className="backup-text">
                <strong>Home inventory report</strong>
                <span>A printable summary of everything, for insurance or your records.</span>
              </div>
              <div className="backup-actions">
                <button className="btn secondary small" onClick={() => setView({ name: 'report' })}><Icon.file size={16} /> View report</button>
              </div>
            </div>
            <div className="backup-bar">
              <div className="backup-text">
                <strong>Backup &amp; restore</strong>
                <span>Save everything to a file, or move it to another device.</span>
              </div>
              <div className="backup-actions">
                <button className="btn secondary small" onClick={doExport}><Icon.box size={16} /> Export</button>
                <button className="btn secondary small" onClick={() => importRef.current?.click()}><Icon.file size={16} /> Import</button>
              </div>
              <input ref={importRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportPick} />
            </div>
              </aside>
            </div>
          </>
        )}

        {view.name === 'area' && currentArea && (
          <AreaView
            state={state}
            area={currentArea}
            today={today}
            onEditArea={() => setModal({ type: 'area', area: currentArea, zone: currentArea.zone })}
            onAddItem={() => setModal({ type: 'item', item: null, areaId: currentArea.id })}
            onOpenItem={openItem}
          />
        )}

        {view.name === 'search' && (
          <SearchView state={state} today={today} query={query} setQuery={setQuery} onOpenItem={openItem} />
        )}

        {view.name === 'expiring' && (
          <ExpiringView state={state} today={today} onOpenItem={openItem} />
        )}

        {view.name === 'report' && (
          <ReportView state={state} today={today} profile={intake} />
        )}

        {view.name === 'intake' && (
          <HomeProfile values={intake} onChange={setIntakeValue} onReset={resetIntake}
            filed={validFiled} onFile={fileFromProfile} />
        )}

        {view.name === 'care' && (
          <HomeCare profile={intake} state={state} lastDone={care} today={today}
            onMarkDone={markCareDone} onUndo={undoCare} />
        )}

        {view.name === 'pros' && (
          <ProsView pros={pros} onAdd={addPro} onUpdate={updatePro} onDelete={deletePro} />
        )}

        {view.name === 'hardware' && (
          <HardwareView profile={intake} cached={hardware} onCache={cacheHardware} />
        )}

        {view.name === 'referrals' && (
          <ReferralsView profile={intake} />
        )}
      </main>

      {modal?.type === 'area' && (
        <AreaForm
          area={modal.area}
          defaultZone={modal.zone}
          onSave={saveArea}
          onDelete={removeArea}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'item' && (
        <ItemForm
          item={modal.item}
          onSave={saveItem}
          onDelete={removeItem}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'itemDetail' && liveItem(modal.itemId) && (
        <ItemDetail
          item={liveItem(modal.itemId)}
          today={today}
          onEdit={() => setModal({ type: 'item', item: liveItem(modal.itemId) })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'snap' && (
        <SnapCapture areas={state.areas} onSave={saveSnap} onClose={() => setModal(null)} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
