import { Icon } from '../lib/icons.jsx'

// The opening-page welcome: a warm, plain-language explanation of what HomeVault is
// and why it exists. Dismissible (persisted by App); reopen from the topbar “i”.
export default function WelcomeIntro({ onDismiss }) {
  return (
    <section className="welcome">
      <button className="welcome-x" onClick={onDismiss} aria-label="Hide intro">×</button>

      <h1 className="welcome-h">Your entire home&hellip; finally in one place.</h1>
      <p className="welcome-p">
        Every home, over time, fills with a mountain of documents and a running list of “where did I
        put that?” — warranties, receipts, manuals, model numbers, and a history of who fixed what
        and when. HomeVault gives all of it&hellip; a home. Tap any room on your floor plan and file
        things right where they belong, so your family always knows where everything is — and you
        never have to chase down another warranty, receipt, or repair detail again.
      </p>

      <div className="welcome-props">
        <div className="wp">
          <span className="wp-i"><Icon.box size={20} /></span>
          <div><strong>Everything in one place</strong><span>Warranties, receipts, manuals &amp; photos — filed by room.</span></div>
        </div>
        <div className="wp">
          <span className="wp-i"><Icon.clock size={20} /></span>
          <div><strong>Never miss a warranty</strong><span>See what's expiring before it lapses.</span></div>
        </div>
        <div className="wp">
          <span className="wp-i"><Icon.shield size={20} /></span>
          <div><strong>Less stress for the family</strong><span>Anyone can find what they need in seconds.</span></div>
        </div>
      </div>

      <button className="btn welcome-cta" onClick={onDismiss}>Start with your home <Icon.chevron size={18} /></button>
    </section>
  )
}
