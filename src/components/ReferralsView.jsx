import { KEY_FIELDS } from '../lib/intake.js'
import { Icon } from '../lib/icons.jsx'

// Repair Referrals: the trusted places to find someone good — national referral
// networks, neighbor recommendations, and faith-based repair help. Links are
// localized with the home's city/ZIP when the Home Profile has an address.
function locBits(profile) {
  const addr = (profile?.[KEY_FIELDS.address] || '').trim()
  const zip = (addr.match(/\b\d{5}\b/) || [])[0] || ''
  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean)
  const city = parts.length >= 2 ? parts[1].replace(/\b\d{5}\b/, '').trim() : ''
  return { zip, city, near: zip || city }
}

export default function ReferralsView({ profile }) {
  const { zip, city, near } = locBits(profile)
  const g = (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q + (near ? ' near ' + (city || zip) : ' near me'))

  const SERVICES = [
    { name: 'Angi', desc: "Rated & reviewed pros for every trade — the big referral network (formerly Angie's List).",
      url: 'https://www.angi.com/' },
    { name: 'HomeAdvisor', desc: 'Matches you with vetted local contractors for specific jobs.',
      url: 'https://www.homeadvisor.com/' },
    { name: 'Thumbtack', desc: 'Compare bids from local pros — handy for smaller projects.',
      url: 'https://www.thumbtack.com/' },
    { name: 'TaskRabbit', desc: 'Same-day help for small fixes, mounting, assembly and odd jobs.',
      url: 'https://www.taskrabbit.com/' },
    { name: 'Yelp Home Services', desc: 'Neighborhood reviews of repair companies around you.',
      url: 'https://www.yelp.com/search?find_desc=' + encodeURIComponent('Home Repair') + (near ? '&find_loc=' + encodeURIComponent(near) : '') },
    { name: 'Nextdoor', desc: 'Ask neighbors who they actually used and trusted.',
      url: 'https://nextdoor.com/' },
    { name: 'Better Business Bureau', desc: 'Accreditation, ratings and complaint history before you hire.',
      url: 'https://www.bbb.org/search?find_text=' + encodeURIComponent('home repair') + (near ? '&find_loc=' + encodeURIComponent(near) : '') },
    { name: 'Christian home repair', desc: 'Faith-based and volunteer repair ministries serving your area.',
      url: g('Christian home repair assistance') },
    { name: 'Habitat for Humanity', desc: 'Critical home repair program for qualifying homeowners.',
      url: 'https://www.habitat.org/impact/our-work/home-repairs' },
  ]

  return (
    <div className="refs">
      <div className="intake-lede">
        <h2>Repair Referrals</h2>
        <p>When you need someone good and don't have a name yet — the trusted ways to find one.
          Once they've done the work, save them in My Pros so you never have to search twice.</p>
      </div>

      <div className="items">
        {SERVICES.map((s) => (
          <a className="ref-row" key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">
            <span className="ref-body">
              <span className="ref-name">{s.name}</span>
              <span className="ref-desc">{s.desc}</span>
            </span>
            <span className="ref-open">Open ↗</span>
          </a>
        ))}
      </div>

      <div className="intake-foot" style={{ marginTop: 16 }}>
        <Icon.shield size={18} />
        <span>These are outside services with their own accounts and policies. HomeVault just gets
          you to the door{near ? ` — links are aimed at ${city || zip} where the site allows it` : ''}.</span>
      </div>
    </div>
  )
}
