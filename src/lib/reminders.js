// Calendar reminders: every date HomeVault knows about, as an .ics file you can
// add to Apple Calendar / Google Calendar. Each event has a stable id, so adding
// the file again later updates the events instead of duplicating them.

import { careTasks } from './maintenance.js'
import { buildForecast } from './forecast.js'

const parseMDY = (s) => {
  const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? new Date(+m[3], +m[1] - 1, +m[2]) : null
}
const parseISO = (s) => {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}
const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

// → [{ uid, date, title, desc, kind, alarms:[daysBefore...] }] sorted by date
export function buildReminders({ state, intake, care, lawn, finance, finishes, today }) {
  const out = []
  const t0 = day(today)
  const room = (id) => state.areas.find((a) => a.id === id)?.name || ''
  const push = (e) => { if (e.date && day(e.date) >= t0) out.push({ ...e, date: day(e.date) }) }

  for (const it of state.items || []) {
    push({ uid: 'hv-warranty-' + it.id, kind: 'Warranty', date: parseISO(it.warrantyExpires),
      title: 'Warranty ends: ' + it.name + (room(it.areaId) ? ' (' + room(it.areaId) + ')' : ''),
      desc: [it.vendor && 'Bought at ' + it.vendor, it.price && 'Paid ' + it.price,
        'Make any warranty claim before this date.'].filter(Boolean).join('\n'),
      alarms: [30, 7] })
  }

  const tasks = careTasks(intake || {}, state, care || {}, t0)
  let overdue = 0
  for (const t of tasks) {
    if (t.nextDue && t.days >= 0) {
      push({ uid: 'hv-care-' + t.id + '-' + t.nextDue.toISOString().slice(0, 10), kind: 'Home Care', date: t.nextDue,
        title: 'Home Care: ' + t.title, desc: t.why, alarms: [3] })
    } else overdue++
  }
  if (overdue > 0) {
    const d = new Date(t0); d.setDate(d.getDate() + 3)
    push({ uid: 'hv-care-catchup', kind: 'Home Care', date: d,
      title: 'Home Care catch-up: ' + overdue + ' task' + (overdue === 1 ? ' is' : 's are') + ' due',
      desc: tasks.filter((t) => !t.nextDue || t.days < 0).map((t) => '• ' + t.title).join('\n'), alarms: [0] })
  }

  for (const e of lawn?.entries || []) {
    push({ uid: 'hv-lawn-' + e.id, kind: 'Lawn', date: parseMDY(e.nextDue),
      title: 'Yard: ' + e.kind + (e.where ? ' — ' + e.where : ''),
      desc: [e.product, e.brand && 'Brand: ' + e.brand, e.notes].filter(Boolean).join('\n'), alarms: [3] })
  }

  const ren = parseMDY(finance?.['ins.renewal'])
  if (ren) push({ uid: 'hv-ins-renewal-' + ren.getFullYear(), kind: 'Insurance', date: ren,
    title: 'Homeowners insurance renews' + (finance['ins.company'] ? ' — ' + finance['ins.company'] : ''),
    desc: 'Shop quotes a month ahead and ask about discounts.', alarms: [30, 7] })
  const tax = parseMDY(finance?.['tax.dueDate'])
  if (tax) push({ uid: 'hv-tax-' + tax.getFullYear(), kind: 'Taxes', date: tax,
    title: 'Property taxes due', desc: finance['tax.annualTax'] ? 'Annual tax about ' + finance['tax.annualTax'] : '', alarms: [30, 7] })

  // Things reaching the end of their typical life in the next 3 years.
  const { rows } = buildForecast({ state, finishes, today: t0 })
  const horizon = new Date(t0); horizon.setFullYear(horizon.getFullYear() + 3)
  for (const r of rows) {
    if (r.replaceOn >= t0 && r.replaceOn <= horizon) {
      push({ uid: 'hv-replace-' + r.id, kind: 'Replacement', date: r.replaceOn,
        title: 'Plan to replace: ' + r.name + (r.room ? ' (' + r.room + ')' : ''),
        desc: 'Reaches its typical ' + r.life + '-year life about now' +
          (r.estCost ? '. Budget about $' + r.estCost.toLocaleString() : '') + '.', alarms: [60] })
    }
  }

  return out.sort((a, b) => a.date - b.date)
}

// ── .ics writer ──────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
function fold(line) {
  const parts = []
  let rest = line
  while (rest.length > 74) { parts.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74) }
  parts.push(rest)
  return parts.join('\r\n')
}

export function buildICS(events, now = new Date()) {
  const stamp = ymd(now) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + '00Z'
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HomeVault//Reminders//EN', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', 'X-WR-CALNAME:HomeVault']
  for (const e of events) {
    const end = new Date(e.date); end.setDate(end.getDate() + 1)
    L.push('BEGIN:VEVENT', 'UID:' + e.uid + '@homevault', 'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + ymd(e.date), 'DTEND;VALUE=DATE:' + ymd(end),
      'SUMMARY:' + esc('🏠 ' + e.title))
    if (e.desc) L.push('DESCRIPTION:' + esc(e.desc))
    L.push('TRANSP:TRANSPARENT')
    for (const n of e.alarms || []) {
      // 9:00 AM, n days before (the all-day event starts at midnight).
      const trig = n === 0 ? 'PT9H' : '-P' + (n - 1) + 'DT15H'
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(e.title), 'TRIGGER:' + trig, 'END:VALARM')
    }
    L.push('END:VEVENT')
  }
  L.push('END:VCALENDAR')
  return L.map(fold).join('\r\n') + '\r\n'
}

export function downloadICS(events) {
  const blob = new Blob([buildICS(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'HomeVault-reminders.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
