'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

const HIDE_ON_ROUTES = ['/playground'];

const Logo = () => {
  const pathname = usePathname();
  const logoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isHidden = HIDE_ON_ROUTES.some((route) => pathname.startsWith(route));

    if (logoRef.current) {
      if (isHidden) {
        gsap.to(logoRef.current, {
          y: -100,
          opacity: 0,
          pointerEvents: "none",
          duration: 0.4,
          ease: "power3.inOut",
        });
      } else {
        gsap.to(logoRef.current, {
          y: 0,
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.4,
          ease: "power3.inOut",
        });
      }
    }
  }, [pathname]);

  return (
    <div
      ref={logoRef}
      className='hidden sm:h-10 sm:flex items-center justify-center px-4 py-2 border-2 border-white/20 bg-black/50 backdrop-blur-md rounded-full mt-5'
    >
      <span className='font-bold font-mono tracking-widest'>{"Archyx"}</span>
    </div>
  )
}

export default Logo