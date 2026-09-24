import type { ReactNode } from "react"

import "./editorial-hero.css"

export interface EditorialHeroCta {
  label: string
  href: string
  external?: boolean
}

export interface EditorialHeroProps {
  pills: string[]
  title: ReactNode
  subtitle: string
  primaryCta: EditorialHeroCta
  secondaryCta?: EditorialHeroCta
  backgroundImage?: string
  /** Words looped in the oversized background marquee, e.g. service names. */
  marqueeWords: string[]
}

export const EditorialHero = ({
  pills,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  backgroundImage,
  marqueeWords,
}: EditorialHeroProps) => {
  const words = [...marqueeWords, ...marqueeWords]

  return (
    <div className="editorial-hero">
      {backgroundImage && (
        <div className="editorial-hero-photo" style={{ backgroundImage: `url(${backgroundImage})` }} aria-hidden="true" />
      )}

      <div className="editorial-hero-marquee" aria-hidden="true">
        <div className="editorial-hero-marquee-track">
          {words.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </div>

      <div className="editorial-hero-content">
        <div className="wrap">
          <div className="editorial-hero-pills">
            {pills.map((p) => (
              <span className="editorial-hero-pill" key={p}>
                {p}
              </span>
            ))}
          </div>

          <h1>{title}</h1>

          <p className="editorial-hero-sub">{subtitle}</p>

          <div className="editorial-hero-ctas">
            <a
              className="btn btn-accent"
              href={primaryCta.href}
              target={primaryCta.external ? "_blank" : undefined}
              rel={primaryCta.external ? "noopener noreferrer" : undefined}
            >
              {primaryCta.label}
            </a>
            {secondaryCta && (
              <a className="btn btn-ghost" href={secondaryCta.href}>
                {secondaryCta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
