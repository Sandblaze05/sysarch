'use client'

import React, { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { User2Icon } from 'lucide-react'
import gsap from 'gsap'

const HIDE_ON_ROUTES = ['/playground'];

const NavProfile = () => {
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isHidden = HIDE_ON_ROUTES.some((route) => pathname.startsWith(route));

    if (profileRef.current) {
      if (isHidden) {
        gsap.to(profileRef.current, {
          y: -100,
          opacity: 0,
          pointerEvents: "none",
          duration: 0.4,
          ease: "power3.inOut",
        });
      } else {
        gsap.to(profileRef.current, {
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
      ref={profileRef}
      className='h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center border-2 border-white/20 bg-black/50 backdrop-blur-md rounded-full mt-5'
    >
      <User2Icon />
    </div>
  )
}

export default NavProfile