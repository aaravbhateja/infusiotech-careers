import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"
import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react"

import "./tilt-card.css"

export interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max rotation in degrees at the card's edges. */
  maxTilt?: number
  /** How far the card lifts toward the viewer on hover, in px. */
  lift?: number
}

/**
 * Tilts toward the pointer in real 3D. Uses `transformPerspective` rather
 * than a wrapping element with `perspective`, so the card stays a direct
 * child of whatever grid/flex container it sits in and existing layout
 * (stretch, margin-top:auto footers) keeps working untouched.
 *
 * Falls back to a plain element under reduced-motion or on touch, where
 * there is no meaningful hover position to track.
 */
export const TiltCard = ({ children, className, maxTilt = 7, lift = 8 }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  const spring = { stiffness: 220, damping: 22, mass: 0.6 }
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [maxTilt, -maxTilt]), spring)
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-maxTilt, maxTilt]), spring)
  const translateZ = useSpring(0, spring)

  const canTilt =
    !shouldReduceMotion &&
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches

  if (!canTilt) {
    return <div className={className}>{children}</div>
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5)
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handlePointerEnter = () => translateZ.set(lift)

  const handlePointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
    translateZ.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className ? `${className} tilt-card-surface` : "tilt-card-surface"}
      style={{ rotateX, rotateY, translateZ, transformPerspective: 900 }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  )
}
