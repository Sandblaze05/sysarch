import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const POSITIONS = {
  open: 0,
  closed: -310,  // Tucks the panel away leaving ~50px edge peek visible
  hover: -285,   // Smooth 25px preview slide on hover when closed
};

const Panel = () => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);

  // Main slide animation on state change
  useEffect(() => {
    if (!panelRef.current) return;

    gsap.to(panelRef.current, {
      x: isPanelOpen ? POSITIONS.open : POSITIONS.closed,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });

    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotate: isPanelOpen ? 0 : 225,
        duration: 0.35,
        delay: 0.2,
        ease: 'back.out(1.5)',
      });
    }
  }, [isPanelOpen]);

  // Hover peek when panel is closed
  const handleMouseEnter = () => {
    if (!isPanelOpen && panelRef.current) {
      gsap.to(panelRef.current, {
        x: POSITIONS.hover,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  // Return to full close on mouse leave
  const handleMouseLeave = () => {
    if (!isPanelOpen && panelRef.current) {
      gsap.to(panelRef.current, {
        x: POSITIONS.closed,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  // Allow users to click anywhere on the peek area to open the panel
  const handlePanelClick = () => {
    if (!isPanelOpen) {
      setIsPanelOpen(true);
    }
  };

  return (
    <div
      ref={panelRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handlePanelClick}
      className={`fixed flex flex-col p-5 z-50 top-1/2 -translate-y-1/2 left-6 h-130 w-90 bg-[#171717]/80 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl transition-shadow duration-300 select-none ${
        !isPanelOpen ? 'cursor-pointer hover:border-white/30' : ''
      }`}
    >
      <div className="flex justify-between items-center w-full border-b border-white/10 pb-4 mb-4">
        <h1 className="text-xl font-semibold font-mono text-white tracking-widest">Panel</h1>
        <button
          type="button"
          aria-label={isPanelOpen ? 'Close panel' : 'Open panel'}
          onClick={(e) => {
            e.stopPropagation();
            setIsPanelOpen((prev) => !prev);
          }}
          className="p-1.5 rounded-lg hover:text-white/10 transition-colors focus:outline-none"
        >
          <svg
            ref={iconRef}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a3a3a3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hover:stroke-white transition-colors"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 text-sm text-neutral-400">
        
      </div>
    </div>
  );
};

export default Panel;