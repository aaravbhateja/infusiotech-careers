import { Link } from 'react-router-dom'
import { EMAIL, MAIN_SITE, LINKEDIN_URL, INSTAGRAM_URL, LOGO_MARK } from '../../data/site'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" to="/">
              <img src={LOGO_MARK} alt="InfusioTech" className="mark" />
              InfusioTech <span className="brand-sub">Careers</span>
            </Link>
            <p>Spec-Driven Web Development with AI: 2 months of training and a 1-month industry internship, from an IT consultancy working with Indian and international clients.</p>
          </div>
          <div>
            <h5>Program</h5>
            <ul>
              <li><Link to="/#program">How it works</Link></li>
              <li><Link to="/#faq">FAQ</Link></li>
              <li><Link to="/enroll">Enroll</Link></li>
            </ul>
          </div>
          <div>
            <h5>Connect</h5>
            <ul>
              <li><a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} InfusioTech, Jaipur, India</span>
          <a href={MAIN_SITE} target="_blank" rel="noopener noreferrer">infusiotech.com</a>
        </div>
      </div>
    </footer>
  )
}
