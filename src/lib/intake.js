// The Home Profile questionnaire — the same content as the standalone intake doc,
// ported into the app. Sections 01–06 map to the physical house, 07 defines the
// fields every stored item gets, 08–09 are people & paperwork.
//
// Each question has a stable id (built from section + group + index) so checked
// state persists. Section 07 is a non-checkbox reference block (type: 'spec').

const SECTIONS = [
  {
    id: 'property', num: '01', accent: 'ink',
    title: 'The property — the big picture',
    intent: 'Establish what this home is before we go room by room.',
    groups: [
      { items: [
        "What's the full street address?",
        'What year was the home built?',
        ['Architectural style?', 'Ranch, two-story, split-level, townhome, etc.', ['Ranch', 'Two-story', 'Split-level', 'Craftsman', 'Colonial', 'Contemporary', 'Townhome', 'Farmhouse']],
        ['How many stories / levels?', null, ['1', '1.5', '2', '3']],
        'Heated square footage?',
        'Lot size / acreage?',
        ['Foundation type?', 'Slab, pier & beam, crawl space, basement', ['Slab', 'Pier & beam', 'Crawl space', 'Basement', 'Full basement']],
        ['Do you own or rent it?', null, ['Own', 'Rent']],
        'Purchase / closing date?',
        'Builder or developer name?',
        ['Is there an HOA?', 'Name and dues, if so'],
        'Parcel / APN & legal description?',
      ] },
    ],
  },
  {
    id: 'exterior', num: '02', accent: 'ink',
    title: 'Exterior envelope — roof to ground',
    intent: 'Walk the outside of the house, top to bottom, all the way around.',
    groups: [
      { label: 'Roof & top', items: [
        ['Roof material & color?', 'Asphalt shingle, metal, tile…', ['Asphalt shingle', 'Architectural shingle', 'Metal', 'Clay tile', 'Concrete tile', 'Slate', 'Flat / TPO']],
        'Roof age / last replaced, and by whom?',
        'Roof warranty (material & workmanship)?',
        'Gutters & downspouts — material, gutter guards?',
        'Chimney / flue — last swept or inspected?',
        'Soffits, fascia & roof vents?',
      ] },
      { label: 'Walls & openings', items: [
        ['Siding / wall material?', 'Brick, stucco, vinyl, fiber cement…', ['Brick', 'Stucco', 'Vinyl', 'Fiber cement (Hardie)', 'Wood', 'Stone', 'Board & batten']],
        ['Exterior paint brand & color codes?', 'Body & trim'],
        'Windows — brand, style, glass, install date, warranty?',
        'Exterior doors — front, back, side (brand/material)?',
        'Garage door(s) — brand & material?',
        'Garage door opener — brand, model, remotes/keypad?',
        'Exterior lighting & fixtures?',
        'House numbers, mailbox, flag/package box?',
      ] },
      { label: 'Ground & approach', items: [
        'Driveway — material & condition?',
        'Walkways, steps & front porch?',
        'Grading / drainage / French drains?',
      ] },
    ],
  },
  {
    id: 'systems', num: '03', accent: 'ink',
    title: 'Structure & systems — the mechanicals',
    intent: 'The working guts of the house — these carry the biggest warranties and service histories.',
    groups: [
      { label: 'Heating & cooling', items: [
        ['Heating type?', 'Furnace, heat pump, boiler — brand, model, serial, fuel', ['Gas furnace', 'Electric furnace', 'Heat pump', 'Boiler', 'Mini-split', 'Radiant'], { room: '2-Car Garage', item: 'Furnace / Heating', category: 'appliance' }],
        'Heating install date & warranty?',
        ['A/C condenser & coil — brand, model, serial, tonnage?', null, null, { room: 'Backyard', item: 'A/C Condenser', category: 'appliance' }],
        'A/C install date & warranty?',
        'Thermostat(s) — brand/model, smart?',
        'Air filter size(s) & change interval?',
        'Ductwork, zones or mini-splits?',
        'HVAC service company / maintenance plan?',
      ] },
      { label: 'Water & plumbing', items: [
        'Water heater — tank or tankless, capacity, fuel?',
        ['Water heater brand, age & warranty?', null, null, { room: '2-Car Garage', item: 'Water Heater', category: 'appliance' }],
        ['City water or well?', 'Well pump / pressure tank details', ['City water', 'Private well']],
        'Main water shut-off location?',
        ['Supply pipe material?', 'PEX, copper, CPVC…', ['PEX', 'Copper', 'CPVC', 'Galvanized', 'Polybutylene']],
        'Water softener / filter / RO — brand & service?',
        ['Sewer or septic?', 'Tank location, last pumped', ['City sewer', 'Septic']],
        'Sump pump / drainage?',
      ] },
      { label: 'Power & gas', items: [
        'Electrical panel — location & amperage?',
        'Sub-panels or main breaker location?',
        ['Generator / transfer switch — brand, fuel?', null, null, { room: '2-Car Garage', item: 'Generator', category: 'appliance' }],
        'Solar — panels, inverter, battery, installer, warranty?',
        ['Natural gas or propane?', 'Tank size, owned/leased, shut-off', ['Natural gas', 'Propane', 'None / all-electric']],
      ] },
      { label: 'Safety & smart home', items: [
        'Smoke & CO detectors — count, hardwired/battery?',
        'Security alarm & monitoring company?',
        'Cameras & video doorbell?',
        'Internet — ISP, modem/router, mesh?',
        'Smart hub, locks, lighting, sensors?',
        'Irrigation controller & backflow device?',
      ] },
    ],
  },
  {
    id: 'interior', num: '04', accent: 'ink',
    title: 'Interior — floor by floor, room by room',
    intent: 'Ask the first set once for every room, then capture the big items each room holds.',
    groups: [
      { label: 'For every room (repeat)', items: [
        'Room name & which floor is it on?',
        ['Flooring type & material?', null, ['Carpet', 'Hardwood', 'Engineered wood', 'Laminate', 'Luxury vinyl plank', 'Tile', 'Polished concrete']],
        'Wall paint brand + color code; ceiling?',
        'Light fixtures & ceiling fans?',
        'Window coverings — blinds, shades, drapes?',
        'Built-ins, closets & storage?',
      ] },
      { label: 'Kitchen', items: [
        ['Refrigerator — brand, model, serial, warranty?', null, null, { room: 'Kitchen', item: 'Refrigerator', category: 'appliance' }],
        ['Range / cooktop & wall oven?', null, null, { room: 'Kitchen', item: 'Range / Oven', category: 'appliance' }],
        ['Microwave & vent hood?', null, null, { room: 'Kitchen', item: 'Microwave', category: 'appliance' }],
        ['Dishwasher & garbage disposal?', null, null, { room: 'Kitchen', item: 'Dishwasher', category: 'appliance' }],
        'Cabinets brand, countertop & backsplash material?',
        'Sink, faucet & water filter?',
      ] },
      { label: 'Living, dining & entry', items: [
        ['TV, mount, media & sound system?', null, null, { room: 'Great Room', item: 'TV & Media', category: 'appliance' }],
        'Fireplace / insert — gas or wood, servicing?',
        'Dining furniture & lighting?',
        'Entry / foyer & coat closet?',
      ] },
      { label: 'Bedrooms & bathrooms (each)', items: [
        'Each bedroom — furniture, mattress, closet system?',
        'Primary bedroom — safe, built-ins?',
        'Each bath — toilet, vanity, sink & faucet?',
        'Tub / shower, glass, exhaust fan?',
      ] },
      { label: 'Utility & other rooms', items: [
        ['Laundry — washer & dryer (brand/model/serial/warranty)?', null, null, { room: 'Laundry Room', item: 'Washer & Dryer', category: 'appliance' }],
        'Mudroom / utility sink?',
        'Home office — desk & equipment?',
        'Bonus / media / game room?',
        'Pantry & hall closets?',
        'Stairs & hallways?',
      ] },
      { label: 'Above & below', items: [
        'Attic — access, insulation type/R-value, radiant barrier, storage?',
        'Basement — finished? mechanicals & storage?',
        'Crawl space — vapor barrier, condition?',
      ] },
    ],
  },
  {
    id: 'garage', num: '05', accent: 'ink',
    title: 'Garage & vehicles',
    intent: 'Half workshop, half storage — and often where the extra fridge lives.',
    groups: [
      { items: [
        'How many cars, attached or detached?',
        'Workbench, tool chest & power tools?',
        ['Extra fridge or freezer?', null, null, { room: '2-Car Garage', item: 'Extra Fridge / Freezer', category: 'appliance' }],
        'Wall storage, shelving, overhead racks?',
        ['EV charger — brand & circuit?', null, null, { room: '2-Car Garage', item: 'EV Charger', category: 'appliance' }],
        'Vehicles kept here — make/model/VIN & service records?',
      ] },
    ],
  },
  {
    id: 'outdoors', num: '06', accent: 'ink',
    title: 'Backyard & outdoors — front to back',
    intent: 'Everything past the walls: living space, water, land, and what maintains it.',
    groups: [
      { label: 'Living space', items: [
        'Patio / deck — material, cover or pergola, builder, age?',
        'Outdoor kitchen / grill — brand?',
        'Outdoor / low-voltage lighting?',
      ] },
      { label: 'Water features', items: [
        'Pool builder & year; resurface date?',
        ['Pool pump, filter & heater — brand, model, warranty?', null, null, { room: 'Swimming Pool', item: 'Pool Equipment', category: 'appliance' }],
        'Cleaner / robot, saltwater or chlorine, cover?',
        'Pool service company?',
        'Spa / hot tub — brand, cover, service?',
      ] },
      { label: 'Land & structures', items: [
        'Fencing & gates — material, height?',
        'Irrigation zones, trees, beds, retaining walls?',
        'Storage shed / workshop — contents?',
        'Lawn equipment — mower, trimmer, blower (brand/model)?',
        'Playset, trampoline, sport court?',
        'Well house, pump house or outbuildings?',
      ] },
    ],
  },
  {
    id: 'record', num: '07', accent: 'record', type: 'spec',
    title: 'For every item you store — capture these',
    intent: 'Whatever the room or system, each thing you save gets the same fields.',
    fields: [
      ['Name', 'What it is'],
      ['Brand / maker', 'Manufacturer'],
      ['Model #', 'From the label'],
      ['Serial #', 'For claims'],
      ['Where bought', 'Store / installer'],
      ['Purchase date', '& price paid'],
      ['Warranty length', '→ expiration date'],
      ['Receipt', 'Photo or PDF'],
      ['Warranty doc', 'Photo or PDF'],
      ['Manual', 'User guide'],
      ['Photos', 'The item itself'],
      ['Service history', 'Date · what · who'],
      ['Notes', 'Filter size, paint code, parts'],
    ],
  },
  {
    id: 'people', num: '08', accent: 'wood',
    title: 'People & service providers',
    intent: "Your home's contact list — who to call, and the accounts tied to the property.",
    groups: [
      { items: [
        'Insurance agent & policy number?',
        'Realtor & builder contacts?',
        'Plumber?',
        'Electrician?',
        'HVAC technician?',
        'Roofer?',
        'Pool service?',
        'Landscaper / lawn care?',
        'Pest control?',
        'Handyman / general contractor?',
        'Appliance repair?',
        'HOA management company?',
        'Utility accounts — electric, gas, water, trash, internet?',
      ] },
    ],
  },
  {
    id: 'documents', num: '09', accent: 'wood',
    title: 'Whole-home documents',
    intent: 'The paperwork that belongs to the house itself — not to any one room.',
    groups: [
      { items: [
        'Deed / title & property survey (plat)?',
        'Mortgage / loan documents?',
        'Homeowners insurance policy (+ flood, if any)?',
        'Home inspection report & appraisal?',
        'Closing / settlement statement?',
        'Building permits & certificates of occupancy?',
        'Builder structural warranty booklet?',
        'Property tax statements?',
        'HOA covenants (CC&Rs) & bylaws?',
        'Remodel / improvement records (for cost basis)?',
        'Master paint-color list?',
        'Emergency shut-off map — water, gas, electric?',
      ] },
    ],
  },
]

// Normalize into sections with stable question ids.
export const INTAKE = SECTIONS.map((sec) => {
  if (sec.type === 'spec') return sec
  const groups = sec.groups.map((g, gi) => ({
    label: g.label,
    items: g.items.map((it, qi) => {
      // item may be: "q" | ["q","hint"] | ["q","hint",[options]]
      // item may be: "q" | ["q","hint"] | ["q","hint",[options]] | ["q","hint",[options],{file}]
      const [q, hint, options, file] = Array.isArray(it) ? it : [it, undefined, undefined, undefined]
      return { id: `${sec.id}:${gi}:${qi}`, q, hint, options, file }
    }),
  }))
  return { ...sec, groups }
})

// Every checkbox question id, in order.
export const INTAKE_QUESTIONS = INTAKE.flatMap((sec) =>
  sec.type === 'spec' ? [] : sec.groups.flatMap((g) => g.items.map((i) => i.id))
)

export const INTAKE_TOTAL = INTAKE_QUESTIONS.length

// Stable ids for the headline property facts (section 01, first group).
export const KEY_FIELDS = {
  address: 'property:0:0',
  yearBuilt: 'property:0:1',
  style: 'property:0:2',
  stories: 'property:0:3',
  sqft: 'property:0:4',
}

// Build a home name + a short facts line from whatever the user has filled in.
export function homeFacts(profile) {
  const g = (id) => (profile && profile[id] ? String(profile[id]).trim() : '')
  const name = g(KEY_FIELDS.address)
  const facts = []
  const sqft = g(KEY_FIELDS.sqft)
  if (sqft) {
    const n = parseInt(sqft.replace(/[^0-9]/g, ''), 10)
    facts.push(isNaN(n) ? sqft : '≈ ' + n.toLocaleString() + ' sq ft')
  }
  const stories = g(KEY_FIELDS.stories)
  if (stories) facts.push(stories === '1' ? '1 story' : stories + ' stories')
  const year = g(KEY_FIELDS.yearBuilt)
  if (year) facts.push('Built ' + year)
  const style = g(KEY_FIELDS.style)
  if (style) facts.push(style)
  return { name, facts }
}
