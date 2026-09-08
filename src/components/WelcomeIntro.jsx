// The opening-page welcome: a warm, plain-language explanation of what HomeVault
// is and why it exists. Always shown — it's part of the front page.
export default function WelcomeIntro({ onLoadSample }) {
  return (
    <section className="welcome">
      <h1 className="welcome-h">Your entire home&hellip; finally in one place.</h1>
      <p className="welcome-p">
        Every home, over time, fills with a mountain of documents and a running list of “where did I
        put that?” — warranties, receipts, manuals, model numbers, and a history of who fixed what
        and when. HomeVault gives all of it&hellip; a home. Tap any room on your floor plan and file
        things right where they belong, so your family always knows where everything is — and you
        never have to chase down another warranty, receipt, or repair detail again.
      </p>

      {onLoadSample && (
        <div className="welcome-cta-row" style={{ marginTop: 10 }}>
          <button className="welcome-sample" onClick={onLoadSample}>
            New here? Load a <b>sample home</b> to see it all filled in →
          </button>
        </div>
      )}
    </section>
  )
}
