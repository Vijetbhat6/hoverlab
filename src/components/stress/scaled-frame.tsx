'use client'

/**
 * A preview iframe shrunk to fit its column, at its true viewport width.
 *
 * The whole point of a stress frame is that it lays out at a real width:
 * 320px for reflow, 640px for 200% text. Putting the iframe in a narrower
 * box would re-run every breakpoint at the wrong width, which is the lie the
 * preview route was built to avoid. So the frame keeps its real size and is
 * scaled with a transform, and the box around it takes the scaled height.
 *
 * Lazy-loaded: a matrix page holds up to twenty of these and each is a full
 * document with its own JavaScript.
 */

import { useEffect, useRef, useState } from 'react'

interface ScaledFrameProps {
  src: string
  width: number
  height: number
  title: string
}

export function ScaledFrame({ src, width, height, title }: ScaledFrameProps) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / width))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width])

  return (
    <div
      ref={box}
      className="relative w-full overflow-hidden rounded-lg border border-border bg-background"
      style={{ height: Math.round(height * scale) }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        // A stress frame is a picture of a component. It is not reachable by
        // keyboard: forty tab stops inside a scaled thumbnail is a trap.
        tabIndex={-1}
        style={{
          width,
          height,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  )
}
