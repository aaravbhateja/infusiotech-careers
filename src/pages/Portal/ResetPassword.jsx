import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Shown on first sign-in (and after a "forgot password" link) until the intern picks their own password.
export default function ResetPassword({ user }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 10) return setError('Use at least 10 characters.')
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return setError('Include an uppercase letter, a lowercase letter and a number.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password, data: { must_reset: false } })
    if (err) { setError(err.message.includes('different') ? 'Choose a password different from your temporary one.' : err.message); setBusy(false) }
    // On success the auth listener in Portal receives the updated user and shows the dashboard.
  }

  return (
    <>
      <section className="page-header">
        <div className="wrap">
          <div className="eyebrow">Intern Portal</div>
          <h1>Set your new password</h1>
          <p>Signed in as {user.email}. Replace the temporary password from your email with one only you know.</p>
        </div>
      </section>
      <section className="section" style={{ borderBottom: 'none' }}>
        <div className="wrap-narrow">
          <form className="enroll-panel portal-auth" onSubmit={submit}>
            {error && <div className="form-error-summary" role="alert"><h3>{error}</h3></div>}
            <div className="field">
              <label htmlFor="n-pass">New password</label>
              <input id="n-pass" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="n-conf">Confirm new password</label>
              <input id="n-conf" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <div className="btn-row">
              <button className="btn btn-accent" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
