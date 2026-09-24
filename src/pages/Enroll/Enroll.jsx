import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Upload, XCircle, ExternalLink } from 'lucide-react'
import { Ambient3D } from '../../components/ui/ambient-3d'
import { LINKEDIN_URL, INSTAGRAM_URL, PROGRAM_PRICE, PROGRAM_NAME, EMAIL } from '../../data/site'
import { register, createOrder, verifyPayment, verifyFollow, imageToDataUrl, loadRazorpay } from '../../lib/api'

const STEP_LABELS = ['Your details', 'Follow us', 'Payment']

// lucide-react no longer ships brand logos, so these are drawn inline.
const LinkedInIcon = () => (
  <svg className="brand-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
)
const InstagramIcon = () => (
  <svg className="brand-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5.5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const EMPTY = {
  first_name: '', last_name: '', email: '', phone: '', gender: '', country: 'India', state: '',
  college: '', qualification: '', current_year: '', source: '',
}

const REQUIRED_MSG = {
  first_name: 'Enter your first name', last_name: 'Enter your last name', email: 'Enter your email',
  phone: 'Enter your contact number', gender: 'Select your gender', country: 'Enter your country',
  state: 'Enter your state', college: 'Enter your college name', qualification: 'Select your highest qualification',
  current_year: 'Select your current year', source: 'Tell us where you heard about us',
}

const OPTIONS = {
  gender: ['Male', 'Female', 'Other', 'Prefer not to say'],
  qualification: ['High school / 12th', 'Diploma', "Bachelor's (pursuing)", "Bachelor's (completed)", "Master's (pursuing)", "Master's (completed)", 'Other'],
  current_year: ['1st year', '2nd year', '3rd year', '4th year', '5th year', 'Completed'],
  source: ['LinkedIn', 'Instagram', 'Friend / Referral', 'College / Campus', 'WhatsApp / Telegram group', 'Google search', 'Other'],
}

function validate(f) {
  const e = {}
  for (const k of Object.keys(REQUIRED_MSG)) if (!f[k].trim()) e[k] = REQUIRED_MSG[k]
  if (!e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Enter a valid email address'
  if (!e.phone && !/^\+?[0-9\s-]{8,16}$/.test(f.phone.trim())) e.phone = 'Enter a valid number (digits, optional +)'
  return e
}

export default function Enroll() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [shots, setShots] = useState({ li: null, ig: null }) // { name, dataUrl }
  const [opened, setOpened] = useState({ li: false, ig: false }) // which follow pages they've opened
  const [result, setResult] = useState(null) // { linkedin: bool, instagram: bool } from the last failed check
  const [applicantId, setApplicantId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const summaryRef = useRef(null)

  const errors = validate(form)
  const showError = (k) => (touched[k] || attempted) && errors[k]
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const goto = (n) => { setError(''); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const submitDetails = async (e) => {
    e.preventDefault()
    if (Object.keys(errors).length) {
      setAttempted(true)
      setTimeout(() => summaryRef.current?.focus(), 0)
      return
    }
    setBusy(true); setError('')
    try {
      const { id } = await register(form)
      setApplicantId(id)
      goto(1)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const pickShot = (key) => async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(''); setResult(null)
    try {
      const dataUrl = await imageToDataUrl(file)
      setShots((s) => ({ ...s, [key]: { name: file.name, dataUrl } }))
    } catch (err) { setError(err.message) }
  }

  const submitFollow = async () => {
    if (!shots.li || !shots.ig) { setError('Please upload a screenshot for both LinkedIn and Instagram.'); return }
    setBusy(true); setError(''); setResult(null)
    try {
      const r = await verifyFollow({ id: applicantId, linkedin: shots.li.dataUrl, instagram: shots.ig.dataUrl })
      if (r.ok) goto(2)
      else {
        setResult(r)
        setError("We couldn't confirm the follow from your screenshot(s). Follow the page(s) marked in red, then upload a fresh screenshot showing the \"Following\" button.")
      }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const pay = async () => {
    setBusy(true); setError('')
    try {
      const [order] = await Promise.all([createOrder(applicantId), loadRazorpay()])
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        order_id: order.orderId,
        name: 'InfusioTech Careers',
        description: `${PROGRAM_NAME} (3 months)`,
        prefill: { name: order.name, email: order.email, contact: order.phone },
        theme: { color: '#2C8C82' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (resp) => {
          try {
            await verifyPayment(resp)
            goto(3)
          } catch {
            setError(`Payment received but verification is pending. Please email ${EMAIL} with payment ID ${resp.razorpay_payment_id}.`)
          } finally { setBusy(false) }
        },
      })
      rzp.on('payment.failed', (f) => { setError(f.error?.description || 'Payment failed. Please try again.'); setBusy(false) })
      rzp.open()
    } catch (err) { setError(err.message); setBusy(false) }
  }

  const field = (name, label, { type = 'text', ...rest } = {}) => (
    <div className="field" key={name}>
      <label htmlFor={`f-${name}`}>{label}</label>
      {OPTIONS[name] ? (
        <select id={`f-${name}`} value={form[name]} onChange={set(name)} onBlur={blur(name)}
          aria-invalid={Boolean(showError(name))} className={showError(name) ? 'has-error' : undefined}>
          <option value="">Select</option>
          {OPTIONS[name].map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={`f-${name}`} type={type} value={form[name]} onChange={set(name)} onBlur={blur(name)}
          aria-invalid={Boolean(showError(name))} className={showError(name) ? 'has-error' : undefined} {...rest} />
      )}
      {showError(name) && <p className="field-error">{errors[name]}</p>}
    </div>
  )

  return (
    <>
      <section className="page-header">
        <Ambient3D variant="page" />
        <div className="wrap">
          <div className="eyebrow">Enroll</div>
          <h1>Reserve your seat</h1>
          <p>Three quick steps to secure your place in the next batch of {PROGRAM_NAME}: 2 months of training and a 1-month internship.</p>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 'none' }}>
        <div className="wrap-narrow">
          {step < 3 && (
            <ol className="stepper">
              {STEP_LABELS.map((l, i) => (
                <li key={l} className={i === step ? 'on' : i < step ? 'done' : undefined}>{i + 1}. {l}</li>
              ))}
            </ol>
          )}

          <div className="enroll-panel">
            {step === 0 && (
              <form onSubmit={submitDetails} noValidate>
                {attempted && Object.keys(errors).length > 0 && (
                  <div className="form-error-summary" role="alert" tabIndex={-1} ref={summaryRef}>
                    <h3>There's a problem</h3>
                    <ul>{Object.entries(errors).map(([k, m]) => <li key={k}><a href={`#f-${k}`}>{m}</a></li>)}</ul>
                  </div>
                )}
                <div className="form-2col">
                  {field('first_name', 'First name', { autoComplete: 'given-name' })}
                  {field('last_name', 'Last name', { autoComplete: 'family-name' })}
                  {field('email', 'Email', { type: 'email', autoComplete: 'email' })}
                  {field('phone', 'Contact number', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98765 43210' })}
                  {field('gender', 'Gender')}
                  {field('country', 'Country', { autoComplete: 'country-name' })}
                  {field('state', 'State', { autoComplete: 'address-level1' })}
                  {field('college', 'College name')}
                  {field('qualification', 'Highest academic qualification')}
                  {field('current_year', 'Current year of course')}
                </div>
                {field('source', 'Where did you hear about InfusioTech Careers?')}
                {error && <p className="field-error" role="alert">{error}</p>}
                <button className="btn btn-accent" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Continue'}</button>
              </form>
            )}

            {step === 1 && (
              <div>
                <h2>Follow our pages to unlock payment</h2>
                <p className="muted">Do this for both pages: tap the button to open our page, click <b>Follow</b>, take a screenshot showing the &quot;Following&quot; button, then come back and upload it here.</p>
                <div className="social-grid">
                  {[
                    { key: 'li', label: 'LinkedIn', handle: 'InfusioTech Solutions', url: LINKEDIN_URL, Icon: LinkedInIcon, ok: result?.linkedin },
                    { key: 'ig', label: 'Instagram', handle: '@infusiotechsolutions', url: INSTAGRAM_URL, Icon: InstagramIcon, ok: result?.instagram },
                  ].map(({ key, label, handle, url, Icon, ok }) => (
                    <div className={`social-card${result && !ok ? ' bad' : ''}`} key={key}>
                      <div className="social-head"><Icon /> <div><b>{label}</b><small>{handle}</small></div></div>

                      <p className="social-step"><span className="step-n">1</span> <span className="step-text">Open our page and click <b>Follow</b></span></p>
                      <a className={`follow-btn ${key}`} href={url} target="_blank" rel="noopener noreferrer" onClick={() => setOpened((o) => ({ ...o, [key]: true }))}>
                        <Icon /> Open InfusioTech on {label} <ExternalLink size={16} />
                      </a>
                      {opened[key] && <small className="opened-note"><CheckCircle2 size={14} /> Opened in a new tab. Follow us there, then come back.</small>}

                      <p className="social-step"><span className="step-n">2</span> <span className="step-text">Upload a screenshot showing &quot;Following&quot;</span></p>
                      <label className="upload">
                        <Upload size={16} /> {shots[key] ? 'Change screenshot' : 'Upload screenshot'}
                        <input type="file" accept="image/*" onChange={pickShot(key)} hidden />
                      </label>
                      {shots[key] && <span className="file-name">{shots[key].name}</span>}
                      {result && !ok && <span className="file-bad"><XCircle size={14} /> Could not confirm the follow</span>}
                    </div>
                  ))}
                </div>
                {error && <p className="field-error" role="alert">{error}</p>}
                <div className="btn-row">
                  <button className="btn btn-ghost" type="button" onClick={() => goto(0)}>Back</button>
                  <button className="btn btn-accent" type="button" onClick={submitFollow} disabled={busy}>{busy ? 'Verifying…' : 'Verify & continue'}</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2>Complete your enrollment</h2>
                <div className="bill">
                  <div><span>{PROGRAM_NAME} · 3-month Training + Internship</span><b>₹{PROGRAM_PRICE.toLocaleString('en-IN')}</b></div>
                  <small>One-time fee. Secure payment via Razorpay (UPI, cards, netbanking, wallets).</small>
                </div>
                {error && <p className="field-error" role="alert">{error}</p>}
                <div className="btn-row">
                  <button className="btn btn-ghost" type="button" onClick={() => goto(1)} disabled={busy}>Back</button>
                  <button className="btn btn-accent" type="button" onClick={pay} disabled={busy}>{busy ? 'Please wait…' : 'Pay & enroll'}</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="done">
                <CheckCircle2 size={56} strokeWidth={1.5} />
                <h2>You're enrolled!</h2>
                <p className="muted">Payment received. Welcome to InfusioTech Careers. We've emailed your Letter of Intent and your Intern Portal login (your registered email plus a temporary password). Check your inbox and spam folder, then sign in and set a new password.</p>
                <Link className="btn btn-accent" to="/portal">Go to Intern Portal</Link>
                <Link className="btn btn-ghost" to="/">Back to home</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
