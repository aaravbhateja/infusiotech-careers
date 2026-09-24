import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (err) setError('Incorrect email or password.')
    setBusy(false)
  }

  const forgot = async () => {
    setError(''); setInfo('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter your registered email above first.')
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/portal` })
    // Same message whether or not the account exists, so this can't be used to probe for registered emails.
    setInfo('If that email is registered, a password reset link is on its way.')
  }

  return (
    <>
      <section className="page-header">
        <div className="wrap">
          <div className="eyebrow">Intern Portal</div>
          <h1>Sign in</h1>
          <p>Use the email you enrolled with and the temporary password we emailed you after payment.</p>
        </div>
      </section>
      <section className="section" style={{ borderBottom: 'none' }}>
        <div className="wrap-narrow">
          <form className="enroll-panel portal-auth" onSubmit={submit}>
            {error && <div className="form-error-summary" role="alert"><h3>{error}</h3></div>}
            {info && <p className="muted" role="status">{info}</p>}
            <div className="field">
              <label htmlFor="p-email">Registered email (your ID)</label>
              <input id="p-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-pass">Password</label>
              <input id="p-pass" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="btn-row">
              <button className="btn btn-accent" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
              <button type="button" className="btn btn-ghost" onClick={forgot}>Forgot password</button>
            </div>
            <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>Didn't get your login email? Check spam, or contact us with your payment ID.</p>
          </form>
        </div>
      </section>
    </>
  )
}
