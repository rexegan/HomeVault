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
import AllItemsView from './components/AllItemsView.jsx'
import RoomsView from './components/RoomsView.jsx'
import ScansView from './components/ScansView.jsx'
import WeatherView from './components/WeatherView.jsx'
import PoolForm from './components/PoolForm.jsx'
import CivicView from './components/CivicView.jsx'
import FinanceView from './components/FinanceView.jsx'
import { careTasks, careCounts } from './lib/maintenance.js'
import { buildSample } from './lib/sample.js'
import { INTAKE_QUESTIONS, INTAKE_TOTAL, KEY_FIELDS } from './lib/intake.js'

export default function App() {
  const [state, setState] = useState(store.load)
  // view: {name:'home'} | {name:'area', areaId} | {name:'search'} | {name:'expiring'}
  const [view, setView] = useState({ name: 'home' })
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [query, setQuery] = useState('')
  const [intake, setIntake] = useState(() => {
    const m = store.loadIntake()
    // One-time migration: 'Home builder' moved up to slot 2 in section 01.
    try {
      if (!localStorage.getItem('homevault:intake:migr1')) {
        const remap = { 'property:0:9': 'property:0:2', 'property:0:2': 'property:0:3',
          'property:0:3': 'property:0:4', 'property:0:4': 'property:0:5', 'property:0:5': 'property:0:6',
          'property:0:6': 'property:0:7', 'property:0:7': 'property:0:8', 'property:0:8': 'property:0:9' }
        const out = { ...m }
        for (const from of Object.keys(remap)) delete out[from]
        for (const [from, to] of Object.entries(remap)) if (m[from] != null) out[to] = m[from]
        localStorage.setItem('homevault:intake:migr1', '1')
        store.saveIntake(out)
        return out
      }
    } catch { /* ignore */ }
    return m
  })
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

  // 3D scans index (model blobs live in IndexedDB; this is just the list).
  const [scans, setScans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:scans:v1') || '[]') } catch { return [] }
  })
  useEffect(() => {
    try { localStorage.setItem('homevault:scans:v1', JSON.stringify(scans)) } catch { /* ignore */ }
  }, [scans])
  const addScan = (data) => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    setScans((l) => [...l, { id: store.newProId(), added: d.toISOString().slice(0, 10), ...data }])
    flash('3D scan saved')
  }
  const deleteScan = (scanId) => { setScans((l) => l.filter((s) => s.id !== scanId)); flash('Scan deleted') }

  // Weather cache (coords + last forecast).
  const [weather, setWeather] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:weather:v1') || 'null') } catch { return null }
  })
  const cacheWeather = (data) => {
    setWeather(data)
    try { localStorage.setItem('homevault:weather:v1', JSON.stringify(data)) } catch { /* ignore */ }
  }

  // County/City jurisdiction cache.
  const [civic, setCivic] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:civic:v2') || 'null') } catch { return null }
  })
  const cacheCivic = (data) => {
    setCivic(data)
    try { localStorage.setItem('homevault:civic:v2', JSON.stringify(data)) } catch { /* ignore */ }
  }

  // Insurance / taxes record.
  const [finance, setFinance] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:finance:v1') || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem('homevault:finance:v1', JSON.stringify(finance)) } catch { /* ignore */ }
  }, [finance])
  const setFinanceValue = (id, val) => setFinance((m) => ({ ...m, [id]: val }))

  // Load the complete sample home (items, profile, care history, pros).
  const loadSample = () => {
    if (state.items.length > 0 || pros.length > 0) {
      if (!confirm('Load the sample home? This replaces the items, Home Profile, Home Care history and Pros currently on this device.')) return
    }
    const sample = buildSample(today)
    let next = { ...state, items: [] }
    for (const it of sample.items) {
      const area = next.areas.find((a) => a.name.toLowerCase() === it.areaName.toLowerCase())
      if (!area) continue
      const { areaName, ...data } = it
      next = store.addItem(next, area.id, { files: [], ...data })
    }
    setState(next)
    setIntake(sample.intake)
    setCare(sample.care)
    setPros(sample.pros(store.newProId))
    setShowWelcome(false)
    flash('Sample home loaded — explore away!')
  }

  // Swimming Pool profile.
  const [pool, setPool] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homevault:pool:v1') || '{}') } catch { return {} }
  })
  useEffect(() => {
    try { localStorage.setItem('homevault:pool:v1', JSON.stringify(pool)) } catch { /* ignore */ }
  }, [pool])
  const setPoolValue = (k, val) => setPool((m) => ({ ...m, [k]: val }))

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

  const titles = { search: 'Search', expiring: 'Warranties', report: 'Inventory report', intake: 'Home Profile', care: 'Home Care', pros: 'My Pros', hardware: 'Local Hardware', referrals: 'Repair Referrals', allItems: 'Everything stored', rooms: 'Rooms & areas', scans: '3D Home Scans', weather: 'Weather at home', civic: 'County / City', finance: 'Insurance / Taxes' }

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
          </>
        )}
        {view.name === 'area' && currentArea && (
          <button className="ghost" onClick={() => setModal({ type: 'item', item: null, areaId: currentArea.id })}>
            <Icon.plus size={18} /> Add
          </button>
        )}
        {(view.name === 'search' || view.name === 'expiring' || view.name === 'report' || view.name === 'intake' || view.name === 'care' || view.name === 'pros' || view.name === 'hardware' || view.name === 'referrals' || view.name === 'allItems' || view.name === 'rooms' || view.name === 'scans' || view.name === 'weather' || view.name === 'civic' || view.name === 'finance') && (
          <div className="brand" style={{ fontSize: 18 }}>{titles[view.name]}</div>
        )}
      </header>

      <main className={'content' + (view.name === 'home' ? ' wide' : '')}>
        {view.name === 'home' && (
          <>
            {showWelcome && <WelcomeIntro onDismiss={dismissWelcome} onLoadSample={loadSample} />}

            <div className="dash">
              <button className="stat as-btn" onClick={() => setView({ name: 'allItems' })}>
                <div className="n">{state.items.length}</div>
                <div className="l">Things stored</div>
              </button>
              <button className="stat as-btn" onClick={() => setView({ name: 'rooms' })}>
                <div className="n">{state.areas.length}</div>
                <div className="l">Rooms &amp; areas</div>
              </button>
              <button className={'stat as-btn' + (dashTotals.soon ? ' alert' : '')} onClick={() => setView({ name: 'expiring' })}>
                <div className="n">{dashTotals.soon}</div>
                <div className="l">Warranties expiring soon</div>
              </button>
              <button className={'stat as-btn' + (dashTotals.expired ? ' danger' : '')} onClick={() => setView({ name: 'expiring' })}>
                <div className="n">{dashTotals.expired}</div>
                <div className="l">Warranties expired</div>
              </button>
              <button className="stat as-btn stat-tool" onClick={() => setView({ name: 'finance' })}>
                <div className="n">🛡️</div>
                <div className="l">Insurance / Taxes</div>
              </button>
              <button className="stat as-btn stat-tool" onClick={() => setView({ name: 'civic' })}>
                <div className="n">🏛️</div>
                <div className="l">County / City</div>
              </button>
              <button className="stat as-btn stat-tool" onClick={() => setView({ name: 'weather' })}>
                <div className="n">🌤️</div>
                <div className="l">Weather &amp; maintenance</div>
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

            <button className="profile-card" onClick={() => setView({ name: 'scans' })}>
              <span className="profile-icon scans-icon"><Icon.house size={22} /></span>
              <span className="profile-body">
                <strong>3D Home Scans</strong>
                <span className="profile-sub">Scan rooms with your phone and spin them in 3D, right here.</span>
              </span>
              {scans.length > 0 && <span className="pros-count-pill">{scans.length}</span>}
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
                <strong>Zillow</strong>
                <span>Your home's page — value, history and details from your address.</span>
                <span className="zillow-hint">Signed into Zillow as the owner? Tap “Public view” there to see the photos.</span>
              </div>
              <div className="backup-actions">
                <button className="btn secondary small" onClick={() => {
                  const addr = (intake[KEY_FIELDS.address] || '').trim()
                  if (!addr) { flash('Add your address in the Home Profile first'); setView({ name: 'intake' }); return }
                  // Zillow's canonical address deep-link: for an exact match it
                  // redirects server-side straight to the home's property page.
                  const slug = encodeURIComponent(addr.replace(/\s+/g, '-')).replace(/%2C/g, ',')
                  window.open('https://www.zillow.com/homes/' + slug + '_rb/', '_blank', 'noopener')
                }}>🏠 Open Zillow</button>
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
            onQuickAdd={(nm) => setModal({ type: 'item', item: null, areaId: currentArea.id, presetName: nm })}
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
          <ReportView state={state} today={today} profile={intake}
            onOpenAllItems={() => setView({ name: 'allItems' })}
            onOpenRooms={() => setView({ name: 'rooms' })}
            onOpenExpiring={() => setView({ name: 'expiring' })}
            onOpenArea={(areaId) => setView({ name: 'area', areaId })}
            onOpenItem={openItem}
          />
        )}

        {view.name === 'intake' && (
          <HomeProfile values={intake} onChange={setIntakeValue} onReset={resetIntake}
            filed={validFiled} onFile={fileFromProfile} onAddPro={(d) => addPro(d)} />
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

        {view.name === 'finance' && (
          <FinanceView values={finance} onChange={setFinanceValue} civicInfo={civic?.info} />
        )}

        {view.name === 'civic' && (
          <CivicView profile={intake} weatherCache={weather} cached={civic} onCache={cacheCivic} />
        )}

        {view.name === 'weather' && (
          <WeatherView profile={intake} cached={weather} onCache={cacheWeather} />
        )}

        {view.name === 'scans' && (
          <ScansView scans={scans} onAdd={addScan} onDelete={deleteScan} />
        )}

        {view.name === 'allItems' && (
          <AllItemsView state={state} today={today} onOpenItem={openItem} />
        )}

        {view.name === 'rooms' && (
          <RoomsView state={state} today={today}
            onOpenArea={(areaId) => setView({ name: 'area', areaId })}
            onAddArea={() => setModal({ type: 'area', area: null, zone: 'inside' })} />
        )}
      </main>

      {modal?.type === 'area' && modal.area && (modal.area.variant === 'pool' || /swimming pool/i.test(modal.area.name)) ? (
        <PoolForm
          area={modal.area}
          values={pool}
          onChange={setPoolValue}
          coords={weather?.lat ? { lat: weather.lat, lon: weather.lon } : null}
          onAddPro={(data) => addPro(data)}
          onClose={() => setModal(null)}
        />
      ) : modal?.type === 'area' && (
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
          presetName={modal.presetName}
          area={store.areaById(state, modal.areaId || modal.item?.areaId)}
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
