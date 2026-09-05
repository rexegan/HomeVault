// Small inline SVG icon set — no external dependencies.
// Each icon inherits `currentColor` so CSS controls the color.

const S = ({ children, size = 24, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
    strokeLinejoin="round" {...p}>{children}</svg>
)

export const Icon = {
  house: (p) => <S {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9h14v-9" /><path d="M9.5 19v-5h5v5" /></S>,
  bed: (p) => <S {...p}><path d="M3 18v-6h13a4 4 0 0 1 4 4v2" /><path d="M3 18v2M20 18v2" /><path d="M3 12V8h6v4" /></S>,
  sofa: (p) => <S {...p}><path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" /><path d="M3 12a2 2 0 0 1 2 2v3h14v-3a2 2 0 0 1 2-2" /><path d="M5 17v2M19 17v2" /></S>,
  kitchen: (p) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 3v6M4 9h16" /><path d="M8 13v0M8 16v0" /></S>,
  dining: (p) => <S {...p}><path d="M7 3v18" /><path d="M5 3v4a2 2 0 0 0 4 0V3" /><path d="M17 21v-8c1.4 0 2.4-2 2.4-5S18.4 3 17 3" /></S>,
  door: (p) => <S {...p}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 3v18" /><circle cx="15.5" cy="12" r="0.9" /></S>,
  closet: (p) => <S {...p}><path d="M10.5 7a1.9 1.9 0 1 1 2.4 1.85L20.5 15H3.5l7.6-6.15" /><path d="M3.5 15v3h17v-3" /></S>,
  bath: (p) => <S {...p}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2" /><path d="M9 6h2" /><path d="M7 19l-1 2M18 19l1 2" /></S>,
  office: (p) => <S {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></S>,
  laundry: (p) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M8 6h.01M11 6h.01" /></S>,
  garage: (p) => <S {...p}><path d="M3 10 12 5l9 5v10H3z" /><path d="M6 20v-6h12v6" /><path d="M6 16h12" /></S>,
  car: (p) => <S {...p}><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13" /><path d="M4 13h16v4H4z" /><circle cx="7.5" cy="17.5" r="1.3" /><circle cx="16.5" cy="17.5" r="1.3" /></S>,
  pool: (p) => <S {...p}><path d="M3 18c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" /><path d="M3 14c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" /><path d="M8 11V6a2 2 0 0 1 4 0v0" /><path d="M8 8h4" /></S>,
  shed: (p) => <S {...p}><path d="M4 10 12 4l8 6" /><path d="M6 10v10h12V10" /><rect x="10" y="13" width="4" height="7" /></S>,
  tree: (p) => <S {...p}><path d="M12 3a5 5 0 0 1 4 8 4 4 0 0 1-1 6H9a4 4 0 0 1-1-6 5 5 0 0 1 4-8Z" /><path d="M12 17v4" /></S>,
  yard: (p) => <S {...p}><path d="M3 20h18" /><path d="M4 20a3 3 0 0 1 6 0" /><path d="M9 20a3.6 3.6 0 0 1 7.2 0" /><path d="M15 20a3 3 0 0 1 5.5 0" /></S>,
  attic: (p) => <S {...p}><path d="M12 3 3 12h4v8h10v-8h4z" /><path d="M10 20v-5h4v5" /></S>,
  tools: (p) => <S {...p}><path d="M14 7a3 3 0 0 0 4 4l3 3-3 3-3-3a3 3 0 0 0-4-4z" transform="rotate(0 0 0)" /><path d="m6 6 4 4M4 4l3 3" /><path d="m14 14-9 9" /></S>,
  fence: (p) => <S {...p}><path d="M5 21V8l2-2 2 2v13M15 21V8l2-2 2 2v13" /><path d="M3 12h18M3 16h18" /></S>,
  // content / ui
  receipt: (p) => <S {...p}><path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 21z" /><path d="M9 8h6M9 12h6M9 16h3" /></S>,
  shield: (p) => <S {...p}><path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6z" /><path d="m9.5 12 1.8 1.8L15 10" /></S>,
  book: (p) => <S {...p}><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2z" /><path d="M18 20H7a2 2 0 0 0-2 2" /><path d="M9 8h6" /></S>,
  box: (p) => <S {...p}><path d="m3 8 9-5 9 5v8l-9 5-9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></S>,
  photo: (p) => <S {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m4 18 5-5 4 4 3-3 4 4" /></S>,
  file: (p) => <S {...p}><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" /><path d="M13 3v6h6" /></S>,
  plus: (p) => <S {...p}><path d="M12 5v14M5 12h14" /></S>,
  chevron: (p) => <S {...p}><path d="m9 6 6 6-6 6" /></S>,
  back: (p) => <S {...p}><path d="m15 6-6 6 6 6" /></S>,
  edit: (p) => <S {...p}><path d="M4 20h4L18 10l-4-4L4 16z" /><path d="m13 7 4 4" /></S>,
  trash: (p) => <S {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></S>,
  search: (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>,
  info: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></S>,
  camera: (p) => <S {...p}><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></S>,
  storefront: (p) => <S {...p}><path d="M4 10 5.2 4h13.6L20 10" /><path d="M4 10c0 1.4 1.1 2.5 2.5 2.5S9 11.4 9 10c0 1.4 1.1 2.5 2.5 2.5S14 11.4 14 10c0 1.4 1.1 2.5 2.5 2.5S20 11.4 20 10" /><path d="M5 12.5V20h14v-7.5" /><path d="M9 20v-4.5h6V20" /></S>,
  clock: (p) => <S {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></S>,
  tag: (p) => <S {...p}><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.2" /></S>,
}

export const AREA_ICONS = [
  'house', 'bed', 'sofa', 'kitchen', 'dining', 'bath', 'office', 'door', 'closet', 'laundry',
  'garage', 'car', 'pool', 'shed', 'tree', 'yard', 'attic', 'tools', 'fence', 'box',
]

export const CAT_ICONS = {
  receipt: 'receipt',
  warranty: 'shield',
  manual: 'book',
  appliance: 'box',
  document: 'file',
  photo: 'photo',
  other: 'tag',
}
