export const PHONE_DISPLAY = '+91 70110 83740'
export const PHONE_INTL = '917011083740'
export const EMAIL = 'infusiotech@gmail.com'
export const MAIN_SITE = 'https://infusiotech.com'

// Program details. PROGRAM_PRICE is display-only: the amount actually charged is the
// PRICE_INR secret on the Supabase create-order function, so keep the two in sync.
export const PROGRAM_PRICE = 5000
export const PROGRAM_NAME = 'Spec-Driven Web Development with AI'
export const LINKEDIN_URL = 'https://www.linkedin.com/company/infusiotech-solutions/'
export const INSTAGRAM_URL = 'https://www.instagram.com/infusiotechsolutions/'

export const LOGO_MARK = `${import.meta.env.BASE_URL}assets/logo-mark.png`
export const HERO_BG = `${import.meta.env.BASE_URL}assets/hero-bg.jpg`

export function waLink(message) {
  return `https://wa.me/${PHONE_INTL}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
