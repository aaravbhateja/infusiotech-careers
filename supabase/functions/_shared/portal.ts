import { db } from './common.ts'

// No look-alike characters (0/O, 1/l/I) so the password is easy to type from an email.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const SYMBOLS = '@#$%&*'

/** Cryptographically random password, unique per intern, always containing upper, lower, digit and symbol. */
export function randomPassword(length = 12) {
  const pick = (set: string) => {
    // Rejection sampling avoids modulo bias.
    const limit = 256 - (256 % set.length)
    for (;;) {
      const [b] = crypto.getRandomValues(new Uint8Array(1))
      if (b < limit) return set[b % set.length]
    }
  }
  const chars = [pick('ABCDEFGHJKLMNPQRSTUVWXYZ'), pick('abcdefghijkmnpqrstuvwxyz'), pick('23456789'), pick(SYMBOLS)]
  while (chars.length < length) chars.push(pick(ALPHABET))
  for (let i = chars.length - 1; i > 0; i--) { // Fisher-Yates shuffle
    const [b] = crypto.getRandomValues(new Uint8Array(1))
    const j = b % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export interface PortalAccess {
  email: string
  /** Set only when a fresh temporary password was issued (first send, or a retry before the intern reset it). */
  password: string | null
}

/**
 * Makes sure the paid applicant has a portal login (id = registered email) and returns a temporary
 * password to email. If the intern has already reset their password we never touch it (password is null).
 */
// deno-lint-ignore no-explicit-any
export async function provisionPortalUser(a: any): Promise<PortalAccess> {
  const supabase = db()
  const email = String(a.email).trim().toLowerCase()
  const password = randomPassword()

  if (a.user_id) {
    const { data, error } = await supabase.auth.admin.getUserById(a.user_id)
    if (error || !data.user) throw new Error(`Portal user lookup failed: ${error?.message ?? 'not found'}`)
    if (data.user.user_metadata?.must_reset === false) return { email, password: null }
    const { error: upErr } = await supabase.auth.admin.updateUserById(a.user_id, { password })
    if (upErr) throw new Error(`Portal password issue failed: ${upErr.message}`)
    return { email, password }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { must_reset: true, first_name: a.first_name, applicant_id: a.id },
  })
  if (error || !data.user) throw new Error(`Portal user create failed: ${error?.message ?? 'unknown'}`)
  const { error: linkErr } = await supabase.from('applicants').update({ user_id: data.user.id }).eq('id', a.id)
  if (linkErr) throw new Error(`Portal user link failed: ${linkErr.message}`)
  return { email, password }
}
