'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import gsap from 'gsap'
import {
  House,
  SquareTerminal,
  MessagesSquare,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: House, name: "Home", path: "/" },
  { icon: SquareTerminal, name: "Problems", path: "/problems" },
  { icon: MessagesSquare, name: "Discuss", path: "/discuss" },
  { icon: BookOpen, name: "Wiki", path: "/wiki" },
];

const Navbar = () => {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = NAV_ITEMS.findIndex((item) => {
      if (item.path === "/") return pathname === "/";
      return pathname.startsWith(item.path);
    });

    if (activeIndex === -1) {
      if (navRef.current) {
        gsap.to(navRef.current, {
          y: -100, // Translates the navbar 100px up
          opacity: 0,
          pointerEvents: "none", // Prevents clicking invisible links
          duration: 0.4,
          ease: "power3.inOut",
        });
      }
    } else {
      if (navRef.current) {
        gsap.to(navRef.current, {
          y: 0,
          opacity: 1,
          pointerEvents: "auto",
          duration: 0.4,
          ease: "power3.inOut",
        });
      }

      const activeLink = linksRef.current[activeIndex];
      if (activeLink && pillRef.current) {
        gsap.to(pillRef.current, {
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
          duration: 0.4,
          ease: "power3.out",
          opacity: 1, // Ensures pill is visible once positioned
        });
      }
    }
  }, [pathname]);

  return (
    <div
      ref={navRef}
      className='relative z-999 h-8 sm:h-10 px-1 py-1 border-2 border-white/20 bg-black/50 backdrop-blur-md rounded-full mt-5 flex items-center justify-around gap-2 sm:gap-8'
    >
      <div
        ref={pillRef}
        // Added opacity-0 initially to prevent a 1-frame jump on page load
        className='bg-white rounded-full absolute h-6 sm:h-7 z-998 opacity-0'
      />
      {NAV_ITEMS.map((link, index) => (
        <Link
          key={link.name}
          href={link.path}
          ref={(el: HTMLAnchorElement | null) => { linksRef.current[index] = el }}
          className='text-sm font-semibold w-9 sm:w-19 h-6 sm:h-7 px-1 inline-flex items-center justify-center gap-1.5 rounded-full text-center tracking-wide z-999 mix-blend-difference cursor-pointer transition-colors hover:bg-white/20'
        >
          <link.icon className='w-4 h-4 shrink-0 inline sm:hidden' />
          <span className='hidden sm:inline'>{link.name}</span>
        </Link>
      ))}
    </div>
  )
}

export default Navbar