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
              <div className="flex items-center gap-2">
                <a href="tel:+233597957528" className="transition-colors duration-300 hover:text-cream">
                  +233 597 957 528
                </a>
                <a
                  href="https://wa.me/233597957528"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Chat on WhatsApp"
                  className="text-cream/80 transition-colors duration-300 hover:text-cream"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
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
