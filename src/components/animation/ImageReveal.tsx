"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface ImageRevealProps {
  src: string;
  alt: string;
  direction?: "left" | "right" | "bottom" | "center";
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export function ImageReveal({
  src,
  alt,
  direction = "left",
  className,
  aspectRatio = "aspect-[4/3]",
  priority = false,
}: ImageRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(containerRef.current, { clipPath: "inset(0 0% 0 0)" });
        return;
      }

      const clipPaths = {
        left: {
          from: "inset(0 100% 0 0)",
          to: "inset(0 0% 0 0)",
        },
        right: {
          from: "inset(0 0 0 100%)",
          to: "inset(0 0 0 0%)",
        },
        bottom: {
          from: "inset(100% 0 0 0)",
          to: "inset(0% 0 0 0)",
        },
        center: {
          from: "inset(50% 50% 50% 50%)",
          to: "inset(0% 0% 0% 0%)",
        },
      };

      const img = containerRef.current.querySelector("img");

      gsap.set(containerRef.current, { clipPath: clipPaths[direction].from });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
          once: true,
        },
      });

      tl.to(containerRef.current, {
        clipPath: clipPaths[direction].to,
        duration: 1.2,
        ease: "expo.inOut",
      });

      if (img) {
        tl.from(
          img,
          {
            scale: 1.1,
            duration: 1.4,
            ease: "power2.out",
          },
          0
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", aspectRatio, className)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}
