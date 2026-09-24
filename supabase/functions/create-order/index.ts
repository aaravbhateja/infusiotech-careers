import { db, guard, json } from '../_shared/common.ts'

Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const keyId = Deno.env.get('RAZORPAY_KEY_ID')
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
  const price = Number(Deno.env.get('PRICE_INR') ?? 1499)
  if (!keyId || !keySecret) return json(req, { error: 'Payments are not configured yet.' }, 503)

  const { id } = await req.json().catch(() => ({}))
  if (typeof id !== 'string') return json(req, { error: 'Application not found.' }, 404)

  const supabase = db()
  const { data: a } = await supabase.from('applicants').select('*').eq('id', id).maybeSingle()
  if (!a) return json(req, { error: 'Application not found.' }, 404)
  if (a.status === 'paid') return json(req, { error: 'Already enrolled.' }, 409)
  if (!a.follow_verified) return json(req, { error: 'Please verify that you follow our LinkedIn and Instagram pages first.' }, 403)

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`) },
    body: JSON.stringify({ amount: price * 100, currency: 'INR', receipt: `app_${a.id}`.slice(0, 40), notes: { applicant_id: a.id, email: a.email } }),
  })
  const order = await res.json()
  if (!res.ok) {
    console.error('razorpay order failed', order)
    return json(req, { error: 'Could not start payment. Please try again.' }, 502)
  }

  await supabase.from('applicants').update({ order_id: order.id, amount_paise: order.amount }).eq('id', a.id)
  return json(req, {
    orderId: order.id, amount: order.amount, keyId,
    name: `${a.first_name} ${a.last_name}`, email: a.email, phone: a.phone,
  })
})
