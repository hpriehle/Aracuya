"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { navigationLinks } from "@/data/navigation";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!overlayRef.current || !menuRef.current || !linksRef.current) return;

      const links = linksRef.current.children;

      if (isOpen) {
        gsap.to(overlayRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          onStart: () => {
            overlayRef.current!.style.pointerEvents = "auto";
          },
        });

        gsap.from(links, {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          delay: 0.2,
          ease: "power3.out",
        });
      } else {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            overlayRef.current!.style.pointerEvents = "none";
          },
        });
      }
    },
    { dependencies: [isOpen] }
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-green-dark opacity-0 pointer-events-none"
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-3 text-cream"
        aria-label="Close menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
        </svg>
      </button>

      <div ref={menuRef}>
        <div ref={linksRef} className="flex flex-col items-center gap-8">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="font-heading text-4xl font-light text-cream transition-colors duration-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={onClose}
            className="mt-4 border border-cream/30 px-8 py-3 font-body text-small font-medium uppercase tracking-widest text-cream transition-colors duration-300 hover:bg-cream hover:text-green-dark"
          >
            Reserve
          </Link>
          <div className="mt-6">
            <CurrencyToggle variant="dark" />
          </div>
        </div>
      </div>
    </div>
  );
}
