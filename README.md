# HomeVault — your home, organized

HomeVault is a visual home-inventory app. Instead of digging through folders, you
see your **house** — its rooms, garage, backyard, pool and shed — and tap a space
to store the warranties, receipts, manuals and photos that belong there.

It's a standalone project (React + Vite), unrelated to any other app on this machine.

## What it does

- **Your house on the opening screen** — a tap-friendly layout grouped into
  *Inside the house*, *Garage*, and *Backyard & outdoors*. It starts as a
  3-bed / 2-bath home with a 2-car garage, backyard, swimming pool and storage shed.
- **Add your own areas** — game room, front porch, attic, workshop… pick a name,
  a zone, and an icon.
- **Store anything in a room** — warranties, receipts, manuals, appliances,
  documents or photos, each with store/brand, purchase date, price and notes.
- **Attach photos & PDFs** — snap a receipt or attach a warranty PDF. Files are
  kept on your device (in the browser, via IndexedDB); nothing is uploaded.
- **Warranty reminders** — enter a warranty expiration date and HomeVault flags it
  on the home screen when it's within 45 days, or once it's expired.
- **House-wide search** — the search icon finds anything by name, store, brand,
  note or room, from one box.
- **Warranties screen** — the clock icon (or tapping a warranty stat card) lists
  every warranty grouped as *Expired* / *Expiring within 45 days* / *Still covered*,
  most urgent first.
- **Backup & restore** — export everything (item details **and** attached files) to
  a single `.json` file, and import it back on this or another device.
- **Works great on iPad** — large touch targets, no zoom-on-focus, responsive layout.

Everything is saved automatically on your device — no account, no server.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## How it's built

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Top-level state, navigation, and modals |
| `src/components/FloorPlan.jsx` | Home screen — the house and its zones |
| `src/components/AreaView.jsx` | A single room and the items stored in it |
| `src/components/ItemForm.jsx` | Add/edit an item, including file uploads |
| `src/components/ItemDetail.jsx` | Read-only item view with tappable attachments |
| `src/components/AreaForm.jsx` | Add/edit a room or area |
| `src/components/SearchView.jsx` | House-wide search across all items |
| `src/components/ExpiringView.jsx` | Warranties grouped by urgency |
| `src/components/ItemResult.jsx` | Item row that also shows its room |
| `src/lib/storage.js` | Data model + `localStorage` persistence |
| `src/lib/db.js` | Uploaded file blobs, stored in IndexedDB |
| `src/lib/backup.js` | Export/import the whole vault as one JSON file |
| `src/lib/defaults.js` | The starter house and category list |
| `src/lib/icons.jsx` | Inline SVG icon set (no icon dependencies) |

### Data model

- **Areas** — `{ id, name, icon, zone, variant? }`
- **Items** — `{ id, areaId, name, category, vendor, purchaseDate,
  warrantyExpires, price, notes, files: [{ id, name, type, size }] }`

Item metadata lives in `localStorage`; the actual file contents live in IndexedDB,
referenced by id. To clear everything, clear the site's browser storage.

## Ideas for later

- Cloud backup / sync so devices stay in step automatically
- Real push reminders before a warranty lapses (needs a backend)
- A printable/exportable home inventory report (for insurance)
- Drag-to-arrange rooms into a true floor-plan layout
