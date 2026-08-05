interface LandingProps {
  hasSave: boolean
  onStart: (name: string) => void
  onContinue: () => void
}

export function Landing({ hasSave, onStart, onContinue }: LandingProps) {
  return (
    <section className="landing">
      <div className="landing__board" aria-hidden />
      <div className="landing__veil" aria-hidden />
      <div className="landing__pieces" aria-hidden>
        <span className="landing__piece">♜</span>
        <span className="landing__piece">♞</span>
        <span className="landing__piece">♝</span>
        <span className="landing__piece">♛</span>
      </div>

      <div className="landing__content">
        <h1 className="landing__brand">
          Check
          <span>Realm</span>
        </h1>
        <p className="landing__tag">
          A kingdom-builder on a living chessboard. Gather timber and grain, raise
          armies of pieces, and take the enemy king&apos;s square.
        </p>

        <form
          className="landing__form"
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            onStart(String(data.get('name') || 'Sovereign'))
          }}
        >
          <input
            name="name"
            type="text"
            maxLength={24}
            placeholder="Name your house"
            autoComplete="off"
            defaultValue="Sovereign"
          />
          <div className="landing__actions">
            <button type="submit" className="btn btn--gold">
              Found Kingdom
            </button>
            {hasSave && (
              <button type="button" className="btn btn--ghost" onClick={onContinue}>
                Continue Campaign
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
