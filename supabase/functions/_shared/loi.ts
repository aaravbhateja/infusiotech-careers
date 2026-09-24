import { db } from './common.ts'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage } from 'npm:pdf-lib@1.17.1'

export interface LoiInput {
  ref: string
  firstName: string
  lastName: string
  email: string
  college: string
  state: string
  country: string
  paymentId: string
  amountInr: number
  issuedOn: Date
}

// Company details come from Supabase secrets so they can be corrected without a redeploy.
const env = (k: string, d: string) => Deno.env.get(k) || d
const COMPANY = () => ({
  name: env('COMPANY_NAME', 'InfusioTech'),
  address: env('COMPANY_ADDRESS', 'Jaipur, Rajasthan, India'),
  web: env('COMPANY_WEB', 'infusiotech.com'),
  email: env('COMPANY_EMAIL', 'contact@infusiotech.com'),
  signatory: env('SIGNATORY_NAME', 'Lokesh Sangwan'),
  signatoryTitle: env('SIGNATORY_TITLE', 'Managing Director'),
  l1: env('MANAGER_L1', 'Chaitanya Shandilya'),
  l2: env('MANAGER_L2', 'Ayush'),
  jurisdiction: env('JURISDICTION', 'Jaipur, Rajasthan'),
})

const TEAL = rgb(0.17, 0.55, 0.51)
const INK = rgb(0.08, 0.13, 0.17)
const MUTED = rgb(0.36, 0.42, 0.46)

// Standard PDF fonts only cover Latin-1; strip anything else so odd characters in a name can't crash generation.
const safe = (s: string) => s.normalize('NFKC').replace(/[^\x20-\x7E -ÿ]/g, '')

async function fetchImage(pdf: PDFDocument, url?: string): Promise<PDFImage | null> {
  if (!url) return null
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const bytes = new Uint8Array(await r.arrayBuffer())
    return url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes)
  } catch { return null }
}

export async function buildLoiPdf(d: LoiInput): Promise<Uint8Array> {
  const c = COMPANY()
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Letter of Intent - ${safe(d.firstName)} ${safe(d.lastName)}`)
  pdf.setAuthor(c.name)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const logo = await fetchImage(pdf, env('LOGO_URL', 'https://infusiotech.com/assets/logo-mark.png'))
  // The signature lives in a private Supabase Storage bucket (never served publicly).
  let signature: PDFImage | null = null
  try {
    const { data } = await db().storage.from('private-assets').download('lokesh-signature.jpg')
    if (data) signature = await pdf.embedJpg(new Uint8Array(await data.arrayBuffer()))
  } catch (e) { console.error('signature load failed', e) }

  const W = 595.28, H = 841.89, M = 56
  let page = pdf.addPage([W, H])
  let y = H - M

  const drawHeader = () => {
    if (logo) page.drawImage(logo, { x: M, y: H - M - 30, width: 30, height: 30 })
    page.drawText(safe(c.name), { x: M + (logo ? 40 : 0), y: H - M - 14, size: 17, font: bold, color: INK })
    page.drawText(safe(`${c.address}  |  ${c.web}  |  ${c.email}`), { x: M + (logo ? 40 : 0), y: H - M - 28, size: 8, font: regular, color: MUTED })
    page.drawLine({ start: { x: M, y: H - M - 40 }, end: { x: W - M, y: H - M - 40 }, thickness: 1.2, color: TEAL })
    y = H - M - 62
  }
  const newPage = () => { page = pdf.addPage([W, H]); drawHeader() }
  const ensure = (h: number) => { if (y - h < M + 30) newPage() }

  const wrap = (text: string, font: PDFFont, size: number, maxW: number) => {
    const lines: string[] = []
    let line = ''
    for (const word of safe(text).split(/\s+/)) {
      const t = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(t, size) > maxW && line) { lines.push(line); line = word } else line = t
    }
    if (line) lines.push(line)
    return lines
  }
  const para = (text: string, o: { size?: number; font?: PDFFont; indent?: number; gap?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const size = o.size ?? 10, font = o.font ?? regular, indent = o.indent ?? 0
    for (const l of wrap(text, font, size, W - 2 * M - indent)) {
      ensure(size + 4)
      page.drawText(l, { x: M + indent, y, size, font, color: o.color ?? INK })
      y -= size + 4
    }
    y -= o.gap ?? 4
  }
  const row = (label: string, value: string) => {
    const lines = wrap(value, regular, 10, W - 2 * M - 130)
    ensure(lines.length * 14 + 2)
    page.drawText(safe(label), { x: M + 10, y, size: 10, font: bold, color: INK })
    lines.forEach((l, i) => page.drawText(l, { x: M + 130, y: y - i * 14, size: 10, font: regular, color: INK }))
    y -= lines.length * 14 + 2
  }

  drawHeader()
  para('Strictly Private & Confidential', { size: 9, font: bold, color: MUTED, gap: 8 })
  const dateStr = d.issuedOn.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  para(`Ref: ${d.ref}`, { size: 9, color: MUTED, gap: 0 })
  para(`Date: ${dateStr}`, { size: 9, color: MUTED, gap: 10 })
  para(`${d.firstName} ${d.lastName}`, { font: bold, gap: 0 })
  para(`${d.college}`, { gap: 0 })
  para(`${d.state}, ${d.country}`, { gap: 10 })
  para('Subject: Letter of Intent - Spec-Driven Web Development with AI (Training & Internship Program), InfusioTech Careers', { font: bold, gap: 8 })
  para(`Dear ${d.firstName},`, { gap: 6 })
  para(`We are pleased to confirm your enrollment in the InfusioTech Careers Spec-Driven Web Development with AI Training & Internship Program on behalf of ${c.name} ("the Company"). We have received your program fee of Rs. ${d.amountInr.toLocaleString('en-IN')} (Payment ID: ${d.paymentId}). The details of the program are set out below:`, { gap: 8 })

  row('Program:', 'Spec-Driven Web Development with AI')
  row('Duration:', '3 months: 2 months of training followed by 1 month of internship')
  row('Start date:', `${dateStr} (date of payment)`)
  row('Mode:', 'Online')
  row('Reporting to:', `L1 Manager - ${c.l1}`)
  row('', `L2 Manager - ${c.l2}`)
  row('Mentors:', 'Assigned during onboarding')
  y -= 10

  const terms = [
    'Program structure: the first two months consist of training in spec-driven web development with AI, delivered through lectures, meetings, webinars and workshops with industry experts and the tech team of the Company. In the final month you will work on industry projects under the guidance of your reporting managers and mentors.',
    'Onboarding: from day 1 you will be onboarded into the systems of the Company, connected to the HR team, and assigned your L1 and L2 managers and mentors.',
    'Schedule: session timings, assignments and deliverables will be shared by your managers. You are expected to attend sessions regularly and complete the assigned work on time.',
    'Nature of engagement: this program is a learning and internship engagement. It is not an offer of employment, does not create an employer-employee relationship, and carries no salary, stipend or guarantee of future employment.',
    'Certificates: on satisfactory completion you will receive a training completion certificate for the first two months and an internship completion certificate for the internship month.',
    'Confidentiality: you must keep confidential all project documents, client information, source code, designs, estimates, technology and internal policies of the Company and its clients, during the program and after it ends.',
    'Intellectual property: all work, code, designs and other material you create in the course of the internship on Company or client projects will be the exclusive property of the Company or its clients. You agree to disclose such work to the Company promptly.',
    'Conduct: you will follow the rules and instructions of the Company, behave professionally, and not act in a way that harms the reputation or interests of the Company or its clients. You will not accept gifts or gratification from any party dealing with the Company.',
    'Discontinuation: the Company may discontinue your participation without notice in case of misconduct, fraud, breach of these terms, or persistent absence or non-performance.',
    'Declaration: you confirm that the information you provided during enrollment is true and complete. Providing false information may lead to removal from the program.',
    `Governing law: this letter is governed by the laws of India, and the courts at ${c.jurisdiction} shall have jurisdiction.`,
    'Acceptance: please confirm that you accept these terms by replying "I accept" to the email that carried this letter, or by signing and returning a copy.',
  ]
  terms.forEach((t, i) => {
    const lines = wrap(t, regular, 10, W - 2 * M - 22)
    ensure(lines.length * 14 + 4)
    page.drawText(`${i + 1}.`, { x: M, y, size: 10, font: regular, color: INK })
    lines.forEach((l) => { page.drawText(l, { x: M + 22, y, size: 10, font: regular, color: INK }); y -= 14 })
    y -= 4
  })

  ensure(130)
  y -= 8
  para('With Regards,', { gap: 6 })
  if (signature) {
    const dims = signature.scaleToFit(130, 50)
    page.drawImage(signature, { x: M, y: y - dims.height, width: dims.width, height: dims.height })
    y -= dims.height + 18
  } else {
    y -= 40
  }
  para(c.signatory, { font: bold, gap: 0 })
  para(c.signatoryTitle, { gap: 0 })
  para(`For ${c.name}`, { gap: 12 })
  para('This is a system-generated letter issued on payment confirmation.', { size: 8, color: MUTED })

  return await pdf.save()
}
