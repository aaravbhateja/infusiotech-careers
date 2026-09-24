import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LOGO_MARK } from '../../data/site'

const LINKS = [
  { to: '/#why', label: 'Why us' },
  { to: '/#program', label: 'Program' },
  { to: '/#tracks', label: 'Tracks' },
  { to: '/#faq', label: 'FAQ' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="wrap nav-row">
        <NavLink className="brand" to="/">
          <img src={LOGO_MARK} alt="InfusioTech" className="mark" />
          InfusioTech <span className="brand-sub">Careers</span>
        </NavLink>
        <nav className={`primary-nav${open ? ' is-open' : ''}`}>
          <div className="nav-links-group">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
          </div>
          <Link to="/portal" onClick={() => setOpen(false)}>Intern login</Link>
          <Link className="nav-cta" to="/enroll" onClick={() => setOpen(false)}>Enroll now</Link>
        </nav>
        <button
          className="nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
