"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          [headingRef.current, buttonRef.current],
          { opacity: 1 }
        );
        return;
      }

      const tl = gsap.timeline({ delay: 0.5 });

      tl.fromTo(
        headingRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
        .fromTo(
          buttonRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.5"
        );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative min-h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 bg-black/40 z-10" />

      <Image
        src="/images/hero/main.jpg"
        alt="Aracuya luxury hotel"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-20 flex min-h-dvh flex-col items-center justify-center px-5 py-28 text-center text-white">
        <h1
          ref={headingRef}
          className="font-mitchaella text-h2 tracking-wide opacity-0 md:text-h1"
        >
          Where Luxury Meets Tradition
        </h1>
        <div ref={buttonRef} className="mt-8 opacity-0">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded border border-white px-9 py-4 font-body text-small font-medium uppercase tracking-widest text-white transition-all duration-300 hover:border-green hover:bg-green"
          >
            Reserve
          </Link>
        </div>
      </div>
    </section>
  );
}
