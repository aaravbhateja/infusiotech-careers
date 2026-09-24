import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Briefcase, GraduationCap, Users, FolderGit2, Award, Check, ArrowRight,
  FileText, Bot, Presentation, Handshake, ScrollText, UserCheck,
} from 'lucide-react'
import { EditorialHero } from '../../components/ui/editorial-hero'
import { Ticker } from '../../components/ui/ticker'
import Reveal from '../../components/Reveal/Reveal'
import { HERO_BG, PROGRAM_PRICE, MAIN_SITE, waLink } from '../../data/site'

const TICKER_ITEMS = [
  'Enrollment open for the next batch',
  'Spec-Driven Web Development with AI',
  '2 months training + 1 month industry internship',
  'L1, L2 managers and mentors from day 1',
  'Online · Learn from anywhere',
]

const WHY = [
  { Icon: Briefcase, title: 'Learn from a real consultancy', text: 'Our team delivers projects for Indian and international clients every day. You learn the tools, workflows and standards used on the job, not just textbook theory.' },
  { Icon: FileText, title: 'Spec first, then build with AI', text: 'Learn the way modern teams ship: write a clear spec, then use AI coding tools to build, test and review against it. Faster work, fewer rewrites.' },
  { Icon: UserCheck, title: 'Onboarded from day 1', text: 'You are onboarded into our systems, connected to HR, and assigned an L1 manager, an L2 manager and mentors who guide you through the program.' },
  { Icon: Users, title: 'Work on industry projects', text: 'Take tasks, ship deliverables and get reviewed like a junior engineer on our team. That is the experience recruiters ask about.' },
  { Icon: FolderGit2, title: 'A portfolio that speaks', text: 'Leave with projects you can demo, a GitHub you are proud of, and stories for your interviews.' },
  { Icon: Award, title: 'Two certificates and a letter', text: 'A training completion certificate, an internship completion certificate and a proper internship letter for your resume and LinkedIn.' },
]

const PHASES = [
  { label: 'Month 1–2', title: 'Training', Icon: GraduationCap, points: ['Spec-driven web development: requirements, specs, design and task breakdown', 'Building, testing and reviewing web apps with AI coding tools', 'Lectures, live meetings and hands-on assignments', 'Webinars and workshops with industry experts and our tech team', 'Training completion certificate'] },
  { label: 'Month 3', title: 'Industry internship', Icon: Briefcase, points: ['Internship letter and onboarding into our systems', 'Work on industry projects with our team', 'Tasks, reviews and deadlines under your L1 and L2 managers', 'Guidance from mentors on real deliverables', 'Internship completion certificate'] },
]

const INCLUDED = [
  { tag: 'Learn', title: 'Lectures & meetings', Icon: GraduationCap, text: 'Recorded lectures in your Intern Portal plus live meetings with your managers and mentors.' },
  { tag: 'Learn', title: 'Webinars & workshops', Icon: Presentation, text: 'Sessions with industry experts and our tech team on how real projects are specced, built and shipped.' },
  { tag: 'Build', title: 'AI-powered development', Icon: Bot, text: 'Hands-on practice turning specs into working web apps with AI coding assistants, then testing and reviewing the result.' },
  { tag: 'Support', title: 'HR, managers & mentors', Icon: Handshake, text: 'Connected to HR from day 1, with an assigned L1 manager, L2 manager and mentors to guide your work.' },
  { tag: 'Work', title: 'Industry projects', Icon: FolderGit2, text: 'Contribute to industry projects during the internship month, the same way our team works.' },
  { tag: 'Credentials', title: 'Letter & certificates', Icon: ScrollText, text: 'Internship letter on enrollment, plus separate certificates for completing the training and the internship.' },
]

const STEPS = [
  ['Fill in your details', 'Takes about two minutes.'],
  ['Follow us on LinkedIn & Instagram', 'Required for internship enrollment. Batch updates are shared there.'],
  ['Complete your payment', 'Secure checkout via Razorpay: UPI, cards, netbanking.'],
]

const FAQ = [
  ['What is spec-driven development with AI?', 'You first write a clear specification of what to build: requirements, design and a task breakdown. Then you use AI coding tools to implement it, and test and review the result against the spec. It is how modern teams use AI to ship faster without losing quality.'],
  ['Is the program online or offline?', 'The program is delivered online, so you can join from anywhere in India or abroad.'],
  ['How is the internship different from the training?', 'In the first two months you learn through lectures, meetings, webinars and workshops. In the third month you apply those skills on industry projects with our team, under your managers and mentors.'],
  ['Who will guide me?', 'From day 1 you are onboarded into our systems, connected to HR, and assigned an L1 manager, an L2 manager and mentors. You also learn from industry experts and our tech team in webinars and workshops.'],
  ['Do I need prior experience?', 'No. Training starts from the fundamentals of web development. Curiosity and consistency matter more than prior knowledge.'],
  ['Why do I need to follow your LinkedIn and Instagram pages?', 'It is part of internship enrollment. We share batch announcements, schedules and opportunities there.'],
  ['What payment methods are accepted?', 'UPI, debit/credit cards, netbanking and wallets through Razorpay\'s secure checkout.'],
  ['Will I get a certificate?', 'Yes, two. You get a certificate for completing the training and another for completing the internship, along with a proper internship letter when you enroll.'],
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
        pills={['Spec-Driven Web Development with AI', '3 months: Training + Internship']}
        title={<>Spec it clearly.<br /><em>Build it with AI.</em></>}
        subtitle="Two months of training in spec-driven web development with AI, then a one-month internship on industry projects. Delivered by InfusioTech, an IT consultancy building websites, apps and automation for clients across India and worldwide."
        primaryCta={{ label: 'Enroll in the program', href: `${import.meta.env.BASE_URL}enroll` }}
        secondaryCta={{ label: 'See how it works', href: '#program' }}
        backgroundImage={HERO_BG}
        marqueeWords={['SPEC', 'BUILD WITH AI', 'INTERN', 'GET HIRED']}
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

      <section className="section" id="included">
        <div className="wrap">
          <Reveal as="div" className="section-head">
            <div className="eyebrow">What's included</div>
            <h2>Everything you need to go from learner to intern</h2>
            <p>One focused program: Spec-Driven Web Development with AI.</p>
          </Reveal>
          <div className="service-grid">
            {INCLUDED.map((t, i) => (
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
