// Shared, branded layout for every email the careers site sends.
// Table-based with inline styles only, because Gmail, Outlook and phone mail apps ignore most CSS.

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const NAVY = '#0B1033', INK = '#14202B', TEXT = '#33424E', MUTED = '#6B7A86', TEAL = '#2C8C82', LINE = '#E3E8EC'
const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const LOGO = 'https://infusiotech.careers/assets/logo.png'

/** A paragraph of body text. `html` must already be escaped where it contains user data. */
export const p = (html: string) => `<p style="margin:0 0 16px;font:15px/1.65 ${FONT};color:${TEXT}">${html}</p>`

/** Highlighted panel, e.g. for login details or a task summary. */
export const box = (html: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px"><tr>
  <td style="background:#F2FAF9;border:1px solid #CFE8E4;border-left:4px solid ${TEAL};border-radius:10px;padding:16px 18px;font:14.5px/1.6 ${FONT};color:${INK}">${html}</td></tr></table>`

/** Label/value rows inside a box, e.g. [['Due', '12 Oct 2026']]. Values must be escaped already. */
export const rows = (items: [string, string][]) =>
  items.map(([k, v]) => `<div style="margin:2px 0"><span style="color:${MUTED}">${esc(k)}:</span> <b>${v}</b></div>`).join('')

/** Bulleted list. Items must be escaped already. */
export const list = (items: string[]) =>
  `<ul style="margin:0 0 16px;padding-left:20px;font:15px/1.65 ${FONT};color:${TEXT}">${items.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join('')}</ul>`

function button(label: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr>
    <td style="background:${TEAL};border-radius:8px"><a href="${esc(url)}" target="_blank"
      style="display:inline-block;padding:13px 26px;font:600 15px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:8px">${esc(label)}</a></td></tr></table>
    <p style="margin:0 0 22px;font:12.5px/1.5 ${FONT};color:${MUTED}">Button not working? Copy this link into your browser:<br>
    <a href="${esc(url)}" style="color:${TEAL};word-break:break-all">${esc(url)}</a></p>`
}

export interface Layout {
  /** Shown as the inbox preview line next to the subject. */
  preheader: string
  heading: string
  /** Body HTML built with p(), box(), rows(), list(). */
  body: string
  cta?: { label: string; url: string }
  /** Small print under the sign-off, e.g. why they got this email. */
  note?: string
}

export function layout({ preheader, heading, body, cta, note }: Layout, contactEmail = 'careers@infusiotech.com') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#EEF1F4">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F4"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">

  <tr><td style="background:${NAVY};border-radius:14px 14px 0 0;padding:20px 28px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:12px"><img src="${LOGO}" width="42" height="42" alt="InfusioTech" style="display:block;border:0;border-radius:10px"></td>
      <td><div style="font:700 19px/1.2 ${FONT};color:#ffffff">InfusioTech</div>
        <div style="font:600 11px/1.4 ${FONT};color:#9FB0FF;letter-spacing:1.6px;text-transform:uppercase">Careers &middot; Intern Program</div></td>
    </tr></table></td></tr>

  <tr><td style="height:4px;line-height:4px;font-size:0;background:${TEAL};background-image:linear-gradient(90deg,#38BDF8,#8B5CF6,#D9791F)">&nbsp;</td></tr>

  <tr><td style="background:#ffffff;padding:32px 28px 12px">
    <h1 style="margin:0 0 18px;font:700 22px/1.35 ${FONT};color:${INK}">${esc(heading)}</h1>
    ${body}
    ${cta ? button(cta.label, cta.url) : ''}
    <p style="margin:0 0 24px;font:15px/1.65 ${FONT};color:${TEXT}">Regards,<br><b style="color:${INK}">Team InfusioTech</b></p>
  </td></tr>

  <tr><td style="background:#ffffff;border-radius:0 0 14px 14px;border-top:1px solid ${LINE};padding:18px 28px 22px;font:12.5px/1.6 ${FONT};color:${MUTED}">
    ${note ? `<div style="margin-bottom:10px">${note}</div>` : ''}
    Questions? Just reply to this email or write to <a href="mailto:${esc(contactEmail)}" style="color:${TEAL}">${esc(contactEmail)}</a>.<br>
    <a href="https://infusiotech.careers" style="color:${TEAL};text-decoration:none">infusiotech.careers</a> &middot;
    <a href="https://www.linkedin.com/company/infusiotech-solutions/" style="color:${TEAL};text-decoration:none">LinkedIn</a> &middot;
    <a href="https://www.instagram.com/infusiotechsolutions/" style="color:${TEAL};text-decoration:none">Instagram</a>
  </td></tr>

  <tr><td align="center" style="padding:16px 12px 0;font:11.5px/1.5 ${FONT};color:#94A1AB">&copy; ${new Date().getFullYear()} InfusioTech Solutions. All rights reserved.</td></tr>
</table></td></tr></table></body></html>`
}
