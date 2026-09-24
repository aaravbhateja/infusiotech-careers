import { guard, hmacHex, json, safeEqual } from '../_shared/common.ts'
import { completePayment } from '../_shared/mail.ts'

Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    await req.json().catch(() => ({}))
  if (!secret || !orderId || !paymentId || !signature) return json(req, { error: 'Invalid payment response.' }, 400)

  const expected = await hmacHex(secret, `${orderId}|${paymentId}`)
  if (!safeEqual(String(signature), expected)) return json(req, { error: 'Payment verification failed.' }, 400)

  try {
    await completePayment(orderId, paymentId)
  } catch (e) {
    console.error('markPaid failed', e)
    return json(req, { error: 'Could not record payment.' }, 500)
  }
  return json(req, { ok: true })
})
