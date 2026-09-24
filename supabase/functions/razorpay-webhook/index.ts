import { hmacHex, safeEqual } from '../_shared/common.ts'
import { completePayment } from '../_shared/mail.ts'

// Backup path: marks the applicant paid even if the browser closed before /verify-payment ran.
Deno.serve(async (req) => {
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
  if (req.method !== 'POST' || !secret) return new Response('Not found', { status: 404 })

  const raw = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  if (!safeEqual(sig, await hmacHex(secret, raw))) return new Response('Bad signature', { status: 400 })

  try {
    const ev = JSON.parse(raw)
    const p = ev?.payload?.payment?.entity
    if (ev.event === 'payment.captured' && p?.order_id) await completePayment(p.order_id, p.id)
  } catch (e) {
    console.error('webhook failed', e)
    return new Response('Error', { status: 500 })
  }
  return new Response('ok')
})
