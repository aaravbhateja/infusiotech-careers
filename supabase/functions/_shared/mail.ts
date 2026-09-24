import { db, markPaid } from './common.ts'
import { buildLoiPdf } from './loi.ts'
import { provisionPortalUser, type PortalAccess } from './portal.ts'
import { box, esc, layout, list, p, rows } from './email.ts'

const b64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

const loginBox = (portal: PortalAccess, url: string) => box(
  `<div style="font-weight:700;margin-bottom:6px">Your Intern Portal login</div>` +
  rows([['Portal', `<a href="${esc(url)}" style="color:#2C8C82">${esc(url.replace(/^https?:\/\//, ''))}</a>`], ['Login ID', esc(portal.email)],
    ['Temporary password', `<span style="font-family:Consolas,Menlo,monospace;font-size:16px;letter-spacing:.5px">${esc(portal.password)}</span>`]]) +
  `<div style="margin-top:8px;font-size:13px;color:#6B7A86">You'll be asked to set your own password the first time you sign in. Please don't share this email.</div>`,
)

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
  const portalUrl = Deno.env.get('PORTAL_URL') ?? 'https://infusiotech.careers/portal'
  const portalBlock = !portal ? '' : portal.password
    ? loginBox(portal, portalUrl)
    : p(`Your Intern Portal is at <a href="${esc(portalUrl)}" style="color:#2C8C82">${esc(portalUrl)}</a>. Sign in with your registered email and the password you set.`)
  const html = layout({
    preheader: 'Your seat is confirmed. Your Letter of Intent and portal login are inside.',
    heading: `Welcome to InfusioTech Careers, ${a.first_name}!`,
    body:
      p('Your payment has been received and your seat in the <b>3-Month Training + Internship Program</b> is confirmed. We\'re glad to have you on board.') +
      box(`<div style="font-weight:700;margin-bottom:4px">&#128206; Your Letter of Intent is attached</div>
        It has your program details, your reporting managers and the program terms. Please read it and <b>reply to this email with "I accept"</b>.`) +
      portalBlock +
      `<div style="font:700 15px/1.4 'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#14202B;margin:8px 0 8px">What happens next</div>` +
      list([
        'Your program starts on your payment date, as stated in the letter.',
        'Sign in to the Intern Portal to mark attendance, see tasks and watch lectures.',
        'We\'ll share the schedule and joining details by email.',
        'Keep following our <a href="https://www.linkedin.com/company/infusiotech-solutions/" style="color:#2C8C82">LinkedIn</a> and <a href="https://www.instagram.com/infusiotechsolutions/" style="color:#2C8C82">Instagram</a> for updates.',
      ]),
    cta: { label: 'Open Intern Portal', url: portalUrl },
  }, reply)
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
  const html = layout({
    preheader: 'Your login details for the InfusioTech Intern Portal.',
    heading: `Your Intern Portal is live, ${a.first_name}!`,
    body: p('Use the portal to mark your daily attendance, see your tasks, watch lectures, track your progress and view scheduled meetings.') + loginBox(portal, url),
    cta: { label: 'Sign in to the portal', url },
  }, reply)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [a.email], reply_to: reply, subject: 'Your InfusioTech Intern Portal login', html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
}
