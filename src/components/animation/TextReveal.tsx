"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface TextRevealProps {
  children: React.ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export function TextReveal({
  children,
  delay = 0,
  stagger = 0.03,
  className,
  as: Tag = "div",
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(ref.current, { opacity: 1 });
        return;
      }

      const text = ref.current.textContent || "";
      const words = text.split(" ");

      ref.current.innerHTML = "";
      ref.current.style.opacity = "1";

      words.forEach((word, i) => {
        const wordSpan = document.createElement("span");
        wordSpan.style.display = "inline-block";
        wordSpan.style.overflow = "hidden";
        wordSpan.style.verticalAlign = "top";

        const inner = document.createElement("span");
        inner.textContent = word;
        inner.style.display = "inline-block";
        inner.className = "text-reveal-word";

        wordSpan.appendChild(inner);
        ref.current!.appendChild(wordSpan);

        if (i < words.length - 1) {
          const space = document.createTextNode(" ");
          ref.current!.appendChild(space);
        }
      });

      const wordEls = ref.current.querySelectorAll(".text-reveal-word");

      gsap.fromTo(wordEls,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.7,
          stagger,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={cn("opacity-0", className)}
    >
      {children}
    </Tag>
  );
}
