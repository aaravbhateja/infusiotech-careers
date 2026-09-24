import { db, guard, json } from '../_shared/common.ts'

const MIN_PAISE = 100 // Razorpay can't take less than ₹1, so a coupon never brings the fee below that.

type Priced = { price: number; discount: number; amount: number; coupon: string | null }

// Works out the fee in paise, applying the coupon if one is given. Returns an error message for a bad coupon.
async function priceFor(code: unknown): Promise<Priced | { error: string }> {
  const price = Number(Deno.env.get('PRICE_INR') ?? 5000) * 100
  const c = typeof code === 'string' ? code.trim().toUpperCase() : ''
  if (!c) return { price, discount: 0, amount: price, coupon: null }

  const { data: k } = await db().from('coupons').select('*').eq('code', c).maybeSingle()
  if (!k || !k.active) return { error: 'This coupon code is not valid.' }
  if (k.expires_at && new Date(k.expires_at) < new Date()) return { error: 'This coupon has expired.' }
  if (k.max_uses && k.used_count >= k.max_uses) return { error: 'This coupon has already been fully used.' }

  const off = k.kind === 'percent' ? Math.round((price * k.value) / 100) : k.value * 100
  const amount = Math.max(MIN_PAISE, price - off)
  return { price, discount: price - amount, amount, coupon: k.code }
}

Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const keyId = Deno.env.get('RAZORPAY_KEY_ID')
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
  if (!keyId || !keySecret) return json(req, { error: 'Payments are not configured yet.' }, 503)

  const { id, coupon, preview } = await req.json().catch(() => ({}))
  if (typeof id !== 'string') return json(req, { error: 'Application not found.' }, 404)

  const supabase = db()
  const { data: a } = await supabase.from('applicants').select('*').eq('id', id).maybeSingle()
  if (!a) return json(req, { error: 'Application not found.' }, 404)
  if (a.status === 'paid') return json(req, { error: 'Already enrolled.' }, 409)
  if (!a.follow_verified) return json(req, { error: 'Please verify that you follow our LinkedIn and Instagram pages first.' }, 403)

  const p = await priceFor(coupon)
  if ('error' in p) return json(req, { error: p.error }, 400)
  // { preview: true } only shows the discounted total on the payment step; no order is created.
  if (preview) return json(req, { price: p.price, discount: p.discount, amount: p.amount, coupon: p.coupon })

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`) },
    body: JSON.stringify({
      amount: p.amount, currency: 'INR', receipt: `app_${a.id}`.slice(0, 40),
      notes: { applicant_id: a.id, email: a.email, ...(p.coupon && { coupon: p.coupon }) },
    }),
  })
  const order = await res.json()
  if (!res.ok) {
    console.error('razorpay order failed', order)
    return json(req, { error: 'Could not start payment. Please try again.' }, 502)
  }

  await supabase.from('applicants')
    .update({ order_id: order.id, amount_paise: order.amount, coupon_code: p.coupon, discount_paise: p.discount || null }).eq('id', a.id)
  return json(req, {
    orderId: order.id, amount: order.amount, keyId,
    name: `${a.first_name} ${a.last_name}`, email: a.email, phone: a.phone,
  })
})
