import { Fragment } from 'react'

// The names of the cards on the opening page are always printed bold and dark
// wherever they're mentioned in a sentence, so they read as "things you can tap".
const NAMES = ['My Pros', 'Home Care', 'Local Hardware', 'Repair Referrals', 'Calendar Reminders', 'Replacement Forecast',
  'Lawn & Landscape', '3D Home Scans', 'Home Profile', 'Emergency Card', 'Insurance Claim Kit', 'Home Binder',
  'Home inventory report', 'Backup & restore']
const RE = new RegExp('(' + NAMES.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g')

export default function Rich({ children }) {
  if (typeof children !== 'string') return children ?? null
  const parts = children.split(RE)
  return parts.map((p, i) => (i % 2 ? <b className="feat" key={i}>{p}</b> : <Fragment key={i}>{p}</Fragment>))
}
