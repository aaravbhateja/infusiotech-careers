import { motion, useReducedMotion } from 'motion/react'

const EASE = [0.16, 1, 0.3, 1]

/**
 * Fades + slides a block into view the first time it scrolls into the
 * viewport. Respects prefers-reduced-motion by skipping the animation
 * and rendering the final state immediately.
 */
export default function Reveal({ children, delay = 0, y = 18, className, as = 'div', ...rest }) {
  const shouldReduceMotion = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  if (shouldReduceMotion) {
    const Plain = as
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    )
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
