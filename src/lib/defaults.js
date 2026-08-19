// The starter house that appears the first time HomeVault is opened:
// a 3-bedroom / 2-bath home with a 2-car garage, backyard, pool and shed —
// matching a typical family home. Everything here is fully editable by the user.

export const ZONES = [
  { id: 'inside', label: 'Inside the house', icon: 'house' },
  { id: 'garage', label: 'Garage', icon: 'garage' },
  { id: 'outside', label: 'Backyard & outdoors', icon: 'tree' },
]

// The starter house matches the to-scale sample floor plan (see Blueprint.jsx):
// a ~3,000 sq ft single-story 3-bed / 2-bath with a 2-car garage, plus the yard,
// pool and shed. Every name here maps to a position on the blueprint by name.
export function defaultAreas() {
  const mk = (name, icon, zone, extra = {}) => ({ name, icon, zone, ...extra })
  return [
    // Inside
    mk('Foyer', 'door', 'inside'),
    mk('Great Room', 'sofa', 'inside'),
    mk('Kitchen', 'kitchen', 'inside'),
    mk('Dining Room', 'dining', 'inside'),
    mk('Primary Bedroom', 'bed', 'inside'),
    mk('Bedroom 2', 'bed', 'inside'),
    mk('Bedroom 3', 'bed', 'inside'),
    mk('Primary Bath', 'bath', 'inside'),
    mk('Bath 2', 'bath', 'inside'),
    mk('Primary Closet', 'closet', 'inside'),
    mk('Laundry Room', 'laundry', 'inside'),
    mk('Mudroom', 'box', 'inside'),
    mk('Hall Closet', 'box', 'inside'),
    mk('Study', 'office', 'inside'),
    // Garage
    mk('2-Car Garage', 'garage', 'garage', { variant: 'garage' }),
    // Outdoors
    mk('Backyard', 'yard', 'outside', { variant: 'outdoor' }),
    mk('Swimming Pool', 'pool', 'outside', { variant: 'pool' }),
    mk('Storage Shed', 'shed', 'outside', { variant: 'shed' }),
  ]
}

export const CATEGORIES = [
  { id: 'warranty', label: 'Warranty' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'manual', label: 'Manual' },
  { id: 'appliance', label: 'Appliance / Item' },
  { id: 'document', label: 'Document' },
  { id: 'photo', label: 'Photo' },
  { id: 'other', label: 'Other' },
]
