const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function call(fn, body) {
  if (!SUPABASE_URL || !ANON_KEY) throw new Error('Enrollment is not configured yet. Please email contact@infusiotech.com.')
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
  return data
}

export const register = (form) => call('register', form)
export const createOrder = (id, coupon) => call('create-order', { id, coupon })
export const previewCoupon = (id, coupon) => call('create-order', { id, coupon, preview: true })
export const verifyPayment = (payload) => call('verify-payment', payload)
export const verifyFollow = (payload) => call('verify-follow', payload)

// Downscale screenshots in the browser so uploads stay small and fast (max 1400px, JPEG).
export function imageToDataUrl(file, maxSide = 1400) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file (JPG, PNG or WebP).'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image. Try a different file.')) }
    img.src = url
  })
}

let razorpayPromise
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  razorpayPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = () => { razorpayPromise = undefined; reject(new Error('Could not load the payment gateway. Check your connection and retry.')) }
    document.head.appendChild(s)
  })
  return razorpayPromise
}
