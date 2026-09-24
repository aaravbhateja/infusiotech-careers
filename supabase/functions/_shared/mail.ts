import { db, markPaid } from './common.ts'
import { buildLoiPdf } from './loi.ts'
import { provisionPortalUser, type PortalAccess } from './portal.ts'

const b64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const loiRef = (id: string, when: Date) => `ITC-${when.getFullYear()}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`

// deno-lint-ignore no-explicit-any
export async function makeLoi(a: any) {
  const issuedOn = new Date(a.paid_at ?? Date.now())
  const bytes = await buildLoiPdf({
    ref: loiRef(a.id, issuedOn), firstName: a.first_name, lastName: a.last_name, email: a.email,
    college: a.college, state: a.state, country: a.country, paymentId: a.payment_id ?? '-',
    amountInr: Math.round((a.amount_paise ?? 0) / 100), issuedOn,
  })
  return { bytes, filename: `${a.first_name} ${a.last_name} - LOI.pdf`.replace(/[^\w .()-]/g, '') }
}

// deno-lint-ignore no-explicit-any
export async function sendMail(a: any, portal?: PortalAccess) {
  const key = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('MAIL_FROM')
  if (!key || !from) throw new Error('Email is not configured (RESEND_API_KEY / MAIL_FROM)')
  const { bytes, filename } = await makeLoi(a)
  const reply = Deno.env.get('MAIL_REPLY_TO') ?? Deno.env.get('COMPANY_EMAIL') ?? 'infusiotech@gmail.com'
  const name = esc(a.first_name)
  const portalUrl = Deno.env.get('PORTAL_URL') ?? 'https://infusiotech.careers/portal'
  const portalBlock = !portal ? '' : portal.password
    ? `<div style="border:1px solid #2c8c82;border-radius:10px;padding:14px 16px;margin:16px 0;background:#f2faf9">
    <p style="margin:0 0 6px"><b>Your Intern Portal login</b></p>
    <p style="margin:0">Portal: <a href="${esc(portalUrl)}">${esc(portalUrl)}</a><br>
    ID: <b>${esc(portal.email)}</b><br>
    Temporary password: <b style="font-family:monospace;font-size:15px">${esc(portal.password)}</b></p>
    <p style="margin:8px 0 0;font-size:13px;color:#5b6b75">For your security you will be asked to set a new password the first time you sign in. Please do not share this email.</p></div>`
    : `<p>Your Intern Portal is at <a href="${esc(portalUrl)}">${esc(portalUrl)}</a>. Sign in with your registered email and the password you set.</p>`
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14202b;line-height:1.6">
    <h2 style="color:#2c8c82;margin-bottom:4px">Welcome to InfusioTech Careers, ${name}!</h2>
    <p>Your payment has been received and your seat in the <b>3-Month Training + Internship Program</b> is confirmed.</p>
    <p>Your <b>Letter of Intent</b> is attached to this email as a PDF. It has your program details, your reporting managers and the terms of the program. Please read it and reply to this email with <b>"I accept"</b>.</p>
    ${portalBlock}
    <p><b>What happens next</b></p>
    <ul><li>Your program start date is your payment date, as stated in the letter. We will share the schedule and joining details by email.</li>
    <li>Keep following our <a href="https://www.linkedin.com/company/infusiotech-solutions/">LinkedIn</a> and <a href="https://www.instagram.com/infusiotechsolutions/">Instagram</a> pages for updates.</li></ul>
    <p>Questions? Just reply to this email.</p>
    <p>Regards,<br>Team InfusioTech</p></div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [a.email], reply_to: reply, subject: 'Your Letter of Intent - InfusioTech Careers Training & Internship',
      html, attachments: [{ filename, content: b64(bytes) }],
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

/**
 * Sends the LOI to a paid applicant exactly once. The loi_sent_at column is claimed atomically
 * before sending, so the checkout callback and the webhook can't both send it. Failures release
 * the claim (and record the error) so a webhook redelivery or /resend-loi can retry.
 */
export async function sendLoiOnce(applicantId: string) {
  const supabase = db()
  const { data: a } = await supabase.from('applicants')
    .update({ loi_sent_at: new Date().toISOString(), loi_error: null })
    .eq('id', applicantId).eq('status', 'paid').is('loi_sent_at', null).select('*').maybeSingle()
  if (!a) return
  try {
    // Portal credentials go in the same email; if either step fails the claim is released so a retry redoes both.
    await sendMail(a, await provisionPortalUser(a))
    await supabase.from('applicants').update({ portal_sent_at: new Date().toISOString() }).eq('id', applicantId)
  } catch (e) {
    console.error('LOI email failed', e)
    await supabase.from('applicants').update({ loi_sent_at: null, loi_error: String(e instanceof Error ? e.message : e).slice(0, 500) }).eq('id', applicantId)
  }
}

/** Marks the order paid, then makes sure the LOI has gone out. Never throws on email problems. */
export async function completePayment(orderId: string, paymentId: string) {
  await markPaid(orderId, paymentId)
  const { data } = await db().from('applicants').select('id').eq('order_id', orderId).maybeSingle()
  if (data) await sendLoiOnce(data.id)
}

/** Credentials-only email (no LOI) for paid interns who were enrolled before the portal existed. */
// deno-lint-ignore no-explicit-any
export async function sendPortalMail(a: any, portal: PortalAccess) {
  const key = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('MAIL_FROM')
  if (!key || !from || !portal.password) throw new Error('Email is not configured or no password was issued')
  const url = Deno.env.get('PORTAL_URL') ?? 'https://infusiotech.careers/portal'
  const reply = Deno.env.get('MAIL_REPLY_TO') ?? Deno.env.get('COMPANY_EMAIL') ?? 'infusiotech@gmail.com'
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14202b;line-height:1.6">
    <h2 style="color:#2c8c82;margin-bottom:4px">Your InfusioTech Intern Portal is live, ${esc(a.first_name)}!</h2>
    <p>Use the portal to mark your daily attendance, see your tasks, track your progress and view scheduled meetings.</p>
    <div style="border:1px solid #2c8c82;border-radius:10px;padding:14px 16px;margin:16px 0;background:#f2faf9">
    <p style="margin:0">Portal: <a href="${esc(url)}">${esc(url)}</a><br>
    ID: <b>${esc(portal.email)}</b><br>
    Temporary password: <b style="font-family:monospace;font-size:15px">${esc(portal.password)}</b></p>
    <p style="margin:8px 0 0;font-size:13px;color:#5b6b75">You will be asked to set a new password the first time you sign in. Please do not share this email.</p></div>
    <p>Questions? Just reply to this email.</p><p>Regards,<br>Team InfusioTech</p></div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [a.email], reply_to: reply, subject: 'Your InfusioTech Intern Portal login', html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
}
