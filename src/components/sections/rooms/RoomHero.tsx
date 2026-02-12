"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Room } from "@/types/room";

interface RoomHeroProps {
  room: Room;
}

export function RoomHero({ room }: RoomHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set([titleRef.current, taglineRef.current], { opacity: 1 });
        return;
      }

      const tl = gsap.timeline({ delay: 0.4 });

      tl.fromTo(titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      ).fromTo(
        taglineRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.5"
      );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative h-[70vh] w-full overflow-hidden">
      <div className="absolute inset-0 bg-black/40 z-10" />

      <Image
        src={room.images.hero}
        alt={`${room.name} — luxury accommodation with ${room.bedType.toLowerCase()} bed`}
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover"
      />

      <div className="relative z-20 flex h-full flex-col items-center justify-end pb-16 text-center text-cream">
        <h1
          ref={titleRef}
          className="font-heading text-h1 font-light tracking-wide opacity-0 md:text-display"
        >
          {room.name}
        </h1>
        <p
          ref={taglineRef}
          className="mt-3 font-body text-body-lg font-light tracking-wide opacity-0"
        >
          {room.tagline}
        </p>
      </div>
    </section>
  );
}
