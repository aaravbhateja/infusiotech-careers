import { db, guard, json, safeEqual } from '../_shared/common.ts'

// Admin tool (needs ADMIN_TOKEN), called by the local admin panel after every change it makes.
//   { token, type, intern_id: uuid|null, ...details }   intern_id null = every paid intern with a portal login
// type: task_assigned | task_removed | task_approved | task_returned | meeting_scheduled | meeting_cancelled | feedback
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// deno-lint-ignore no-explicit-any
function compose(type: string, d: any): { subject: string; lines: string[] } | null {
  switch (type) {
    case 'task_assigned': return { subject: `New task: ${d.title}`, lines: [`A new task has been assigned to you: <b>${esc(d.title)}</b>.`, d.description && esc(d.description), d.due_date && `Due: <b>${esc(day(d.due_date))}</b>`] }
    case 'task_removed': return { subject: `Task removed: ${d.title}`, lines: [`The task <b>${esc(d.title)}</b> has been removed. You no longer need to work on it.`] }
    case 'task_approved': return { subject: `Task approved: ${d.title}`, lines: [`Your submission for <b>${esc(d.title)}</b> has been reviewed and <b>approved</b>. Well done!`] }
    case 'task_returned': return { subject: `Changes needed: ${d.title}`, lines: [`Your submission for <b>${esc(d.title)}</b> needs some changes. Please update it and submit again.`] }
    case 'meeting_scheduled': return { subject: `Meeting scheduled: ${d.title}`, lines: [`A meeting has been scheduled: <b>${esc(d.title)}</b>`, `When: <b>${esc(when(d.starts_at))}</b> (${esc(d.duration_min)} min)`, d.host && `Host: ${esc(d.host)}`, d.description && esc(d.description), /^https?:\/\//i.test(d.link ?? '') && `Join: <a href="${esc(d.link)}">${esc(d.link)}</a>`] }
    case 'meeting_cancelled': return { subject: `Meeting cancelled: ${d.title}`, lines: [`The meeting <b>${esc(d.title)}</b> (${esc(when(d.starts_at))}) has been cancelled.`] }
    case 'feedback': return { subject: 'New feedback from your manager', lines: ['You have new feedback in your portal:', `<i>${esc(d.note)}</i>`, d.rating && `Rating: ${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}`, d.author && `— ${esc(d.author)}`] }
  }
  return null
}

Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const admin = Deno.env.get('ADMIN_TOKEN')
  const { token, type, intern_id, ...details } = await req.json().catch(() => ({}))
  if (!admin || typeof token !== 'string' || !safeEqual(token, admin)) return json(req, { error: 'Unauthorized' }, 401)
  const msg = compose(String(type), details)
  if (!msg) return json(req, { error: 'Unknown type' }, 400)

  const key = Deno.env.get('RESEND_API_KEY'), from = Deno.env.get('MAIL_FROM')
  if (!key || !from) return json(req, { error: 'Email is not configured' }, 500)

  let q = db().from('applicants').select('first_name,email').eq('status', 'paid').not('user_id', 'is', null)
  if (intern_id) q = q.eq('user_id', intern_id)
  const { data: people, error } = await q
  if (error) return json(req, { error: error.message }, 500)
  if (!people?.length) return json(req, { sent: 0 })

  const portal = Deno.env.get('PORTAL_URL') ?? 'https://infusiotech.careers/portal'
  const reply = Deno.env.get('MAIL_REPLY_TO') ?? Deno.env.get('COMPANY_EMAIL') ?? 'infusiotech@gmail.com'
  const body = (name: string) => `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14202b;line-height:1.6">
    <h2 style="color:#2c8c82;margin-bottom:4px">${esc(msg.subject)}</h2><p>Hi ${esc(name)},</p>
    ${msg.lines.filter(Boolean).map((l) => `<p>${l}</p>`).join('')}
    <p><a href="${esc(portal)}" style="display:inline-block;background:#2c8c82;color:#fff;padding:9px 16px;border-radius:8px;text-decoration:none">Open Intern Portal</a></p>
    <p style="font-size:13px;color:#5b6b75">Regards,<br>Team InfusioTech</p></div>`

  // Resend batch API: up to 100 separate emails per call, so interns never see each other's addresses.
  let sent = 0
  for (let i = 0; i < people.length; i += 100) {
    const chunk = people.slice(i, i + 100)
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk.map((p) => ({ from, to: [p.email], reply_to: reply, subject: msg.subject, html: body(p.first_name) }))),
    })
    if (!res.ok) return json(req, { sent, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` }, 502)
    sent += chunk.length
  }
  return json(req, { sent })
})
