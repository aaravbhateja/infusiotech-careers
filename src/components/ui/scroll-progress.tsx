import { motion, useScroll, useSpring, useReducedMotion } from "motion/react"

/**
 * Thin brand-gradient bar across the top showing how far down the page the
 * visitor is. Sits above the sticky header. Hidden entirely under
 * reduced-motion, where a constantly-moving indicator is the kind of
 * ambient motion the preference is asking us to drop.
 */
export const ScrollProgress = () => {
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 })

  if (shouldReduceMotion) return null

  return (
    <motion.div
      aria-hidden="true"
      style={{
        scaleX,
        transformOrigin: "0% 50%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 200,
        background: "var(--grad-brand)",
      }}
    />
  )
}
