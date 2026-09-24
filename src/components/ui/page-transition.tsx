import type { ReactNode } from "react"
import { useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"

const EASE = [0.16, 1, 0.3, 1] as const

export interface PageTransitionProps {
  children: ReactNode
}

/**
 * Route-level enter/exit animation. Exit is deliberately faster than the
 * entrance so back/forward navigation never feels like it is waiting on an
 * animation.
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  const shouldReduceMotion = useReducedMotion()

  // Scroll reset lives here rather than in a route-level effect: with
  // AnimatePresence mode="wait" the new page mounts only once the old one
  // has finished exiting, which is exactly when the jump should happen.
  // Resetting on pathname change instead would yank the outgoing page to
  // the top mid-exit.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (shouldReduceMotion) return <>{children}</>

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" } }}
    >
      {children}
    </motion.div>
  )
}
