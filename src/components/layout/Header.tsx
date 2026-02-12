"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { navigationLinks } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { CurrencyToggle } from "@/components/ui/CurrencyToggle";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollDirection, scrollY } = useScrollDirection();
  const pathname = usePathname();

  // Pages with full-screen dark hero images — header can be transparent
  const hasDarkHero =
    pathname === "/" ||
    pathname === "/about" ||
    (pathname.startsWith("/rooms/") && pathname !== "/rooms");

  const isScrolled = scrollY > 50 || !hasDarkHero;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-cream/95 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 md:px-10 lg:px-16">
          <Link
            href="/"
            className={cn(
              "font-mitchaella text-2xl tracking-wide transition-colors duration-300 md:text-3xl",
              !isScrolled && "text-white"
            )}
          >
            aracuya
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navigationLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "font-mitchaella text-small font-bold uppercase tracking-widest transition-colors duration-300",
                    isScrolled
                      ? "hover:text-green"
                      : "text-white/80 hover:text-white",
                    isActive && (isScrolled ? "text-green" : "text-white")
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <CurrencyToggle variant={isScrolled ? "light" : "dark"} />
            <Button
              href="/contact"
              size="sm"
              variant={isScrolled ? "primary" : "dark"}
            >
              Reserve
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col gap-1.5 p-2 md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={cn(
                "block h-[1.5px] w-6 transition-colors",
                isScrolled ? "bg-black" : "bg-white"
              )}
            />
            <span
              className={cn(
                "block h-[1.5px] w-6 transition-colors",
                isScrolled ? "bg-black" : "bg-white"
              )}
            />
          </button>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
