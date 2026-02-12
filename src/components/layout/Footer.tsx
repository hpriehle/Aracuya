import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="bg-green-dark py-12 text-cream/80 md:py-16">
      <Container>
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Link
              href="/"
              className="font-heading text-3xl font-light text-cream"
            >
              Aracuya
            </Link>
            <p className="mt-4 max-w-xs font-body text-small leading-relaxed">
              A sanctuary of refined luxury, where every detail has been
              thoughtfully considered for your comfort.
            </p>
          </div>

          <div>
            <span className="mb-4 block font-body text-xs font-medium uppercase tracking-widest text-cream">
              Explore
            </span>
            <nav className="flex flex-col gap-3">
              <Link
                href="/rooms"
                className="font-body text-small transition-colors duration-300 hover:text-cream"
              >
                Rooms
              </Link>
              <Link
                href="/about"
                className="font-body text-small transition-colors duration-300 hover:text-cream"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="font-body text-small transition-colors duration-300 hover:text-cream"
              >
                Contact
              </Link>
            </nav>
          </div>

          <div>
            <span className="mb-4 block font-body text-xs font-medium uppercase tracking-widest text-cream">
              Contact
            </span>
            <div className="flex flex-col gap-3 font-body text-small">
              <a href="mailto:info@aracuya.com" className="transition-colors duration-300 hover:text-cream">
                info@aracuya.com
              </a>
              <a href="tel:+15550000000" className="transition-colors duration-300 hover:text-cream">
                +1 (555) 000-0000
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-cream/10 pt-6">
          <p className="font-body text-xs text-cream/40">
            &copy; {new Date().getFullYear()} Aracuya. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
