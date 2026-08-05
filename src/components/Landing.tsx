import { useState } from 'react'
import type { OnlineUser } from '../online/api'
import { LandingScene } from '../three/LandingScene'

interface LandingProps {
  user: OnlineUser | null
  checking: boolean
  authBusy: boolean
  authError: string | null
  hasSave: boolean
  onLogin: (username: string, password: string) => void
  onRegister: (username: string, password: string) => void
  onLogout: () => void
  onStart: (name: string) => void
  onContinue: () => void
}

type AuthTab = 'login' | 'register'

function AuthForm({
  busy,
  error,
  onLogin,
  onRegister,
}: Pick<LandingProps, 'onLogin' | 'onRegister'> & { busy: boolean; error: string | null }) {
  const [tab, setTab] = useState<AuthTab>('login')

  return (
    <div className="auth">
      <div className="auth__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          className={`auth__tab${tab === 'login' ? ' is-active' : ''}`}
          onClick={() => setTab('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'register'}
          className={`auth__tab${tab === 'register' ? ' is-active' : ''}`}
          onClick={() => setTab('register')}
        >
          Found a House
        </button>
      </div>

      <form
        className="landing__form auth__form"
        onSubmit={(e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          const username = String(data.get('username') || '').trim()
          const password = String(data.get('password') || '')
          if (tab === 'login') onLogin(username, password)
          else onRegister(username, password)
        }}
      >
        <input
          name="username"
          type="text"
          maxLength={20}
          placeholder="House name"
          autoComplete="username"
          required
        />
        <input
          name="password"
          type="password"
          minLength={6}
          placeholder={tab === 'register' ? 'Password (min 6 chars)' : 'Password'}
          autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
          required
        />
        {error && <p className="auth__error" role="alert">{error}</p>}
        <div className="landing__actions">
          <button type="submit" className="btn btn--gold" disabled={busy}>
            {busy ? 'Consulting the heralds…' : tab === 'login' ? 'Enter the Realm' : 'Raise Your Banner'}
          </button>
        </div>
        <p className="auth__hint">
          {tab === 'login'
            ? 'Your kingdom, score and leaderboard rank follow your account.'
            : 'One account per house — your realm is saved online.'}
        </p>
      </form>
    </div>
  )
}

export function Landing({
  user,
  checking,
  authBusy,
  authError,
  hasSave,
  onLogin,
  onRegister,
  onLogout,
  onStart,
  onContinue,
}: LandingProps) {
  return (
    <section className="landing">
      <LandingScene />
      <div className="landing__veil" aria-hidden />

      <div className="landing__content">
        <h1 className="landing__brand">
          Check
          <span>Realm</span>
        </h1>
        <p className="landing__tag">
          A 3D online kingdom-builder on a living chessboard. Gather timber and
          grain, raise armies of pieces, climb the realm leaderboard.
        </p>

        {checking ? (
          <p className="auth__hint">Restoring your session…</p>
        ) : !user ? (
          <AuthForm
            busy={authBusy}
            error={authError}
            onLogin={onLogin}
            onRegister={onRegister}
          />
        ) : (
          <>
            <p className="auth__welcome">
              Welcome, <strong>{user.name}</strong>
              {user.bestScore > 0 && <> · best score {user.bestScore.toLocaleString()}</>}
            </p>
            <form
              className="landing__form"
              onSubmit={(e) => {
                e.preventDefault()
                const data = new FormData(e.currentTarget)
                onStart(String(data.get('name') || user.name))
              }}
            >
              <input
                name="name"
                type="text"
                maxLength={24}
                placeholder="Name your kingdom"
                autoComplete="off"
                defaultValue={user.name}
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
                <button type="button" className="btn btn--ghost" onClick={onLogout}>
                  Sign Out
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
