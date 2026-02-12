"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

interface ParallaxImageProps {
  src: string;
  alt: string;
  speed?: number;
  className?: string;
  priority?: boolean;
  overlay?: boolean;
  sizes?: string;
}

export function ParallaxImage({
  src,
  alt,
  speed = 0.3,
  className,
  priority = false,
  overlay = false,
  sizes = "100vw",
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useGSAP(
    () => {
      if (!containerRef.current || !imageRef.current || isMobile) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) return;

      gsap.to(imageRef.current, {
        yPercent: speed * 20,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: containerRef, dependencies: [isMobile] }
  );

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      <div ref={imageRef} className="h-[120%] w-full -translate-y-[10%]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>
      {overlay && (
        <div className="absolute inset-0 bg-black/30" />
      )}
    </div>
  );
}
