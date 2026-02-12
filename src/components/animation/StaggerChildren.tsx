"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface StaggerChildrenProps {
  children: React.ReactNode;
  stagger?: number;
  direction?: "up" | "left";
  className?: string;
}

export function StaggerChildren({
  children,
  stagger = 0.15,
  direction = "up",
  className,
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const items = ref.current.children;

      if (prefersReducedMotion) {
        gsap.set(items, { opacity: 1 });
        return;
      }

      const directionMap = {
        up: { y: 40 },
        left: { x: 40 },
      };

      gsap.fromTo(
        items,
        {
          opacity: 0,
          ...directionMap[direction],
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
