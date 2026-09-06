// A complete sample home: items in every room, a filled Home Profile, Home Care
// history, and service pros with work logs. Dates are computed relative to
// "today" so warranty statuses (active / expiring soon / expired) always look alive.

export function buildSample(today) {
  const d = (days) => {
    const t = new Date(today); t.setDate(t.getDate() + days)
    return t.toISOString().slice(0, 10)
  }

  // areaName → items. category defaults to 'appliance'.
  const items = [
    // Kitchen
    ['Kitchen', 'Refrigerator', 'Best Buy', d(-820), '$2,399', d(275), 'Samsung RF28 French door, serial 0347X'],
    ['Kitchen', 'Range / stove', 'Home Depot', d(-820), '$1,149', d(-90), 'GE gas range, model JGB735'],
    ['Kitchen', 'Dishwasher', 'Lowe\'s', d(-410), '$749', d(320), 'Bosch 300 series, quiet 44 dBA'],
    ['Kitchen', 'Microwave', 'Costco', d(-600), '$289', null, 'Over-the-range, Whirlpool'],
    ['Kitchen', 'Coffee maker', 'Amazon', d(-150), '$199', d(215), 'Breville grind & brew'],
    // Laundry
    ['Laundry Room', 'Washer', 'Lowe\'s', d(-1100), '$998', d(30), 'LG front load WM4000, 10-yr motor warranty'],
    ['Laundry Room', 'Dryer', 'Lowe\'s', d(-1100), '$948', d(30), 'LG electric DLEX4000, matches washer'],
    // Great Room
    ['Great Room', 'TV', 'Costco', d(-390), '$1,299', d(340), 'LG 77" OLED C4'],
    ['Great Room', 'Soundbar / speakers', 'Best Buy', d(-380), '$499', d(350), 'Sonos Arc'],
    ['Great Room', 'Sofa / sectional', 'Living Spaces', d(-700), '$2,150', null, 'Fabric sectional, pet-friendly weave'],
    ['Great Room', 'Router / modem', 'Amazon', d(-260), '$329', d(470), 'Eero mesh 3-pack'],
    // Dining
    ['Dining Room', 'Dining table', 'Restoration Hardware', d(-1500), '$3,200', null, 'Oak trestle, seats 8'],
    ['Dining Room', 'Chandelier / light fixture', 'Wayfair', d(-1450), '$449', null, ''],
    // Primary Bedroom
    ['Primary Bedroom', 'Mattress', 'Mattress Firm', d(-560), '$1,899', d(3090), 'King Purple hybrid, 10-yr warranty'],
    ['Primary Bedroom', 'TV', 'Walmart', d(-900), '$478', d(-535), 'TCL 55" — warranty lapsed'],
    ['Primary Bedroom', 'Ceiling fan', 'Home Depot', d(-2000), '$249', null, 'Hunter 60"'],
    // Bedroom 2
    ['Bedroom 2', 'Mattress', 'Amazon', d(-800), '$649', d(2850), 'Full, memory foam'],
    ['Bedroom 2', 'Desk', 'IKEA', d(-400), '$229', null, 'Kids homework desk'],
    // Bedroom 3
    ['Bedroom 3', 'Mattress', 'Costco', d(-750), '$599', d(2900), 'Queen, guest room'],
    ['Bedroom 3', 'Exercise equipment', 'Peloton', d(-1050), '$1,445', d(-320), 'Bike, warranty ended'],
    // Baths
    ['Primary Bath', 'Bidet seat', 'Amazon', d(-320), '$399', d(410), 'Toto washlet'],
    ['Primary Bath', 'Exhaust fan', 'Home Depot', d(-90), '$139', d(640), 'Panasonic WhisperQuiet'],
    ['Bath 2', 'Faucet', 'Lowe\'s', d(-200), '$168', d(1625), 'Moen, lifetime finish warranty'],
    // Study
    ['Study', 'Computer / laptop', 'Apple', d(-430), '$1,999', d(665), 'MacBook Pro 14", AppleCare+'],
    ['Study', 'Printer / scanner', 'Office Depot', d(-680), '$329', d(-315), 'Brother laser'],
    ['Study', 'Office chair', 'Amazon', d(-500), '$389', d(3880), 'Ergonomic, 12-yr warranty'],
    // Foyer
    ['Foyer', 'Video doorbell', 'Best Buy', d(-540), '$179', d(-175), 'Ring Pro 2'],
    ['Foyer', 'Smart lock', 'Amazon', d(-540), '$229', d(190), 'Schlage Encode'],
    // Mudroom / closets
    ['Mudroom', 'Bench & cubbies', 'Local carpenter', d(-980), '$1,400', null, 'Custom built-in'],
    ['Hall Closet', 'Vacuum cleaner', 'Costco', d(-310), '$449', d(420), 'Dyson V15'],
    ['Primary Closet', 'Safe', 'Academy', d(-1200), '$549', null, 'Fireproof document safe'],
    // Garage
    ['2-Car Garage', 'Water heater', 'Home Depot', d(-1650), '$1,249', d(540), 'Rheem 50-gal gas, 6-yr tank warranty'],
    ['2-Car Garage', 'Garage door opener', 'Lowe\'s', d(-1250), '$329', d(210), 'LiftMaster belt drive'],
    ['2-Car Garage', 'EV charger', 'Tesla', d(-420), '$475', d(310), 'Wall connector, 48A'],
    ['2-Car Garage', 'Air compressor', 'Harbor Freight', d(-880), '$189', d(-515), 'Fortress 27-gal'],
    ['2-Car Garage', 'Generator', 'Atwoods', d(-610), '$1,099', d(120), 'Westinghouse 9500 portable'],
    // Backyard
    ['Backyard', 'A/C condenser', 'Cool Breeze HVAC', d(-1050), '$5,800', d(2600), 'Trane XR16, 4-ton, 10-yr parts'],
    ['Backyard', 'Grill / smoker', 'Costco', d(-460), '$899', d(270), 'Traeger pellet grill'],
    ['Backyard', 'Patio furniture', 'At Home', d(-450), '$1,150', null, '6-piece set with cover'],
    ['Backyard', 'Irrigation controller', 'Home Depot', d(-380), '$199', d(350), 'Rachio 8-zone smart'],
    // Pool
    ['Swimming Pool', 'Pool pump', 'Leslie\'s Pool Supplies', d(-700), '$1,099', d(35), 'Pentair variable speed — warranty ends soon'],
    ['Swimming Pool', 'Robotic pool cleaner', 'Amazon', d(-340), '$899', d(390), 'Dolphin Nautilus CC'],
    ['Swimming Pool', 'Chlorine tablets', 'Leslie\'s Pool Supplies', d(-40), '$139', null, '35-lb bucket, 3" tabs', 'other'],
    ['Swimming Pool', 'Pool cover', 'In The Swim', d(-1400), '$389', d(-670), 'Winter safety cover'],
    // Shed
    ['Storage Shed', 'Riding mower', 'Tractor Supply', d(-510), '$2,499', d(585), 'John Deere S130, 42"'],
    ['Storage Shed', 'Chainsaw', 'Atwoods', d(-230), '$329', d(135), 'Stihl MS 251'],
    ['Storage Shed', 'Leaf blower', 'Home Depot', d(-820), '$179', d(-455), 'Ryobi 40V'],
    ['Storage Shed', 'Wheelbarrow', 'Tractor Supply', d(-1300), '$119', null, ''],
  ].map(([areaName, name, vendor, purchaseDate, price, warrantyExpires, notes, category]) => ({
    areaName, name, vendor, purchaseDate, price,
    warrantyExpires: warrantyExpires || '',
    notes: notes || '', category: category || 'appliance',
  }))

  const intake = {
    // 01 · Property
    'property:0:0': '1284 Wildflower Lane, Cleburne, TX 76031',
    'property:0:1': '2003', 'property:0:2': 'Ranch', 'property:0:3': '1',
    'property:0:4': '3,010', 'property:0:5': '1.5 acres', 'property:0:6': 'Slab',
    'property:0:7': 'Own', 'property:0:8': '2016-05-20', 'property:0:9': 'Bluebonnet Custom Homes',
    'property:0:10': 'No HOA', 'property:0:11': 'APN 126-0440-0021',
    // 02 · Exterior
    'exterior:0:0': 'Architectural shingle — weathered wood', 'exterior:0:1': 'Replaced 2021 by TopLine Roofing',
    'exterior:0:2': '30-yr material / 5-yr workmanship', 'exterior:0:3': 'Aluminum with leaf guards',
    'exterior:0:5': 'Vinyl soffits, ridge vents',
    'exterior:1:0': 'Brick', 'exterior:1:1': 'SW 7029 Agreeable Gray (trim SW 7006)',
    'exterior:1:2': 'Andersen 100, installed 2019, 10-yr warranty', 'exterior:1:3': 'Steel front, fiberglass back',
    'exterior:1:5': 'LiftMaster 87504, 2 remotes + keypad',
    'exterior:2:0': 'Concrete, good condition',
    // 03 · Systems
    'systems:0:0': 'Gas furnace', 'systems:0:1': 'Installed 2022, 10-yr parts',
    'systems:0:2': 'Trane XR16, 4-ton, serial 22181KL', 'systems:0:3': 'Installed 2022 with furnace',
    'systems:0:4': 'Ecobee smart, 2 zones', 'systems:0:5': '16x25x1, every 3 months',
    'systems:0:7': 'Cool Breeze HVAC — annual plan',
    'systems:1:0': 'Tank, 50-gal, gas', 'systems:1:1': 'Rheem, 2022, 6-yr tank',
    'systems:1:2': 'City water', 'systems:1:3': 'Front bed by hose bib, blue lid',
    'systems:1:4': 'PEX', 'systems:1:6': 'Septic', 'systems:1:7': 'None',
    'systems:2:0': 'Garage wall, 200A', 'systems:2:2': 'Westinghouse 9500 portable, gas',
    'systems:2:4': 'Propane, 250-gal owned tank',
    'systems:3:0': '6 smoke + 2 CO, hardwired', 'systems:3:1': 'Ring Alarm, self-monitored',
    'systems:3:2': 'Ring doorbell + 3 cams', 'systems:3:3': 'Rise Broadband, Eero mesh',
    'systems:3:5': 'Rachio 8-zone + backflow at meter',
    // 04 · Interior
    'interior:0:1': 'LVP main, carpet bedrooms', 'interior:0:2': 'SW 7015 Repose Gray throughout',
    'interior:1:0': 'Samsung RF28 — filed in Kitchen', 'interior:1:1': 'GE gas range JGB735',
    'interior:1:3': 'Bosch 300 + InSinkErator', 'interior:1:4': 'Maple cabinets, granite, subway tile',
    'interior:2:0': 'LG 77" OLED + Sonos', 'interior:2:1': 'Gas fireplace, serviced 2025',
    'interior:3:0': 'King primary, full + queen kids rooms',
    'interior:4:0': 'LG front-load set, 2023',
    'interior:5:0': 'Blown-in R-38, radiant barrier, decked storage',
    // 05 · Garage
    'garage:0:0': '2 cars, attached', 'garage:0:1': 'Workbench + Husky tool chest',
    'garage:0:4': 'Tesla wall connector, 48A', 'garage:0:5': 'F-150 & Highlander — records in glovebox',
    // 06 · Outdoors
    'outdoors:0:0': 'Covered patio 14x20, built 2018', 'outdoors:0:1': 'Traeger pellet grill',
    'outdoors:1:0': 'Gunite pool, 2018, resurfaced never', 'outdoors:1:1': 'Pentair pump/filter, heater none',
    'outdoors:1:2': 'Dolphin robot, chlorine, winter cover', 'outdoors:1:3': 'Self-maintained',
    'outdoors:2:0': 'Pipe fence perimeter, wood privacy near pool', 'outdoors:2:2': 'Shed 12x16 with loft',
    'outdoors:2:3': 'John Deere S130, Stihl trimmer & saw',
    // 08 · People
    'people:0:0': 'Farm Bureau — policy TX-8842107', 'people:0:2': 'Mike\'s Plumbing (512) 555-0100',
    'people:0:4': 'Cool Breeze HVAC — Danny', 'people:0:6': 'Clear Blue Pool Service',
    'people:0:8': 'Johnson County Pest — quarterly', 'people:0:12': 'United Coop electric, Atmos propane, Rise internet',
    // 09 · Documents
    'documents:0:0': 'Deed + survey in fire safe', 'documents:0:2': 'Farm Bureau HO-3, renews May',
    'documents:0:3': 'Inspection 2016 PDF in safe', 'documents:0:10': 'Master paint list in this profile',
  }

  const care = {
    'hvac-filter': d(-15), 'hvac-service': d(-120), 'wh-flush': d(-200),
    'smoke-co': d(-70), 'gutters': d(-210), 'dryer-vent': d(-400),
    'garage-reverse': d(-100), 'pool-filter': d(-95), 'extinguisher': d(-300),
    'generator-run': d(-100), 'septic': d(-700),
  }

  const pros = (mkId) => [
    {
      id: mkId(), trade: 'A/C & Heating (HVAC)', name: 'Cool Breeze HVAC', owner: 'Danny Tran',
      officePhone: '(817) 555-0200', cellPhone: '(817) 555-0201', email: 'danny@coolbreezehvac.com',
      website: 'coolbreezehvac.com', street: '2214 Industrial Blvd', city: 'Cleburne', state: 'TX', zip: '76033',
      license: 'TACLA-45112', referredBy: 'Neighbor (the Wilsons)', notes: 'Annual service plan, $149/visit',
      jobs: [
        { id: mkId(), date: d(-480), work: 'Installed Trane XR16 condenser and coil', notes: '$5,800 — 10-yr parts warranty registered', files: [] },
        { id: mkId(), date: d(-120), work: 'Spring tune-up, capacitor within spec', notes: 'Service plan visit', files: [] },
      ],
    },
    {
      id: mkId(), trade: 'Plumber', name: "Mike's Plumbing", owner: 'Mike Rivera',
      officePhone: '(817) 555-0100', cellPhone: '(817) 555-0101', email: 'mike@mikesplumbing.com',
      website: 'mikesplumbing.com', street: '410 W Henderson St', city: 'Cleburne', state: 'TX', zip: '76033',
      license: 'M-40233', referredBy: 'Angi', notes: 'Fast on weekends. Gate code 4417.',
      jobs: [
        { id: mkId(), date: d(-200), work: 'Flushed water heater, replaced anode rod', notes: '$240', files: [] },
        { id: mkId(), date: d(-30), work: 'Fixed slow drain in hall bath', notes: '$165', files: [] },
      ],
    },
    {
      id: mkId(), trade: 'Pool service', name: 'Clear Blue Pool Service', owner: 'Sarah Keller',
      officePhone: '(817) 555-0300', cellPhone: '', email: 'hello@clearbluepools.com',
      website: 'clearbluepools.com', street: '88 Marina Dr', city: 'Cleburne', state: 'TX', zip: '76033',
      license: '', referredBy: 'Nextdoor', notes: 'Opens/closes pool each season',
      jobs: [
        { id: mkId(), date: d(-95), work: 'Cleaned filter, balanced water, new o-rings', notes: '$180', files: [] },
      ],
    },
    {
      id: mkId(), trade: 'Landscaper / lawn care', name: 'Green Acres Lawn & Landscape', owner: 'Tom Boyd',
      officePhone: '(817) 555-0400', cellPhone: '(817) 555-0401', email: '',
      website: '', street: '', city: 'Joshua', state: 'TX', zip: '76058',
      license: '', referredBy: 'Christian home repair list at church', notes: 'Mows biweekly in season, $65',
      jobs: [
        { id: mkId(), date: d(-10), work: 'Fall cleanup, flower bed mulch', notes: '$425', files: [] },
      ],
    },
  ]

  return { items, intake, care, pros }
}
