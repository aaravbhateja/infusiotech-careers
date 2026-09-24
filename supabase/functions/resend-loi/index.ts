import { db, guard, json, safeEqual } from '../_shared/common.ts'
import { makeLoi, sendLoiOnce, sendMail } from '../_shared/mail.ts'

// Admin tool (needs ADMIN_TOKEN):
//   { token, id, action: "resend" }  -> clears the sent flag and re-sends the email to a paid applicant
//   { token, action: "preview" }     -> returns a sample LOI PDF (no email) so you can check the layout
//   { token, id, action: "preview" } -> same, with that applicant's real details
//   { token, action: "sample", to }  -> emails a sample LOI (sample data) to the given address
Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const admin = Deno.env.get('ADMIN_TOKEN')
  const { token, id, action, to } = await req.json().catch(() => ({}))
  if (!admin || typeof token !== 'string' || !safeEqual(token, admin)) return json(req, { error: 'Unauthorized' }, 401)

  if (action === 'preview') {
    let a = null
    if (id) a = (await db().from('applicants').select('*').eq('id', id).maybeSingle()).data
    a ??= {
      id: '00000000-0000-4000-8000-000000000000', first_name: 'Sample', last_name: 'Student', email: 'sample@example.com',
      college: 'Sample Institute of Technology', state: 'Rajasthan', country: 'India', payment_id: 'pay_SAMPLE123',
      amount_paise: 500000, paid_at: new Date().toISOString(),
    }
    const { bytes, filename } = await makeLoi(a)
    return new Response(bytes, {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="${filename}"`, 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (action === 'sample' && typeof to === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) {
    try {
      await sendMail({
        id: '00000000-0000-4000-8000-000000000000', first_name: 'Sample', last_name: 'Student', email: to,
        college: 'Sample Institute of Technology', state: 'Rajasthan', country: 'India', payment_id: 'pay_SAMPLE123',
        amount_paise: 500000, paid_at: new Date().toISOString(),
      })
      return json(req, { ok: true, sent_to: to })
    } catch (e) {
      return json(req, { ok: false, error: String(e instanceof Error ? e.message : e) }, 502)
    }
  }

  if (action === 'resend' && typeof id === 'string') {
    await db().from('applicants').update({ loi_sent_at: null }).eq('id', id).eq('status', 'paid')
    await sendLoiOnce(id)
    const { data } = await db().from('applicants').select('loi_sent_at,loi_error').eq('id', id).maybeSingle()
    return json(req, { ok: Boolean(data?.loi_sent_at), sent_at: data?.loi_sent_at, error: data?.loi_error })
  }
  return json(req, { error: 'Unknown action' }, 400)
})
