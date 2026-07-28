"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type InfiniteSliderProps = {
  children: ReactNode;
  className?: string;
  gap?: number;
  reverse?: boolean;
  duration?: number;
};

export function InfiniteSlider({
  children,
  className,
  gap = 32,
  reverse = false,
  duration = 40,
}: InfiniteSliderProps) {
  const trackStyle: CSSProperties = {
    animationDuration: `${duration}s`,
    animationDirection: reverse ? "reverse" : "normal",
    gap: `${gap}px`,
  };

  return (
    <div className={cn("overflow-hidden", className)}>
      <div className="marquee-track flex items-center whitespace-nowrap" style={trackStyle}>
        {children}
        {children}
      </div>
    </div>
  );
}