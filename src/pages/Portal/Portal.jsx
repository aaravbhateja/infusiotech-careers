import { useEffect, useState } from 'react'
import { supabase, portalConfigured } from '../../lib/supabase'
import Login from './Login'
import ResetPassword from './ResetPassword'
import Dashboard from './Dashboard'
import '../../portal.css'

export default function Portal() {
  const [session, setSession] = useState(undefined) // undefined = still loading
  const [recovering, setRecovering] = useState(false) // arrived via a "forgot password" email link

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'USER_UPDATED') setRecovering(false)
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!portalConfigured) {
    return <section className="section"><div className="wrap-narrow"><p className="muted">The intern portal is not configured yet.</p></div></section>
  }
  if (session === undefined) return <section className="section"><div className="wrap-narrow"><p className="muted">Loading…</p></div></section>
  if (!session) return <Login />
  // Accounts are created with must_reset = true; it flips to false once the intern chooses their own password.
  if (recovering || session.user.user_metadata?.must_reset !== false) return <ResetPassword user={session.user} />
  return <Dashboard user={session.user} />
}
