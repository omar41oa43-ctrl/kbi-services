import type React from "react";

interface CircularTextProps {
  text: string;
  spinDuration?: number;
  onHover?: "speedUp" | "slowDown" | "pause" | "goBonkers";
  className?: string;
}

export default function CircularText({
  text,
  spinDuration = 20,
  onHover = "speedUp",
  className = "",
}: CircularTextProps) {
  const letters = Array.from(text);

  return (
    <div
      className={`circular-text relative flex items-center justify-center rounded-full ${className}`}
      data-hover-mode={onHover}
      style={
        {
          "--circular-text-duration": `${spinDuration}s`,
          "--circular-text-hover-duration": `${onHover === "speedUp" ? spinDuration / 2 : spinDuration * 2}s`,
        } as React.CSSProperties
      }
    >
      <div className="relative w-full h-full">
        {letters.map((letter, i) => {
          const rotation = (360 / letters.length) * i;
          return (
            <span
              key={i}
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                height: "50%", // Radius
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>
    </div>
  );
}
