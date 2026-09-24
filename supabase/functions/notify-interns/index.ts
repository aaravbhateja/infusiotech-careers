import { db, guard, json, safeEqual } from '../_shared/common.ts'
import { box, esc, layout, p, rows } from '../_shared/email.ts'

// Admin tool (needs ADMIN_TOKEN), called by the local admin panel after every change it makes.
//   { token, type, intern_id: uuid|null, ...details }   intern_id null = every paid intern with a portal login
// type: task_assigned | task_removed | task_approved | task_returned | meeting_scheduled | meeting_cancelled | lecture_added | feedback
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const title = (t: unknown) => `<div style="font-weight:700;font-size:16px;margin-bottom:4px">${esc(t)}</div>`
const desc = (d: unknown) => (d ? `<div style="margin-top:8px;white-space:pre-wrap;color:#33424E">${esc(d)}</div>` : '')

interface Msg { subject: string; preheader: string; heading: string; body: string; cta?: string }

// deno-lint-ignore no-explicit-any
function compose(type: string, d: any): Msg | null {
  switch (type) {
    case 'task_assigned': return {
      subject: `New task: ${d.title}`, preheader: d.due_date ? `Due ${day(d.due_date)}` : 'A new task is waiting in your portal.', heading: 'You have a new task',
      body: p('A new task has been assigned to you.') + box(title(d.title) + (d.due_date ? rows([['Due', esc(day(d.due_date))]]) : '') + desc(d.description)),
      cta: 'View task',
    }
    case 'task_removed': return {
      subject: `Task removed: ${d.title}`, preheader: 'You no longer need to work on this task.', heading: 'A task was removed',
      body: p(`The task <b>${esc(d.title)}</b> has been removed. You no longer need to work on it.`),
    }
    case 'task_approved': return {
      subject: `Task approved: ${d.title}`, preheader: 'Great work. Your submission was approved.', heading: 'Your task was approved 🎉',
      body: p(`Your submission for <b>${esc(d.title)}</b> has been reviewed and <b style="color:#2C8C82">approved</b>. Well done!`),
      cta: 'See your progress',
    }
    case 'task_returned': return {
      subject: `Changes needed: ${d.title}`, preheader: 'Your submission needs a few changes.', heading: 'Changes requested',
      body: p(`Your submission for <b>${esc(d.title)}</b> needs some changes. Please update it and submit again from your portal.`),
      cta: 'Update submission',
    }
    case 'meeting_scheduled': return {
      subject: `Meeting scheduled: ${d.title}`, preheader: when(d.starts_at), heading: 'New meeting scheduled',
      body: box(title(d.title) + rows([['When', esc(when(d.starts_at))], ['Duration', `${esc(d.duration_min)} min`], ...(d.host ? [['Host', esc(d.host)] as [string, string]] : [])]) + desc(d.description)) +
        (/^https?:\/\//i.test(d.link ?? '') ? p(`Join link: <a href="${esc(d.link)}" style="color:#2C8C82">${esc(d.link)}</a>`) : ''),
      cta: 'View in portal',
    }
    case 'meeting_cancelled': return {
      subject: `Meeting cancelled: ${d.title}`, preheader: `${d.title} on ${when(d.starts_at)} is cancelled.`, heading: 'Meeting cancelled',
      body: p(`The meeting <b>${esc(d.title)}</b> scheduled for <b>${esc(when(d.starts_at))}</b> has been cancelled.`),
    }
    case 'lecture_added': return {
      subject: `New lecture: ${d.title}`, preheader: 'A new lecture is ready to watch.', heading: 'New lecture available',
      body: p('A new lecture has been added to your portal.') + box(title(d.title) + (d.week ? rows([['Week', esc(d.week)]]) : '') + desc(d.description)),
      cta: 'Watch lecture',
    }
    case 'feedback': return {
      subject: 'New feedback from your manager', preheader: 'Your manager posted feedback on your work.', heading: 'You have new feedback',
      body: box((d.rating ? `<div style="font-size:18px;color:#D9791F;letter-spacing:2px;margin-bottom:6px">${'★'.repeat(d.rating)}${'☆'.repeat(5 - d.rating)}</div>` : '') +
        `<div style="font-style:italic;white-space:pre-wrap">${esc(d.note)}</div>` + (d.author ? `<div style="margin-top:8px;color:#6B7A86">&mdash; ${esc(d.author)}</div>` : '')),
      cta: 'Open portal',
    }
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
  const html = (name: string) => layout({
    preheader: msg.preheader, heading: msg.heading, body: p(`Hi ${esc(name)},`) + msg.body,
    cta: msg.cta ? { label: msg.cta, url: portal } : undefined,
    note: "You're receiving this because you're enrolled in the InfusioTech Training + Internship Program.",
  }, reply)

  // Resend batch API: up to 100 separate emails per call, so interns never see each other's addresses.
  let sent = 0
  for (let i = 0; i < people.length; i += 100) {
    const chunk = people.slice(i, i + 100)
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk.map((person) => ({ from, to: [person.email], reply_to: reply, subject: msg.subject, html: html(person.first_name) }))),
    })
    if (!res.ok) return json(req, { sent, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` }, 502)
    sent += chunk.length
  }
  return json(req, { sent })
})
