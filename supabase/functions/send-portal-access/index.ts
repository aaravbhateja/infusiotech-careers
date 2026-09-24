import { db, guard, json, safeEqual } from '../_shared/common.ts'
import { sendPortalMail } from '../_shared/mail.ts'
import { provisionPortalUser } from '../_shared/portal.ts'

// Admin tool (needs ADMIN_TOKEN). Emails portal credentials to PAID interns who have not been sent them yet.
//   { token, dry_run: true }   -> lists who would be emailed, sends nothing
//   { token, limit?: 40 }      -> sends to up to `limit` interns; call again until "remaining" is 0
// Interns who already reset their password are skipped. Each is claimed via portal_sent_at, so re-running never double-sends.
Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const admin = Deno.env.get('ADMIN_TOKEN')
  const { token, dry_run, limit } = await req.json().catch(() => ({}))
  if (!admin || typeof token !== 'string' || !safeEqual(token, admin)) return json(req, { error: 'Unauthorized' }, 401)

  const supabase = db()
  const pending = () => supabase.from('applicants').select('id,email').eq('status', 'paid').is('portal_sent_at', null).order('paid_at')
  const { data: todo, error } = await pending()
  if (error) return json(req, { error: error.message }, 500)
  if (dry_run) return json(req, { dry_run: true, count: todo.length, emails: todo.map((t) => t.email) })

  const batch = todo.slice(0, Math.min(Number(limit) || 40, 100))
  const sent: string[] = [], failed: { email: string; error: string }[] = []
  for (const { id } of batch) {
    const { data: a } = await supabase.from('applicants')
      .update({ portal_sent_at: new Date().toISOString() }).eq('id', id).eq('status', 'paid').is('portal_sent_at', null).select('*').maybeSingle()
    if (!a) continue
    try {
      const access = await provisionPortalUser(a)
      if (access.password) await sendPortalMail(a, access) // null = already reset their password, nothing to send
      sent.push(a.email)
    } catch (e) {
      await supabase.from('applicants').update({ portal_sent_at: null }).eq('id', id)
      failed.push({ email: a.email, error: String(e instanceof Error ? e.message : e).slice(0, 200) })
    }
    await new Promise((r) => setTimeout(r, 600)) // stay under Resend's rate limit
  }
  return json(req, { sent: sent.length, failed, remaining: todo.length - sent.length - failed.length })
})
