"use client";

import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Features } from "@/components/Features";
import FeyCards from "@/components/FeyCards";
import CompanyMarquee from "@/components/CompanyMarquee";
import Loader from "@/components/Loader";
import {
  IDLE_SETTLE_DELAY_MS,
  easeToward,
  getPointerTarget,
  getVideoFilter,
  getVideoTransform,
} from "@/components/homeHeroMotion.mjs";

const VIDEO_SRC = "/hero.mp4";

export default function HomeHero() {
  const titleWords = "Master Architecture of Scale.".split(" ");
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loaderReleaseRef = useRef<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const releaseLoader = useCallback(() => {
    window.clearTimeout(loaderReleaseRef.current);
    loaderReleaseRef.current = window.setTimeout(() => setIsLoading(false), 300);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let frame = 0;
    let settleTimer: number | undefined;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isActive = false;

    const render = () => {
      currentX = easeToward(currentX, targetX);
      currentY = easeToward(currentY, targetY);

      video.style.transform = getVideoTransform(currentX, currentY);
      video.style.filter = getVideoFilter(isActive);

      frame = window.requestAnimationFrame(render);
    };

    const settle = () => {
      targetX = 0;
      targetY = 0;
      isActive = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const target = getPointerTarget(event.clientX, event.clientY, rect);
      targetX = target.x;
      targetY = target.y;
      isActive = true;

      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, IDLE_SETTLE_DELAY_MS);
    };

    frame = window.requestAnimationFrame(render);
    section.addEventListener("pointermove", handlePointerMove);
    section.addEventListener("pointerleave", settle);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      section.removeEventListener("pointermove", handlePointerMove);
      section.removeEventListener("pointerleave", settle);
    };
  }, []);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => setIsLoading(false), 1400);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(loaderReleaseRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-black">
      <div
        aria-hidden={!isLoading}
        className={`site-loader fixed inset-0 z-1000 flex items-center justify-center bg-black transition-[opacity,visibility] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLoading ? "opacity-100 visible" : "pointer-events-none invisible opacity-0"
          }`}
      >
        <Loader />
      </div>

      <section
        ref={sectionRef}
        className="hero-stage relative min-h-screen w-full overflow-hidden"
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="hero-video absolute inset-0 h-full w-full object-cover"
          src={VIDEO_SRC}
          onLoadedData={releaseLoader}
          onCanPlay={releaseLoader}
          onError={releaseLoader}
        />

        <div className="hero-noise pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/35 via-black/10 to-black/75" />

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-5 pt-28 sm:px-6 md:px-10 md:pb-8">
          <div className="grid grid-cols-12 items-end gap-5">
            <div className="col-span-12 lg:col-span-8">
              <h1 className="max-w-[11ch] text-[18vw] font-extrabold leading-[0.86] text-[#E1E0CC] sm:text-[15vw] md:text-[13vw] lg:text-[10.5vw]">
                {titleWords.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    className="hero-word inline-block"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    {word}
                    {index < titleWords.length - 1 ? "\u00a0" : ""}
                  </span>
                ))}
              </h1>
            </div>

            <div className="col-span-12 flex max-w-xl flex-col items-start gap-5 pt-1 lg:col-span-4 lg:pb-5">
              <p className="hero-fade-up text-sm leading-snug text-[#E1E0CC]/80 sm:text-base md:text-lg">
                Learn system design through visual architecture maps, realistic
                problems, and guided patterns built for engineers preparing to
                design at scale.
              </p>

              <Link
                href="/playground"
                className="hero-fade-up group inline-flex items-center gap-2 rounded-full bg-[#E1E0CC] py-1 pl-5 pr-1 text-sm font-semibold text-black transition-all hover:gap-3 sm:text-base"
                style={{ animationDelay: "620ms" }}
              >
                Start designing
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
                  <ArrowRight className="h-4 w-4 text-[#E1E0CC]" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CompanyMarquee />

      <Features />

      <section aria-label="Featured system design cards">
        <FeyCards />
      </section>

      
    </main>
  );
}
