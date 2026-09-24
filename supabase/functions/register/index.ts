import { db, guard, json } from '../_shared/common.ts'

const FIELDS = ['first_name', 'last_name', 'email', 'gender', 'phone', 'state', 'country', 'college', 'qualification', 'current_year', 'source'] as const
const clean = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, 200)

Deno.serve(async (req) => {
  const early = guard(req)
  if (early) return early

  const body = await req.json().catch(() => ({}))
  const d: Record<string, string> = {}
  for (const f of FIELDS) d[f] = clean(body[f])

  if (FIELDS.some((f) => !d[f])) return json(req, { error: 'Please fill in all fields.' }, 400)
  d.email = d.email.toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return json(req, { error: 'Enter a valid email address.' }, 400)
  if (!/^\+?[0-9\s-]{8,16}$/.test(d.phone)) return json(req, { error: 'Enter a valid contact number.' }, 400)

  const supabase = db()
  const { data: existing } = await supabase.from('applicants').select('id,status').ilike('email', d.email).maybeSingle()

  if (existing?.status === 'paid')
    return json(req, { error: 'This email is already enrolled. Check your inbox for details.' }, 409)

  if (existing) {
    const { error } = await supabase.from('applicants').update(d).eq('id', existing.id)
    if (error) return json(req, { error: 'Could not save your details. Please try again.' }, 500)
    return json(req, { id: existing.id })
  }
  const { data, error } = await supabase.from('applicants').insert(d).select('id').single()
  if (error) return json(req, { error: 'Could not save your details. Please try again.' }, 500)
  return json(req, { id: data.id })
})
