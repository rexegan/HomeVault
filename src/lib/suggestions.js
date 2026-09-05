// Per-room "What is it?" quick-pick lists. Each room gets the ~30 things people
// actually store there, so adding an item is one tap instead of typing.

const POOL = [
  'Pool pump', 'Pool filter', 'Pool heater', 'Salt cell / chlorinator',
  'Robotic pool cleaner', 'Automatic pool vacuum', 'Vacuum head & hoses',
  'Telescopic pole', 'Skimmer net', 'Pool brush', 'Water test kit / strips',
  'Chlorine tablets', 'Shock / liquid chlorine', 'Muriatic acid', 'Algaecide',
  'pH increaser / decreaser', 'Stabilizer (CYA)', 'Calcium hardness increaser',
  'Pool cover', 'Solar cover & reel', 'Winterizing kit & plugs', 'Pool light',
  'Ladder / handrail', 'Diving board', 'Pool slide', 'Pool floats & loungers',
  'Pool toys & games', 'Life vests', 'Poolside furniture', 'Deck box / storage',
]

const KITCHEN = [
  'Refrigerator', 'Range / stove', 'Wall oven', 'Cooktop', 'Microwave',
  'Vent hood', 'Dishwasher', 'Garbage disposal', 'Sink & faucet',
  'Water filter (under-sink)', 'Coffee maker', 'Espresso machine', 'Toaster / toaster oven',
  'Blender', 'Stand mixer', 'Food processor', 'Air fryer', 'Instant Pot / pressure cooker',
  'Slow cooker', 'Wine fridge', 'Ice maker', 'Countertops', 'Cabinets', 'Backsplash',
  'Pantry shelving', 'Cookware set', 'Knife set', 'Small appliances (other)',
  'Kitchen table & chairs', 'Light fixtures',
]

const LAUNDRY = [
  'Washer', 'Dryer', 'Washer-dryer pedestals', 'Utility sink & faucet', 'Iron & ironing board',
  'Steamer', 'Drying rack', 'Laundry cabinets / shelving', 'Water heater (if here)',
  'Detergent & supplies', 'Vacuum cleaner', 'Carpet cleaner', 'Broom & mop supplies',
  'Folding table', 'Hampers & baskets', 'Light fixture', 'Dryer vent kit',
  'Washer hoses (braided)', 'Drain pan', 'Lint accessories',
]

const GARAGE = [
  'Water heater', 'Furnace / HVAC unit', 'Garage door opener', 'Garage door & springs',
  'EV charger', 'Extra refrigerator', 'Chest freezer', 'Workbench', 'Tool chest',
  'Air compressor', 'Generator', 'Power drill', 'Circular saw', 'Miter saw', 'Table saw',
  'Shop vac', 'Pressure washer', 'Ladder', 'Bicycles', 'Lawn chemicals & fertilizer',
  'Paint & supplies', 'Car battery charger', 'Floor jack & stands', 'Storage shelving',
  'Overhead storage racks', 'Sports equipment', 'Holiday decorations', 'Vehicle 1',
  'Vehicle 2', 'Welding equipment',
]

const BATH = [
  'Toilet', 'Vanity & sink', 'Faucet', 'Bathtub', 'Shower & glass door', 'Shower head',
  'Exhaust fan', 'Water heater (if here)', 'Mirror / medicine cabinet', 'Towel bars & hardware',
  'Light fixtures', 'Scale', 'Hair dryer', 'Electric razor / trimmer', 'Curling / flat iron',
  'Bidet seat', 'Space heater', 'Linens & towels', 'Tile & flooring', 'Plumbing shut-offs',
]

const BEDROOM = [
  'Mattress', 'Box spring / foundation', 'Bed frame / headboard', 'Adjustable base',
  'Dresser', 'Nightstands', 'Lamps', 'TV', 'TV mount', 'Ceiling fan', 'Window blinds / shades',
  'Curtains & rods', 'Closet system', 'Desk', 'Chair', 'Rug', 'Mirror', 'Air purifier',
  'Humidifier', 'Space heater', 'Safe', 'Jewelry & valuables', 'Artwork', 'Bedding sets',
  'Alarm clock / smart speaker', 'Baby furniture', 'Toys', 'Bookshelf', 'Exercise equipment',
  'Sewing machine',
]

const GREAT_ROOM = [
  'TV', 'TV mount', 'Soundbar / speakers', 'AV receiver', 'Streaming devices',
  'Game consoles', 'Sofa / sectional', 'Recliner', 'Coffee table', 'End tables',
  'Entertainment center', 'Bookshelves', 'Fireplace & insert', 'Mantel', 'Ceiling fan',
  'Light fixtures', 'Lamps', 'Rug', 'Curtains & blinds', 'Artwork & decor',
  'Smart home hub', 'Router / modem', 'Mesh Wi-Fi', 'Thermostat', 'Security panel',
  'Piano / instruments', 'Board games', 'Vacuum robot', 'Air purifier', 'Plants & planters',
]

const DINING = [
  'Dining table', 'Dining chairs', 'China cabinet / hutch', 'Buffet / sideboard',
  'Chandelier / light fixture', 'Rug', 'China & dishware', 'Silverware / flatware',
  'Glassware & stemware', 'Serving pieces', 'Table linens', 'Bar cart', 'Wine storage',
  'Artwork & mirrors', 'Curtains & blinds', 'Candlesticks & decor',
]

const STUDY = [
  'Desk', 'Office chair', 'Computer / laptop', 'Monitors', 'Printer / scanner',
  'Router / modem', 'UPS battery backup', 'External drives / NAS', 'Bookshelves',
  'Filing cabinet', 'Safe (documents)', 'Desk lamp', 'Webcam & mic', 'Keyboard & mouse',
  'Paper shredder', 'Software licenses', 'Office supplies', 'Artwork', 'Rug', 'Curtains & blinds',
]

const CLOSET = [
  'Closet system / shelving', 'Clothing (seasonal)', 'Shoes', 'Coats & jackets',
  'Luggage', 'Safe', 'Jewelry storage', 'Watches', 'Handbags', 'Ironing board',
  'Garment steamer', 'Storage bins', 'Linens & blankets', 'Guns / gun safe',
  'Important documents', 'Keepsakes & photos',
]

const FOYER = [
  'Front door & hardware', 'Storm door', 'Smart lock', 'Video doorbell', 'Coat closet contents',
  'Console table', 'Mirror', 'Light fixture / chandelier', 'Rug / runner', 'Bench',
  'Umbrella stand', 'Key organizer', 'Security keypad', 'Artwork & decor',
]

const MUDROOM = [
  'Bench & cubbies', 'Coat hooks & racks', 'Shoe storage', 'Storage cabinets',
  'Pet supplies & crate', 'Backpacks & gear', 'Boots & rain gear', 'Utility sink',
  'Rug / mat', 'Light fixture',
]

const BACKYARD = [
  'A/C condenser', 'Patio furniture', 'Grill / smoker', 'Outdoor kitchen', 'Pergola / gazebo',
  'Fire pit', 'Patio umbrella', 'Outdoor TV', 'Outdoor speakers', 'String lights',
  'Landscape lighting', 'Irrigation controller', 'Sprinkler system', 'Fence & gates',
  'Trampoline', 'Playset / swing set', 'Basketball hoop', 'Garden beds', 'Greenhouse',
  'Rain barrels', 'Outdoor security cameras', 'Solar panels', 'Hot tub / spa', 'Hammock',
  'Bird feeders', 'Flag pole', 'Trees & landscaping', 'Outdoor storage bench',
  'Propane tank', 'Well pump / equipment',
]

const SHED = [
  'Riding mower', 'Push mower', 'String trimmer', 'Leaf blower', 'Hedge trimmer',
  'Chainsaw', 'Tiller', 'Wheelbarrow', 'Garden tools', 'Shovels & rakes',
  'Fertilizer & seed', 'Gas cans', 'Extension cords', 'Hoses & sprinklers',
  'Ladder', 'Post-hole digger', 'Fencing supplies', 'Tarps', 'Workbench (shed)',
  'ATV / UTV', 'Trailer', 'Feed & animal supplies', 'Hunting / fishing gear',
  'Camping equipment', 'Holiday decorations (overflow)', 'Paint & chemicals',
  'Pool supplies (overflow)', 'Scrap lumber', 'Generator (portable)', 'Bug sprayers',
]

const GENERIC = [
  'Furniture', 'Appliance', 'Electronics', 'TV', 'Light fixture', 'Ceiling fan',
  'Window coverings', 'Flooring / rug', 'Artwork & decor', 'Storage & shelving',
  'Tools', 'Safe', 'Exercise equipment', 'Musical instrument', 'Collectibles',
  'Documents', 'Receipt', 'Warranty', 'Manual', 'Photos',
]

// Resolve a room name to its list — exact match first, then by keyword.
export function suggestionsFor(roomName) {
  const n = (roomName || '').toLowerCase()
  if (n.includes('pool')) return POOL
  if (n.includes('kitchen')) return KITCHEN
  if (n.includes('laundry')) return LAUNDRY
  if (n.includes('garage')) return GARAGE
  if (n.includes('bath')) return BATH
  if (n.includes('bed')) return BEDROOM
  if (n.includes('great') || n.includes('living') || n.includes('family')) return GREAT_ROOM
  if (n.includes('dining')) return DINING
  if (n.includes('study') || n.includes('office')) return STUDY
  if (n.includes('closet')) return CLOSET
  if (n.includes('foyer') || n.includes('entry')) return FOYER
  if (n.includes('mud')) return MUDROOM
  if (n.includes('yard') || n.includes('patio') || n.includes('outdoor')) return BACKYARD
  if (n.includes('shed') || n.includes('workshop') || n.includes('barn')) return SHED
  return GENERIC
}
