import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animation/FadeIn";
import { ContactForm } from "@/components/sections/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Aracuya. Whether planning a stay or simply curious, our team is here to help. Book your luxury getaway in Paradise Valley, Arizona.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Aracuya",
    description:
      "Get in touch with Aracuya. Whether planning a stay or simply curious, our team is here to help. Book your luxury getaway in Paradise Valley, Arizona.",
    images: [
      {
        url: "/images/hero/main.jpg",
        width: 1200,
        height: 630,
        alt: "Aracuya Luxury Hotel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Aracuya",
    description:
      "Get in touch with Aracuya. Whether planning a stay or simply curious, our team is here to help. Book your luxury getaway in Paradise Valley, Arizona.",
    images: ["/images/hero/main.jpg"],
  },
};

export default function ContactPage() {
  return (
    <>
      <section className="pt-40 pb-24 md:pt-48 md:pb-32">
        <Container>
          <div className="text-center">
            <FadeIn>
              <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
                Contact
              </span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="mt-4 font-heading text-h1 font-light">
                Get in Touch
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mx-auto mt-4 max-w-lg font-body text-body-lg font-light text-gray">
                We would be delighted to hear from you. Whether planning a stay
                or simply curious, our team is here to help.
              </p>
            </FadeIn>
          </div>

          <div className="mt-16 grid gap-16 md:grid-cols-2">
            <FadeIn>
              <ContactForm />
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="space-y-10 text-center">
                <div>
                  <h2 className="font-body text-xs font-medium uppercase tracking-widest text-green">
                    Address
                  </h2>
                  <p className="mt-3 font-body text-body font-light leading-relaxed text-gray">
                    123 Tranquility Lane
                    <br />
                    Paradise Valley, AZ 85253
                  </p>
                </div>

                <div>
                  <h2 className="font-body text-xs font-medium uppercase tracking-widest text-green">
                    Email
                  </h2>
                  <a
                    href="mailto:info@aracuya.com"
                    className="mt-3 block font-body text-body font-light text-gray transition-colors hover:text-green"
                  >
                    info@aracuya.com
                  </a>
                </div>

                <div>
                  <h2 className="font-body text-xs font-medium uppercase tracking-widest text-green">
                    Phone
                  </h2>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <a
                      href="tel:+233597957528"
                      className="font-body text-body font-light text-gray transition-colors hover:text-green"
                    >
                      +233 597 957 528
                    </a>
                    <a
                      href="https://wa.me/233597957528"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Chat on WhatsApp"
                      className="text-gray transition-colors hover:text-green"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div>
                  <h2 className="font-body text-xs font-medium uppercase tracking-widest text-green">
                    Hours
                  </h2>
                  <p className="mt-3 font-body text-body font-light text-gray">
                    Front Desk: 24 hours
                    <br />
                    Concierge: 7:00 AM — 10:00 PM
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>
    </>
  );
}
