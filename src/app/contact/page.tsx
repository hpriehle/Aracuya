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
                  <a
                    href="tel:+15550000000"
                    className="mt-3 block font-body text-body font-light text-gray transition-colors hover:text-green"
                  >
                    +1 (555) 000-0000
                  </a>
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
