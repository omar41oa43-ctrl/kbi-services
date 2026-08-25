"use client";

import React from "react";
import { motion, useAnimation } from "framer-motion";

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
  const controls = useAnimation();

  React.useEffect(() => {
    controls.start({
      rotate: 360,
      transition: {
        repeat: Infinity,
        ease: "linear",
        duration: spinDuration,
      },
    });
  }, [spinDuration, controls]);

  const handleMouseEnter = () => {
    if (onHover === "speedUp") {
      controls.start({
        rotate: 360,
        transition: {
          repeat: Infinity,
          ease: "linear",
          duration: spinDuration / 2,
        },
      });
    } else if (onHover === "slowDown") {
      controls.start({
        rotate: 360,
        transition: {
          repeat: Infinity,
          ease: "linear",
          duration: spinDuration * 2,
        },
      });
    } else if (onHover === "pause") {
      controls.stop();
    }
  };

  const handleMouseLeave = () => {
    controls.start({
      rotate: 360,
      transition: {
        repeat: Infinity,
        ease: "linear",
        duration: spinDuration,
      },
    });
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center rounded-full ${className}`}
      animate={controls}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
    </motion.div>
  );
}
