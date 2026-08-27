"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Pause, Play } from "lucide-react"

export interface SlidingLogoMarqueeItem {
  id: string
  content: React.ReactNode
  href?: string
}

export interface SlidingLogoMarqueeProps {
  items: SlidingLogoMarqueeItem[]
  speed?: number
  pauseOnHover?: boolean
  enableBlur?: boolean
  blurIntensity?: number
  height?: string
  width?: string
  gap?: string
  scale?: number
  direction?: "horizontal" | "vertical"
  autoPlay?: boolean
  backgroundColor?: string
  showGridBackground?: boolean
  className?: string
  onItemClick?: (_item: SlidingLogoMarqueeItem) => void
  enableSpillEffect?: boolean
  animationSteps?: number
  showControls?: boolean
}

export function SlidingLogoMarquee({
  items,
  speed = 60,
  pauseOnHover = true,
  enableBlur = true,
  blurIntensity = 1,
  height = "100px",
  width = "100%",
  gap = "0.5rem",
  scale = 1,
  direction = "horizontal",
  autoPlay = true,
  backgroundColor,
  showGridBackground = false,
  className,
  onItemClick,
  enableSpillEffect = false,
  animationSteps = 8,
  showControls = true,
}: SlidingLogoMarqueeProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [canAnimate, setCanAnimate] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)")
    const update = () => setCanAnimate(!media.matches)

    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  const shouldAnimate = canAnimate && autoPlay
  const renderedItems = shouldAnimate ? [...items, ...items] : items

  const handleItemClick = (item: SlidingLogoMarqueeItem) => {
    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer")
    }
    onItemClick?.(item)
  }

  const togglePlayState = () => {
    setIsPlaying((playing) => !playing)
  }

  const blurDivs = Array.from({ length: animationSteps }, (_, index) => (
    <div key={index} style={{ "--index": index } as React.CSSProperties} />
  ))

  return (
    <div
      className={cn("sliding-marquee-container", className)}
      style={{
        backgroundColor,
        ...(showGridBackground
          ? {
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }
          : {}),
      }}
    >
      <style>{`
         .sliding-marquee-container {
           --speed: ${speed};
           --count: ${items.length};
           --scale: ${scale};
           --blur: ${blurIntensity};
           --blurs: ${animationSteps};
         }

         .sliding-marquee-resizable {
           overflow: clip;
           container-type: size;
           scale: var(--scale);
           width: 100%;
           height: ${height};
           min-height: 100px;
           min-width: 300px;
         }

         @media (min-width: 600px) {
           .sliding-marquee-resizable { min-width: 500px; }
         }
         @media (min-width: 1024px) {
           .sliding-marquee-resizable { min-width: 800px; }
         }

         .sliding-marquee-resizable[data-spill="true"] .sliding-marquee-inner::after {
           content: "";
           position: fixed;
           top: 50%;
           left: 50%;
           width: calc(var(--scale) * 10000vw);
           height: calc(var(--scale) * 10000vh);
           pointer-events: none;
           translate: -50% -50%;
           mask: linear-gradient(white, white) 50% 50% / 100% 100% no-repeat,
               linear-gradient(white, white) 50% 50% / 100cqi 100cqh no-repeat;
           mask-composite: exclude;
         }

         .sliding-marquee-inner {
           height: 100%;
           width: 100%;
           position: relative;
           mask: linear-gradient(90deg, transparent, black 15% 85%, transparent);
           display: grid;
           min-height: 100px;
           min-width: 300px;
           pointer-events: none;
         }

         .sliding-marquee-blur {
           position: absolute;
           top: 0;
           bottom: 0;
           width: 25%;
           z-index: 2;
           pointer-events: none;
         }
         .sliding-marquee-blur--right { right: 0; }
         .sliding-marquee-blur--left { left: 0; rotate: 180deg; }
         .sliding-marquee-blur div {
           position: absolute;
           inset: 0;
           z-index: var(--index);
           mask: linear-gradient(90deg,
               transparent calc(var(--index) * calc((100 / var(--blurs)) * 1%)),
               black calc((var(--index) + 1) * calc((100 / var(--blurs)) * 1%)),
               black calc((var(--index) + 2) * calc((100 / var(--blurs)) * 1%)),
               transparent calc((var(--index) + 3) * calc((100 / var(--blurs)) * 1%)));
           backdrop-filter: blur(calc((var(--index, 0) * var(--blur, 0)) * 1px));
         }

         .sliding-marquee-list {
           display: flex;
           gap: ${gap};
           padding: 0;
           margin: 0;
           list-style-type: none;
           height: 100%;
           width: fit-content;
           align-items: center;
           pointer-events: auto;
           will-change: transform;
           animation-timing-function: linear;
           animation-iteration-count: infinite;
         }

         .sliding-marquee-item {
           height: 80%;
           aspect-ratio: 16 / 9;
           font-size: clamp(1rem, 3vw + 0.5rem, 4rem);
           display: grid;
           place-items: center;
           cursor: pointer;
           transition: transform 0.2s ease;
           pointer-events: auto;
           color: currentColor;
         }
         .sliding-marquee-item:hover { transform: scale(1.05); }
         .sliding-marquee-item svg { height: 65%; }

         @media (max-width: 767px) {
           .sliding-marquee-list { gap: 0.25rem !important; }
           .sliding-marquee-item { height: 60% !important; font-size: 0.875rem !important; }
         }

         @keyframes marqueeX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
         @keyframes marqueeY { from { transform: translateY(0); } to { transform: translateY(-50%); } }
      `}</style>

      <div
        className="sliding-marquee-resizable"
        data-spill={enableSpillEffect ? "true" : "false"}
        style={{ width, height }}
      >
        <div className="sliding-marquee-inner">
          {enableBlur && canAnimate && (
            <div className="sliding-marquee-blur sliding-marquee-blur--left">{blurDivs}</div>
          )}
          {enableBlur && canAnimate && (
            <div className="sliding-marquee-blur sliding-marquee-blur--right">{blurDivs}</div>
          )}

          <ul
            className="sliding-marquee-list"
            style={{
              animationPlayState: shouldAnimate && isPlaying ? "running" : "paused",
              animationName: shouldAnimate ? (direction === "vertical" ? "marqueeY" : "marqueeX") : "none",
              animationDuration: `${speed}s`,
            }}
            onMouseEnter={() => shouldAnimate && pauseOnHover && setIsPlaying(false)}
            onMouseLeave={() => shouldAnimate && pauseOnHover && setIsPlaying(autoPlay)}
          >
            {renderedItems.map((item, index) => (
              <li
                key={`${item.id}-${index}`}
                className="sliding-marquee-item"
                onClick={() => handleItemClick(item)}
              >
                {item.content}
              </li>
            ))}
          </ul>

          {showControls && canAnimate && (
            <button
              className="absolute right-4 bottom-4 z-10 bg-background/80 hover:bg-background border border-border text-foreground rounded-full p-2 shadow-xs transition-colors"
              onClick={togglePlayState}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
