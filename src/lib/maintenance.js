// Home Care: a maintenance schedule generated from what the house actually has.
// Core tasks apply to every home; conditional tasks switch on when the Home
// Profile (or the floor plan) says the equipment exists. "Last done" dates live
// in localStorage; each task's next due date = last done + interval.

const has = (profile, id) => !!(profile && profile[id] && String(profile[id]).trim())
const contains = (profile, id, word) =>
  has(profile, id) && String(profile[id]).toLowerCase().includes(word)
const hasArea = (state, name) =>
  state.areas.some((a) => a.name.toLowerCase() === name)

// months = interval between doings. why = one homeowner-friendly sentence.
const TASKS = [
  // Always-on core
  { id: 'hvac-filter', months: 3, room: '2-Car Garage', title: 'Replace HVAC air filter',
    why: 'A clogged filter strains the system and raises your power bill. Check the size in your Home Profile.' },
  { id: 'hvac-service', months: 12, room: '2-Car Garage', title: 'HVAC professional tune-up',
    why: 'An annual service before summer keeps the warranty valid and catches failures early.' },
  { id: 'wh-flush', months: 12, room: '2-Car Garage', title: 'Flush the water heater',
    why: 'Draining the sediment adds years to the tank and keeps water heating fast.' },
  { id: 'smoke-co', months: 6, title: 'Test smoke & CO detectors',
    why: 'Press the test button on each one and swap batteries as needed.' },
  { id: 'gutters', months: 6, room: 'Backyard', title: 'Clean gutters & downspouts',
    why: 'Clogged gutters back water up under the roof and against the foundation.' },
  { id: 'roof-check', months: 12, room: 'Backyard', title: 'Roof visual check',
    why: 'From the ground: look for lifted or missing shingles, especially after storm season.' },
  { id: 'dryer-vent', months: 12, room: 'Laundry Room', title: 'Deep-clean the dryer vent',
    why: 'Lint in the duct is a leading cause of house fires — and slow drying.' },
  { id: 'washer-clean', months: 6, room: 'Laundry Room', title: 'Clean the washing machine',
    why: 'Run a cleaning cycle and wipe the door seal to stop mildew and odors.' },
  { id: 'hood-filter', months: 3, room: 'Kitchen', title: 'Degrease the range-hood filter',
    why: 'A greasy filter stops venting and is a fire risk. Most go in the dishwasher.' },
  { id: 'fridge-coils', months: 12, room: 'Kitchen', title: 'Vacuum refrigerator coils',
    why: 'Dusty coils make the compressor work harder — the #1 cause of early failure.' },
  { id: 'garage-door', months: 12, room: '2-Car Garage', title: 'Lubricate garage door hardware',
    why: 'Silicone spray on springs, rollers and hinges keeps it quiet and extends spring life.' },
  { id: 'garage-reverse', months: 6, room: '2-Car Garage', title: 'Test garage door auto-reverse',
    why: 'Put a board under the door; it must reverse on contact. This is a child-safety check.' },
  { id: 'caulk', months: 12, room: 'Primary Bath', title: 'Check tub & shower caulk',
    why: 'Cracked caulk lets water into the walls. Re-seal any gaps you find.' },
  { id: 'exterior-faucets', months: 12, room: 'Backyard', title: 'Winterize outdoor faucets',
    why: 'Disconnect hoses and cover spigots before the first freeze.' },
  { id: 'extinguisher', months: 12, room: 'Kitchen', title: 'Check fire extinguisher',
    why: 'Confirm the gauge is in the green and everyone knows where it is.' },
  { id: 'pest', months: 12, title: 'Termite / pest inspection',
    why: 'An annual look — professional or your own walk-around — catches problems while they are small.' },

  // Conditional on the Home Profile / floor plan
  { id: 'pool-filter', months: 6, room: 'Swimming Pool', title: 'Clean pool filter',
    why: 'A dirty filter makes the pump fight for flow.',
    when: (p, s) => hasArea(s, 'swimming pool') },
  { id: 'pool-equipment', months: 12, room: 'Swimming Pool', title: 'Pool equipment check-up',
    why: 'Inspect the pump, seals and heater before swim season.',
    when: (p, s) => hasArea(s, 'swimming pool') },
  { id: 'septic', months: 36, title: 'Pump the septic tank',
    why: 'Every 3–5 years keeps the drain field alive — the repair you never want to buy.',
    when: (p) => contains(p, 'systems:1:6', 'septic') },
  { id: 'softener-salt', months: 3, room: '2-Car Garage', title: 'Top up water-softener salt',
    why: 'Keep the brine tank at least half full.',
    when: (p) => has(p, 'systems:1:5') },
  { id: 'well-test', months: 12, title: 'Test well water',
    why: 'An annual bacteria and nitrate test is cheap peace of mind for well households.',
    when: (p) => contains(p, 'systems:1:2', 'well') },
  { id: 'generator-run', months: 3, room: '2-Car Garage', title: 'Exercise the generator',
    why: 'Run it under load for 20 minutes so it starts when you actually need it.',
    when: (p) => has(p, 'systems:2:2') },
  { id: 'solar-check', months: 12, room: 'Backyard', title: 'Solar panel check & clean',
    why: 'Dust and leaves cost real output; check the inverter for error lights.',
    when: (p) => has(p, 'systems:2:3') },
  { id: 'irrigation', months: 6, room: 'Backyard', title: 'Walk the sprinkler zones',
    why: 'Run each zone and fix tilted or clogged heads before the summer bills arrive.',
    when: (p) => has(p, 'systems:3:5') },
  { id: 'chimney', months: 12, room: 'Great Room', title: 'Chimney sweep & inspection',
    why: 'Creosote buildup is a fire hazard; sweep before the first cold snap.',
    when: (p) => has(p, 'exterior:0:4') || has(p, 'interior:2:1') },
]

// Tasks that apply to this home, with status computed from the lastDone map.
// Status: 'due' (never done or past due), 'soon' (within 30 days), 'ok'.
export function careTasks(profile, state, lastDone, today) {
  return TASKS
    .filter((t) => !t.when || t.when(profile, state))
    .map((t) => {
      const doneISO = lastDone[t.id]
      let status = 'due', nextDue = null, days = null
      if (doneISO) {
        const d = new Date(doneISO + 'T00:00:00')
        nextDue = new Date(d)
        nextDue.setMonth(nextDue.getMonth() + t.months)
        days = Math.round((nextDue - today) / 86400000)
        status = days < 0 ? 'due' : days <= 30 ? 'soon' : 'ok'
      }
      return { ...t, lastDone: doneISO || null, nextDue, days, status, neverDone: !doneISO }
    })
    .sort((a, b) => (a.days ?? -9999) - (b.days ?? -9999))
}

export function careCounts(tasks) {
  let due = 0, soon = 0
  for (const t of tasks) {
    if (t.status === 'due') due++
    else if (t.status === 'soon') soon++
  }
  return { due, soon }
}

export function intervalLabel(months) {
  if (months < 12) return `every ${months} months`
  if (months === 12) return 'once a year'
  return `every ${Math.round(months / 12)} years`
}
