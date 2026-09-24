import { useEffect, useRef } from "react"

import "./ambient-3d.css"

export interface Ambient3DProps {
  /** "hero" = three large shapes, "page" = two smaller/subtler ones. */
  variant?: "hero" | "page"
  /** Max tilt (deg) the group leans toward the pointer on desktop. */
  tilt?: number
}

/**
 * Decorative 3D layer. Absolutely positioned, so the parent needs
 * `position: relative`. Pointer-events are off, so it never blocks clicks —
 * the pointer listener is attached to the parent element instead.
 */
export const Ambient3D = ({ variant = "hero", tilt = 10 }: Ambient3DProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parent = rootRef.current?.parentElement
    const group = groupRef.current
    if (!parent || !group) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (!window.matchMedia("(pointer: fine)").matches) return

    const handlePointerMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      group.style.transform = `rotateY(${x * tilt}deg) rotateX(${y * -tilt}deg)`
    }
    const handlePointerLeave = () => {
      group.style.transform = "rotateY(0deg) rotateX(0deg)"
    }

    parent.addEventListener("pointermove", handlePointerMove)
    parent.addEventListener("pointerleave", handlePointerLeave)
    return () => {
      parent.removeEventListener("pointermove", handlePointerMove)
      parent.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [tilt])

  return (
    <div ref={rootRef} className="ambient-3d" data-variant={variant} aria-hidden="true">
      <div ref={groupRef} className="ambient-3d-group">
        <div className="ambient-3d-shape shape-a" />
        <div className="ambient-3d-shape shape-b" />
        <div className="ambient-3d-shape shape-c" />
      </div>
    </div>
  )
}
