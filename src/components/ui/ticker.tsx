import "./ticker.css"

export interface TickerProps {
  items: string[]
}

/**
 * Infinite horizontal marquee. Renders the item list twice back to back and
 * animates a translateX(-50%) loop, so the seam is invisible as long as
 * both copies are identical widths (guaranteed since they're the same data).
 */
export const Ticker = ({ items }: TickerProps) => {
  const doubled = [...items, ...items]

  return (
    <div className="ticker" role="region" aria-label={items.join(", ")}>
      <div className="ticker-track" aria-hidden="true">
        {doubled.map((item, i) => (
          <span className="ticker-item" key={i}>
            <span className="dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
