"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export function AboutHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(titleRef.current, { opacity: 1 });
        return;
      }

      gsap.fromTo(titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, delay: 0.4, ease: "power3.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0 bg-black/40 z-10" />

      <Image
        src="/images/about/hero.jpg"
        alt="Aracuya hotel exterior"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-20 flex h-full items-end justify-center pb-16 text-center">
        <h1
          ref={titleRef}
          className="font-heading text-h1 font-light tracking-wide text-cream opacity-0 md:text-display"
        >
          Our Story
        </h1>
      </div>
    </section>
  );
}
