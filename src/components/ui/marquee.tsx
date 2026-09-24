import type { ReactNode } from "react"
import { useReducedMotion } from "motion/react"

import "./marquee.css"

export interface MarqueeProps {
  children: ReactNode[]
  direction?: "forward" | "reverse"
  /** Seconds for one full loop; lower = faster. */
  duration?: number
}

/**
 * Infinite horizontal scroll of cards. Renders children twice so the loop
 * seam is invisible, same technique as Ticker. Falls back to a normal
 * horizontally-scrollable row under reduced-motion.
 */
export const Marquee = ({ children, direction = "forward", duration = 32 }: MarqueeProps) => {
  const shouldReduceMotion = useReducedMotion()
  const items = shouldReduceMotion ? children : [...children, ...children]

  return (
    <div
      className="marquee"
      data-direction={direction}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      <div className="marquee-track">
        {items.map((child, i) => (
          <div key={i} aria-hidden={!shouldReduceMotion && i >= children.length}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
