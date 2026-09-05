import { Icon } from '../lib/icons.jsx'
import { itemsForArea, warrantyStatus } from '../lib/storage.js'
import { homeFacts } from '../lib/intake.js'

// A to-scale architectural blueprint of the default home (see docs/sample-floor-plan).
// Rooms are matched to saved areas by name and are tappable to open what's stored
// inside. Coordinates are in FEET; the house footprint is 74' x 48' with the
// backyard drawn behind it. Front of the home is the bottom edge.
const FT = 12          // pixels per foot
const OX = 74, OY = 44 // drawing origin (px)
const HX0 = 0, HX1 = 74, HY0 = 24, HY1 = 72   // house footprint, feet

const X = (f) => OX + f * FT
const Y = (f) => OY + f * FT

// name (lower-case) -> { x, y, w, h, kind?, vert? } in feet
const PLAN = {
  // Backyard band (behind the house) with pool & shed on top
  'backyard':        { x: 0,  y: 0,  w: 74, h: 22, kind: 'yard' },
  'swimming pool':   { x: 8,  y: 4,  w: 30, h: 14, kind: 'pool' },
  'storage shed':    { x: 54, y: 4,  w: 16, h: 14, kind: 'shed' },
  // Left wing
  'bedroom 2':       { x: 0,  y: 24, w: 13, h: 13 },
  'bedroom 3':       { x: 0,  y: 37, w: 13, h: 13 },
  'bath 2':          { x: 13, y: 24, w: 13, h: 11 },
  'laundry room':    { x: 13, y: 35, w: 13, h: 7 },
  'hall closet':     { x: 13, y: 42, w: 13, h: 8 },
  '2-car garage':    { x: 0,  y: 50, w: 22, h: 22, kind: 'garage' },
  'mudroom':         { x: 22, y: 50, w: 4,  h: 22, vert: true },
  // Center
  'dining room':     { x: 26, y: 24, w: 26, h: 13 },
  'kitchen':         { x: 26, y: 37, w: 26, h: 14 },
  'great room':      { x: 26, y: 51, w: 26, h: 21 },
  // Right wing (primary suite + entry)
  'primary bedroom': { x: 52, y: 24, w: 22, h: 17 },
  'primary bath':    { x: 52, y: 41, w: 12, h: 12 },
  'primary closet':  { x: 64, y: 41, w: 10, h: 12 },
  'foyer':           { x: 52, y: 53, w: 11, h: 19 },
  'study':           { x: 63, y: 53, w: 11, h: 19 },
}

// Front-wall openings (feet along y = HY1): [start, end]
const FRONT_DOORS = [[2, 20], [53, 56]]  // garage overhead door, front entry

export default function Blueprint({ state, today, profile, onOpenArea, onAddArea }) {
  const placed = []
  const unplaced = []
  for (const area of state.areas) {
    const plan = PLAN[area.name.trim().toLowerCase()]
    if (plan) placed.push({ area, plan })
    else unplaced.push(area)
  }
  // Paint order: yard behind, then pool/shed, then interior rooms on top.
  const order = { yard: 0, pool: 1, shed: 1 }
  placed.sort((a, b) => (order[a.plan.kind] ?? 2) - (order[b.plan.kind] ?? 2))

  const interior = placed.filter((p) => !p.plan.kind || p.plan.kind === 'garage')

  const totalW = X(HX1) + 60
  const totalH = Y(HY1) + 78

  const { name, facts } = homeFacts(profile)

  return (
    <div className="blueprint-wrap">
      <div className="bp-titleblock">
        <div className="bp-tb-main">
          <div className="bp-tb-eyebrow">HomeVault &middot; Floor Plan</div>
          <div className="bp-tb-name">{name || 'Your Home'}</div>
          <div className="bp-tb-facts">{facts.length > 0 ? facts.join('  ·  ') : 'Tap a room to open it'}</div>
        </div>
        <div className="bp-tb-tag">
          <span>TO<br />SCALE</span>
        </div>
      </div>

      <svg className="blueprint" viewBox={`0 0 ${totalW} ${totalH}`} role="group" aria-label="House floor plan, to scale">
        {/* Room boxes (yard/pool/shed first, then interior) */}
        {placed.map(({ area, plan }) => (
          <Room key={area.id} area={area} plan={plan}
            items={itemsForArea(state, area.id)} today={today} onOpen={() => onOpenArea(area.id)} />
        ))}

        {/* Fixtures, furniture, doors & outlets drawn inside each interior room */}
        {placed.map(({ area, plan }) => (
          <RoomFixtures key={area.id + '-fx'} area={area} plan={plan} />
        ))}

        {/* Room labels on top of everything, with a paper halo for legibility */}
        {placed.map(({ area, plan }) => (
          <RoomLabel key={area.id + '-lb'} area={area} plan={plan}
            items={itemsForArea(state, area.id)} today={today} />
        ))}

        {/* Exterior windows on the house footprint */}
        {interior.flatMap(({ area, plan }) => windowsFor(plan).map((w, i) => (
          <g key={area.id + '-w' + i}>
            <line className="bp-win-bg" x1={X(w.x1)} y1={Y(w.y1)} x2={X(w.x2)} y2={Y(w.y2)} />
            <line className="bp-win" x1={X(w.x1)} y1={Y(w.y1)} x2={X(w.x2)} y2={Y(w.y2)} />
          </g>
        )))}

        {/* House outer wall */}
        <rect className="bp-outer" x={X(HX0)} y={Y(HY0)} width={(HX1 - HX0) * FT} height={(HY1 - HY0) * FT} />

        {/* Garage overhead door (dashed, just inside the front wall) */}
        <line className="bp-gdoor" x1={X(2)} y1={Y(HY1) - 3} x2={X(20)} y2={Y(HY1) - 3} />

        {/* Front entry door with swing (foyer) */}
        <line className="bp-door-open" x1={X(53)} y1={Y(HY1)} x2={X(56)} y2={Y(HY1)} />
        <path className="bp-door" d={`M ${X(53)} ${Y(HY1)} L ${X(53)} ${Y(HY1) - 3 * FT}`} />
        <path className="bp-door" d={`M ${X(56)} ${Y(HY1)} A ${3 * FT} ${3 * FT} 0 0 1 ${X(53)} ${Y(HY1) - 3 * FT}`} />

        {/* Overall dimensions */}
        <Dim x1={X(HX0)} y1={Y(HY0) - 18} x2={X(HX1)} y2={Y(HY0) - 18} label="74'-0&quot;" horizontal />
        <Dim x1={X(HX0) - 20} y1={Y(HY0)} x2={X(HX0) - 20} y2={Y(HY1)} label="48'-0&quot;" />

        {/* Front-of-home marker + north arrow + scale bar */}
        <text className="bp-front" x={X(38)} y={Y(HY1) + 28} textAnchor="middle" fontSize="10">FRONT OF HOME</text>
        <North cx={X(HX1) + 30} cy={Y(HY0) + 6} />
        <ScaleBar x={X(HX0)} y={Y(HY1) + 44} />
      </svg>

      {unplaced.length > 0 && (
        <div className="bp-extra">
          <div className="bp-extra-label">More areas</div>
          <div className="bp-chips">
            {unplaced.map((area) => {
              const AreaIcon = Icon[area.icon] || Icon.box
              const n = itemsForArea(state, area.id).length
              return (
                <button key={area.id} className="bp-chip" onClick={() => onOpenArea(area.id)}>
                  <AreaIcon size={16} /> {area.name}
                  <span className="bp-chip-n">{n}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button className="bp-add" onClick={() => onAddArea('inside')}>
        <Icon.plus size={18} /> Add a room or area
      </button>
    </div>
  )
}

// Just the tappable room box. Labels & fixtures are drawn in separate layers on top.
function Room({ area, plan, onOpen }) {
  const { x, y, w, h, kind } = plan
  const rx = kind === 'pool' ? 12 : 3
  const cls = 'bp-room' + (kind ? ' ' + kind : '')
  return (
    <g className={cls} onClick={onOpen} role="button" aria-label={area.name} tabIndex={0}>
      <rect x={X(x)} y={Y(y)} width={w * FT} height={h * FT} rx={rx} />
    </g>
  )
}

function BadgeAt({ x, y, badge }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="11" className={'bp-badge' + (badge.danger ? ' danger' : '')} />
      <text className="bp-badge-t" textAnchor="middle" y="4">{badge.n}</text>
    </g>
  )
}

// Room name / count / dims / warranty badge, on a paper halo so it stays readable
// over the furniture. Non-interactive (clicks pass through to the room box).
function RoomLabel({ area, plan, items, today }) {
  const { x, y, w, h, kind, vert } = plan
  const cx = X(x + w / 2), cy = Y(y + h / 2)
  const wpx = w * FT, hpx = h * FT
  const small = wpx < 66 || hpx < 52
  const countText = items.length === 0 ? 'empty' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`

  let soon = 0, expired = 0
  for (const it of items) {
    const st = warrantyStatus(it, today)
    if (st?.state === 'soon') soon++
    if (st?.state === 'expired') expired++
  }
  const badge = expired ? { n: expired, danger: true } : soon ? { n: soon, danger: false } : null

  if (vert) {
    return (
      <g className="bp-label">
        <text className="bp-name" x={cx} y={cy} textAnchor="middle" fontSize="8.5"
          transform={`rotate(-90 ${cx} ${cy})`}>{area.name.toUpperCase()}</text>
      </g>
    )
  }

  if (kind === 'yard') {
    const lx = X(x) + 12, ly = Y(y) + 20
    return (
      <g className="bp-label">
        <rect className="bp-label-bg" x={lx - 6} y={ly - 13} width={area.name.length * 7.4 + 12} height={34} rx={5} />
        <text className="bp-name" x={lx} y={ly} textAnchor="start" fontSize="12">{area.name}</text>
        <text className="bp-count" x={lx} y={ly + 16} textAnchor="start" fontSize="11">{countText}</text>
        {badge && <BadgeAt x={X(x + w) - 15} y={Y(y) + 15} badge={badge} />}
      </g>
    )
  }

  const nameSize = small ? 9.5 : 12.5
  const showDims = !small && wpx >= 150 && hpx >= 120
  const lw = Math.max(area.name.length * nameSize * 0.6, 34)
  const lh = showDims ? 38 : (small ? 24 : 28)
  return (
    <g className="bp-label">
      <rect className="bp-label-bg" x={cx - lw / 2} y={cy - (small ? 13 : (showDims ? 21 : 15))} width={lw} height={lh} rx={5} />
      <text className="bp-name" x={cx} y={cy - (small ? 4 : (showDims ? 11 : 5))} textAnchor="middle" fontSize={nameSize}>{area.name}</text>
      <text className="bp-count" x={cx} y={cy + (small ? 8 : (showDims ? 4 : 11))} textAnchor="middle" fontSize={small ? 9 : 11}>{countText}</text>
      {showDims && (
        <text className="bp-dims" x={cx} y={cy + 20} textAnchor="middle" fontSize="9.5">{w}&#39; &#215; {h}&#39;</text>
      )}
      {badge && <BadgeAt x={X(x + w) - 15} y={Y(y) + 15} badge={badge} />}
    </g>
  )
}

// Furniture, fixtures, closets, interior doors and outlets drawn inside each room.
// All non-interactive so taps fall through to the room box beneath.
function RoomFixtures({ area, plan }) {
  if (plan.kind && plan.kind !== 'garage') return null
  const { x, y, w, h } = plan
  const els = []
  const k = () => area.id + '-f' + els.length
  const R = (a, b, c, d, cls) => els.push(<rect key={k()} className={cls || 'bp-fx'} x={X(a)} y={Y(b)} width={c * FT} height={d * FT} />)
  const Rr = (a, b, c, d, r, cls) => els.push(<rect key={k()} className={cls || 'bp-fx'} x={X(a)} y={Y(b)} width={c * FT} height={d * FT} rx={r * FT} />)
  const Ln = (a, b, c, d) => els.push(<line key={k()} className="bp-fx" x1={X(a)} y1={Y(b)} x2={X(c)} y2={Y(d)} />)
  const Ci = (a, b, r, cls) => els.push(<circle key={k()} className={cls || 'bp-fx'} cx={X(a)} cy={Y(b)} r={r * FT} />)
  const El = (a, b, rx, ry) => els.push(<ellipse key={k()} className="bp-fx" cx={X(a)} cy={Y(b)} rx={rx * FT} ry={ry * FT} />)
  const Tx = (a, b, t) => els.push(<text key={k()} className="bp-appliance" x={X(a)} y={Y(b)} textAnchor="middle">{t}</text>)

  // Interior door: hinge at (hx,hy); leaf length `size` ft; swings from angle a0→a1
  // (degrees, screen coords: 0=right, 90=down, 180=left, 270=up).
  const door = (hx, hy, size, a0, a1) => {
    const r = size * FT, rad = (d) => d * Math.PI / 180
    const x0 = X(hx) + Math.cos(rad(a0)) * r, y0 = Y(hy) + Math.sin(rad(a0)) * r
    const x1 = X(hx) + Math.cos(rad(a1)) * r, y1 = Y(hy) + Math.sin(rad(a1)) * r
    const sweep = (((a1 - a0) % 360) + 360) % 360 > 180 ? 0 : 1
    els.push(<line key={k()} className="bp-door-open" x1={X(hx)} y1={Y(hy)} x2={x0} y2={y0} />)
    els.push(<line key={k()} className="bp-door" x1={X(hx)} y1={Y(hy)} x2={x1} y2={y1} />)
    els.push(<path key={k()} className="bp-door" d={`M ${x0} ${y0} A ${r} ${r} 0 0 ${sweep} ${x1} ${y1}`} />)
  }
  const outlet = (a, b) => { Ci(a, b, 0.3, 'bp-outlet'); Ln(a - 0.42, b, a + 0.42, b) }

  // --- fixture builders (feet) ---
  const bed = (bx, by, bw, bh, head) => {
    Rr(bx, by, bw, bh, 0.4, 'bp-fx-soft')
    if (head === 'top') { R(bx + 0.4, by + 0.4, bw / 2 - 0.7, 1.1); R(bx + bw / 2 + 0.3, by + 0.4, bw / 2 - 0.7, 1.1); Ln(bx, by + bh * 0.42, bx + bw, by + bh * 0.42) }
    else { R(bx + 0.4, by + bh - 1.5, bw / 2 - 0.7, 1.1); R(bx + bw / 2 + 0.3, by + bh - 1.5, bw / 2 - 0.7, 1.1); Ln(bx, by + bh * 0.58, bx + bw, by + bh * 0.58) }
  }
  const closet = (cx0, cy0, cw, ch) => {
    R(cx0, cy0, cw, ch, 'bp-fx-soft')
    if (cw >= ch) Ln(cx0 + 0.3, cy0 + ch / 2, cx0 + cw - 0.3, cy0 + ch / 2)
    else Ln(cx0 + cw / 2, cy0 + 0.3, cx0 + cw / 2, cy0 + ch - 0.3)
  }
  const toilet = (tx, ty) => { R(tx, ty, 1.7, 0.7, 'bp-fx-soft'); El(tx + 0.85, ty + 1.45, 0.75, 0.95) }
  const vanity = (vx, vy, vw) => { R(vx, vy, vw, 1.8, 'bp-fx-soft'); El(vx + vw / 2, vy + 0.9, 0.55, 0.42) }
  const tub = (tx, ty, tw, th) => { R(tx, ty, tw, th, 'bp-fx-soft'); Rr(tx + 0.4, ty + 0.4, tw - 0.8, th - 0.8, 0.4); Ci(tx + Math.min(tw, th) / 2, ty + 0.9, 0.18) }
  const shower = (sx, sy, s) => { R(sx, sy, s, s, 'bp-fx-soft'); Ln(sx, sy, sx + s, sy + s); Ln(sx + s, sy, sx, sy + s); Ci(sx + s / 2, sy + s / 2, 0.16) }
  const range = (rx, ry) => { R(rx, ry, 2.5, 2.5, 'bp-fx-soft'); Ci(rx + 0.75, ry + 0.75, 0.32); Ci(rx + 1.75, ry + 0.75, 0.32); Ci(rx + 0.75, ry + 1.75, 0.32); Ci(rx + 1.75, ry + 1.75, 0.32) }
  const fridge = (fx, fy) => { R(fx, fy, 3, 2.8, 'bp-fx-soft'); Ln(fx, fy + 1, fx + 3, fy + 1); Tx(fx + 1.5, fy + 2.2, 'REF') }
  const ksink = (sx, sy) => { R(sx, sy, 3, 1.7, 'bp-fx-soft'); Rr(sx + 0.25, sy + 0.3, 1.15, 1.1, 0.2); Rr(sx + 1.6, sy + 0.3, 1.15, 1.1, 0.2) }
  const washerDryer = (wx, wy) => { R(wx, wy, 2.6, 2.6, 'bp-fx-soft'); Ci(wx + 1.3, wy + 1.3, 0.85); R(wx + 2.9, wy, 2.6, 2.6, 'bp-fx-soft'); Ci(wx + 4.2, wy + 1.3, 0.85); Tx(wx + 1.3, wy + 3.6, 'W'); Tx(wx + 4.2, wy + 3.6, 'D') }
  const sofa = (sx, sy, sw, sh) => { Rr(sx, sy, sw, sh, 0.4, 'bp-fx-soft'); R(sx, sy + sh - 0.8, sw, 0.8); R(sx, sy, 0.8, sh); R(sx + sw - 0.8, sy, 0.8, sh) }
  const table = (tx, ty, tw, th) => {
    Rr(tx, ty, tw, th, 0.3, 'bp-fx-soft')
    const n = Math.max(1, Math.floor(tw / 2.4))
    for (let i = 0; i < n; i++) { const c = tx + (tw / n) * (i + 0.5) - 0.6; R(c, ty - 1.1, 1.2, 0.9); R(c, ty + th + 0.2, 1.2, 0.9) }
  }
  const car = (cx0, cy0) => { Rr(cx0, cy0, 6.4, 14.5, 1, 'bp-fx-soft'); Ln(cx0 + 0.7, cy0 + 3, cx0 + 5.7, cy0 + 3); Rr(cx0 + 1, cy0 + 3.4, 4.4, 3.6, 0.5) }
  const desk = (dx, dy, dw) => { R(dx, dy, dw, 2.2, 'bp-fx-soft'); Ci(dx + dw / 2, dy + 3.3, 0.65) }
  const rod = (a, b, c, d) => Ln(a, b, c, d)

  switch (area.name.toLowerCase()) {
    case 'bedroom 2':
      bed(x + 4, y + 0.6, 5, 6.7, 'top'); closet(x + 0.5, y + h - 2.2, 5, 1.8)
      door(x + w, y + h - 2.4, 2.6, 270, 180); outlet(x + 0.15, y + 3); outlet(x + 0.15, y + 9); break
    case 'bedroom 3':
      bed(x + 4, y + 0.6, 5, 6.7, 'top'); closet(x + 0.5, y + h - 2.2, 5, 1.8)
      door(x + w, y + 2.4, 2.6, 90, 180); outlet(x + 0.15, y + 4); outlet(x + 0.15, y + 10); break
    case 'bath 2':
      tub(x + 0.6, y + 0.5, 5, 2.6); toilet(x + 8.5, y + 0.4)
      vanity(x + 0.6, y + h - 2.2, 5); shower(x + w - 3.4, y + h - 3.4, 2.8)
      door(x + 6.6, y + h, 2.4, 0, 270); break
    case 'laundry room':
      washerDryer(x + 0.7, y + 0.6); Tx(x + w - 2.5, y + 3.6, 'SINK'); R(x + w - 3, y + 0.6, 2, 1.8, 'bp-fx-soft')
      door(x + 1.5, y + h, 2.2, 0, 270); break
    case 'hall closet':
      R(x + 0.5, y + 0.6, w - 1, 1.6, 'bp-fx-soft'); rod(x + 0.7, y + 2.6, x + w - 0.7, y + 2.6)
      Tx(x + w / 2, y + h - 1, 'LINEN'); break
    case '2-car garage':
      car(x + 2, y + 5.5); car(x + 12.5, y + 5.5)
      door(x + w, y + 2.3, 2.6, 90, 180); outlet(x + 0.15, y + 3); break
    case 'mudroom':
      R(x + 0.6, y + 1, w - 1.2, 1.4, 'bp-fx-soft'); Ci(x + w / 2 - 0.8, y + 3.2, 0.25); Ci(x + w / 2 + 0.8, y + 3.2, 0.25); break
    case 'dining room':
      table(x + w / 2 - 5, y + h / 2 - 2.5, 10, 5)
      els.push(<line key={k()} className="bp-door-open" x1={X(x + w / 2 - 5)} y1={Y(y + h)} x2={X(x + w / 2 + 5)} y2={Y(y + h)} />)
      break
    case 'kitchen':
      R(x, y, w, 2, 'bp-fx-soft'); R(x, y, 2, h - 3, 'bp-fx-soft')
      ksink(x + 9, y + 0.15); range(x + 15, y + 0.15); fridge(x + w - 3.2, y + 0.2)
      Rr(x + w / 2 - 4, y + h / 2 - 1, 8, 3, 0.3, 'bp-fx-soft'); Tx(x + w / 2, y + h / 2 + 0.9, 'ISLAND')
      els.push(<line key={k()} className="bp-door-open" x1={X(x + w / 2 - 5)} y1={Y(y + h)} x2={X(x + w / 2 + 5)} y2={Y(y + h)} />)
      break
    case 'great room':
      sofa(x + 3, y + h - 5, 10, 3.2); R(x + w / 2 - 3, y + 0.4, 6, 0.7, 'bp-fx-soft'); Tx(x + w / 2, y + 1.9, 'TV')
      door(x, y + 3.5, 2.6, 90, 0); outlet(x + w - 0.15, y + 10); break
    case 'primary bedroom':
      bed(x + w / 2 - 3.2, y + 0.6, 6.4, 6.7, 'top')
      R(x + w / 2 - 5.2, y + 0.6, 1.6, 1.6, 'bp-fx-soft'); R(x + w / 2 + 3.6, y + 0.6, 1.6, 1.6, 'bp-fx-soft')
      door(x, y + 9, 2.6, 270, 0); outlet(x + w - 0.15, y + 4); outlet(x + 4, y + 0.15); break
    case 'primary bath':
      tub(x + 0.5, y + 0.5, 5, 2.6); shower(x + w - 3.4, y + 0.5, 2.8)
      toilet(x + 0.5, y + h - 2.2); vanity(x + 4, y + h - 2, 7)
      door(x + 6, y, 2.4, 0, 90); break
    case 'primary closet':
      rod(x + w - 0.7, y + 0.7, x + w - 0.7, y + h - 0.7)
      rod(x + 1.4, y + 0.7, x + w - 0.7, y + 0.7); Tx(x + w / 2, y + h / 2 + 3, 'SHELVES')
      door(x, y + h - 4.4, 2.2, 90, 0); break
    case 'foyer':
      closet(x + 0.5, y + 0.6, 3.2, 2)
      door(x, y + 4, 2.4, 90, 0); break
    case 'study':
      desk(x + 1, y + 0.6, 5); R(x + w - 1.4, y + 1, 1, h - 6, 'bp-fx-soft')
      door(x, y + 6, 2.2, 90, 0); outlet(x + w - 0.15, y + h - 4); break
    default: break
  }

  return <g className="bp-fixtures">{els}</g>
}

// Windows for a room's edges that lie on the house footprint boundary.
function windowsFor(plan) {
  const { x, y, w, h, kind } = plan
  if (kind === 'garage') return []
  const out = []
  const overDoor = (a, b) => FRONT_DOORS.some(([s, e]) => a < e && b > s)
  const add = (x1, y1, x2, y2) => out.push({ x1, y1, x2, y2 })
  const win = (len) => Math.min(4, len * 0.5)
  // back wall
  if (y === HY0 && w >= 8) { const l = win(w), c = x + w / 2; add(c - l / 2, HY0, c + l / 2, HY0) }
  // front wall
  if (y + h === HY1 && w >= 8) { const l = win(w), c = x + w / 2; if (!overDoor(c - l / 2, c + l / 2)) add(c - l / 2, HY1, c + l / 2, HY1) }
  // left wall
  if (x === HX0 && h >= 8) { const l = win(h), c = y + h / 2; add(HX0, c - l / 2, HX0, c + l / 2) }
  // right wall
  if (x + w === HX1 && h >= 8) { const l = win(h), c = y + h / 2; add(HX1, c - l / 2, HX1, c + l / 2) }
  return out
}

function Dim({ x1, y1, x2, y2, label, horizontal }) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
  return (
    <g>
      <line className="bp-dim" x1={x1} y1={y1} x2={x2} y2={y2} />
      {horizontal ? (
        <>
          <line className="bp-dim" x1={x1} y1={y1 - 4} x2={x1} y2={y1 + 4} />
          <line className="bp-dim" x1={x2} y1={y2 - 4} x2={x2} y2={y2 + 4} />
          <text className="bp-dimtext" x={mx} y={my - 5} textAnchor="middle" fontSize="10.5">{label}</text>
        </>
      ) : (
        <>
          <line className="bp-dim" x1={x1 - 4} y1={y1} x2={x1 + 4} y2={y1} />
          <line className="bp-dim" x1={x2 - 4} y1={y2} x2={x2 + 4} y2={y2} />
          <text className="bp-dimtext" x={mx} y={my} textAnchor="middle" fontSize="10.5"
            transform={`rotate(-90 ${mx} ${my})`}>{label}</text>
        </>
      )}
    </g>
  )
}

function North({ cx, cy }) {
  return (
    <g>
      <circle className="bp-north" cx={cx} cy={cy} r="14" />
      <path className="bp-north-fill" d={`M ${cx} ${cy - 10} L ${cx - 4} ${cy + 3} L ${cx} ${cy - 1} L ${cx + 4} ${cy + 3} Z`} />
      <text className="bp-dimtext" x={cx} y={cy + 24} textAnchor="middle" fontSize="9.5" fontWeight="700">N</text>
    </g>
  )
}

function ScaleBar({ x, y }) {
  const seg = 5 * FT
  return (
    <g>
      <text className="bp-dimtext" x={x} y={y - 7} fontSize="9.5">SCALE (FEET)</text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} className={'bp-scalebar' + (i % 2 ? ' empty' : '')}
          x={x + i * seg} y={y} width={seg} height="6" strokeWidth="1" />
      ))}
      {[0, 5, 10, 15, 20].map((ft, i) => (
        <text key={ft} className="bp-dimtext" x={x + i * seg} y={y + 17} textAnchor="middle" fontSize="9">{ft}</text>
      ))}
    </g>
  )
}
