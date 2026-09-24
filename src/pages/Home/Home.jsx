import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Briefcase, GraduationCap, Users, FolderGit2, MessageSquareText, Award,
  Globe, Smartphone, Workflow, Check, ArrowRight,
} from 'lucide-react'
import { EditorialHero } from '../../components/ui/editorial-hero'
import { Ticker } from '../../components/ui/ticker'
import Reveal from '../../components/Reveal/Reveal'
import { HERO_BG, PROGRAM_PRICE, MAIN_SITE, waLink } from '../../data/site'

const TICKER_ITEMS = [
  'Enrollment open for the next batch',
  '2 months training + 1 month industry internship',
  'Learn from an IT consultancy serving Indian & international clients',
  'Online · Learn from anywhere',
]

const WHY = [
  { Icon: Briefcase, title: 'Learn from a real consultancy', text: 'Our mentors deliver projects for Indian and international clients every day. You learn the tools, workflows and standards used on the job, not just textbook theory.' },
  { Icon: GraduationCap, title: 'Training first, then the job', text: 'Two months of structured training builds the skills. The final month puts them to work in an industry-level internship.' },
  { Icon: Users, title: 'Legit industry experience', text: 'Work in a team, take tasks, ship deliverables and get reviewed like a junior engineer. That is what recruiters ask about.' },
  { Icon: FolderGit2, title: 'A portfolio that speaks', text: 'Leave with projects you can demo, a GitHub you are proud of, and stories for your interviews.' },
  { Icon: MessageSquareText, title: 'Mentor feedback', text: 'Reviews and guidance from working professionals so you fix mistakes early and learn faster.' },
  { Icon: Award, title: 'Recognition for your effort', text: 'Completion certificate and internship documentation for your resume and LinkedIn profile.' },
]

const PHASES = [
  { label: 'Month 1–2', title: 'Training', Icon: GraduationCap, points: ['Structured curriculum in your chosen track', 'Live sessions, assignments and mini-projects', 'Industry tools, version control and best practices', 'Regular doubt-clearing and progress reviews'] },
  { label: 'Month 3', title: 'Industry internship', Icon: Briefcase, points: ['Industry-level project tasks', 'Team workflow: tasks, reviews, deadlines', 'Mentor feedback on real deliverables', 'Final showcase and internship documentation'] },
]

const TRACKS = [
  { tag: 'Build', title: 'Web Development', Icon: Globe, text: 'Modern front-end and back-end, from responsive UIs to APIs and deployment.' },
  { tag: 'Build', title: 'App Development', Icon: Smartphone, text: 'Build and ship mobile and cross-platform apps with real product thinking.' },
  { tag: 'Automate', title: 'Automation & AI', Icon: Workflow, text: 'Automate business workflows with scripts, integrations and AI tooling.' },
]

const STEPS = [
  ['Fill in your details', 'Takes about two minutes.'],
  ['Follow us on LinkedIn & Instagram', 'Required for internship enrollment. Batch updates are shared there.'],
  ['Complete your payment', 'Secure checkout via Razorpay: UPI, cards, netbanking.'],
]

const FAQ = [
  ['Is the program online or offline?', 'The program is delivered online, so you can join from anywhere in India or abroad.'],
  ['How is the internship different from the training?', 'In the first two months you learn through structured training. In the third month you apply those skills on industry-level tasks under mentor guidance, the way our team works on client projects.'],
  ['Do I need prior experience?', 'No. Training starts from the fundamentals of your chosen track. Curiosity and consistency matter more than prior knowledge.'],
  ['Why do I need to follow your LinkedIn and Instagram pages?', 'It is part of internship enrollment. We share batch announcements, schedules and opportunities there.'],
  ['What payment methods are accepted?', 'UPI, debit/credit cards, netbanking and wallets through Razorpay\'s secure checkout.'],
  ['Will I get a certificate?', 'Yes. On successful completion you receive a certificate and internship documentation for your resume and LinkedIn.'],
]

export default function Home() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 350)
    return () => clearTimeout(t)
  }, [hash])

  return (
    <>
      <Ticker items={TICKER_ITEMS} />

      <EditorialHero
        pills={['3-month program', 'Training + Internship']}
        title={<>Train like a student.<br /><em>Intern like an engineer.</em></>}
        subtitle="Two months of hands-on training, then one month of a real industry internship, delivered by InfusioTech, an IT consultancy building websites, apps and automation for clients across India and worldwide."
        primaryCta={{ label: 'Enroll in the program', href: `${import.meta.env.BASE_URL}enroll` }}
        secondaryCta={{ label: 'See how it works', href: '#program' }}
        backgroundImage={HERO_BG}
        marqueeWords={['TRAIN', 'BUILD', 'INTERN', 'GET HIRED']}
      />

      <section className="section" id="why">
        <div className="wrap">
          <Reveal as="div" className="section-head">
            <div className="eyebrow">Why InfusioTech Careers</div>
            <h2>Most courses end with a certificate. Ours ends with experience.</h2>
            <p>
              <a href={MAIN_SITE} target="_blank" rel="noopener noreferrer">InfusioTech</a> is a working IT consultancy, not a coaching institute.
              You learn the way our own team works, then get to do it on live projects.
            </p>
          </Reveal>
          <div className="service-grid">
            {WHY.map((w, i) => (
              <Reveal as="div" delay={i * 0.04} key={w.title}>
                <div className="service-card">
                  <div className="icon"><w.Icon size={20} strokeWidth={1.75} /></div>
                  <h3>{w.title}</h3>
                  <p>{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="program">
        <div className="wrap">
          <Reveal as="div" className="section-head">
            <div className="eyebrow">The program</div>
            <h2>Three months. Two phases. One clear path.</h2>
          </Reveal>
          <div className="pkg-cards two-col">
            {PHASES.map((p, i) => (
              <Reveal as="div" delay={i * 0.06} key={p.title}>
                <div className={`pkg-card${i === 1 ? ' featured' : ''}`}>
                  <div className="ph-label">{p.label}</div>
                  <h3>{p.title}</h3>
                  <ul className="pkg-features">
                    {p.points.map((pt) => <li key={pt}><Check size={16} strokeWidth={2} /> {pt}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal as="div" className="section-head steps-head">
            <h2>How to get enrolled</h2>
          </Reveal>
          <ol className="enroll-steps">
            {STEPS.map(([t, d], i) => (
              <Reveal as="li" delay={i * 0.05} key={t}>
                <b>{t}</b>
                <span>{d}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="tracks">
        <div className="wrap">
          <Reveal as="div" className="section-head">
            <div className="eyebrow">Learning tracks</div>
            <h2>Pick the skills the industry hires for</h2>
            <p>Track availability may vary by batch.</p>
          </Reveal>
          <div className="service-grid">
            {TRACKS.map((t, i) => (
              <Reveal as="div" delay={i * 0.05} key={t.title}>
                <div className="service-card">
                  <div className="icon"><t.Icon size={20} strokeWidth={1.75} /></div>
                  <span className="tag">{t.tag}</span>
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap-narrow">
          <Reveal as="div" className="section-head">
            <div className="eyebrow">FAQ</div>
            <h2>Questions, answered</h2>
          </Reveal>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <p className="faq-more">
            Still unsure? <a href={waLink('Hi InfusioTech, I have a question about the careers program')} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp</a>.
          </p>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 'none' }}>
        <div className="wrap">
          <Reveal as="div" className="cta-band">
            <div>
              <h3>Ready to start? Program fee ₹{PROGRAM_PRICE.toLocaleString('en-IN')}</h3>
              <p>Reserve your seat in the next batch. Enrollment takes about five minutes.</p>
            </div>
            <Link className="btn btn-accent" to="/enroll">Enroll now <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
