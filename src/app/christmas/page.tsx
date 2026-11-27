import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { BookingWidget } from "@/components/ui/BookingWidget";
import { ContactCTA } from "@/components/sections/home/ContactCTA";
import { WHATSAPP_NUMBER, rooms } from "@/data/rooms";

const TITLE = "Christmas & New Year at Aracuya | Over-Water Villa, Ghana";
const DESCRIPTION =
  "Spend Christmas and New Year on the water in Beyin, Ghana. A three-bedroom over-water villa near Nzulezu that sleeps six. Book direct by card or on WhatsApp.";
const IMAGE = {
  url: "/images/hero/aracuya-aerial-view.jpg",
  alt: "Aracuya from above: a thatched villa on stilts, reached by a long boardwalk over lily-covered water",
};

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/christmas" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/christmas",
    images: [{ url: IMAGE.url, width: 1200, height: 630, alt: IMAGE.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [IMAGE.url],
  },
};

const property = rooms[0];
const ghs = (n: number) => `GH₵${n.toLocaleString("en-US")}`;

const reasons: { title: string; body: React.ReactNode }[] = [
  {
    title: "Room for the family",
    body: `Three bedrooms and three baths for up to ${property.occupancy * property.totalRooms} guests. Book one room, two, or the whole villa.`,
  },
  {
    title: "The dry season",
    body: "November to March is the most comfortable time of year on the coast, with lower humidity and calmer travel.",
  },
  {
    title: "Nzulezu by canoe",
    body: (
      <>
        The canoe to the stilt village leaves from Beyin, a short walk away. Go
        early in the morning, and skip Thursday, the lake&rsquo;s sacred day.{" "}
        <Link href="/nzulezu" className="text-green underline underline-offset-4">
          How to visit Nzulezu
        </Link>
      </>
    ),
  },
];

export default function ChristmasPage() {
  return (
    <>
      <section className="pt-40 pb-16 md:pt-48 md:pb-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              20 December to 3 January
            </span>
            <h1 className="mt-6 font-heading text-h1 font-light md:text-display">
              Christmas and New Year on the water
            </h1>
            <p className="mx-auto mt-6 max-w-xl font-body text-body-lg font-light leading-relaxed text-gray">
              Aracuya is a three-bedroom over-water villa in Beyin, in
              Ghana&rsquo;s Western Region, a short walk from where the canoe
              leaves for Nzulezu. Spend the holidays here with the people you
              love.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-20 md:pb-28">
        <Container>
          <div className="mx-auto grid max-w-5xl overflow-hidden rounded-sm bg-green text-cream md:grid-cols-[1.1fr_1fr]">
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[360px]">
              <Image
                src={IMAGE.url}
                alt={IMAGE.alt}
                fill
                priority
                sizes="(min-width: 768px) 540px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-8 md:p-10">
              <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-cream/60">
                Rates a night
              </span>
              <dl className="mt-4 divide-y divide-cream/15">
                {property.pricingTiers.map((t) => (
                  <div key={t.rooms} className="flex items-baseline justify-between gap-6 py-3">
                    <dt className="font-body text-body font-light text-cream/80">
                      {t.rooms === property.totalRooms ? "Whole villa" : t.label}
                      <span className="block text-small text-cream/60">
                        Up to {t.rooms * property.occupancy} guests
                      </span>
                    </dt>
                    <dd className="font-heading text-h4 font-light">{ghs(t.price)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Button href="/reserve" variant="dark" size="sm">
                  Book by card
                </Button>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-small font-light text-cream underline underline-offset-4"
                >
                  Book on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream-dark py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-lg">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Check your dates
            </span>
            <h2 className="mt-4 font-heading text-h2 font-light">See what is free</h2>
            <p className="mt-4 mb-8 font-body text-body font-light leading-relaxed text-gray">
              The calendar shows live availability. Pick your nights between 20
              December and 3 January, then pay by card to book.
            </p>
            <BookingWidget variant="light" initialMonth="2026-12" />
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-4xl">
            <span className="font-body text-xs font-medium uppercase tracking-[0.2em] text-green">
              Why Beyin for the holidays
            </span>
            <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-3">
              {reasons.map((r) => (
                <div key={r.title} className="border-t border-gray-light pt-4">
                  <h3 className="font-heading text-h4 font-light">{r.title}</h3>
                  <p className="mt-2 font-body text-body font-light leading-relaxed text-gray">
                    {r.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-12 font-body text-small font-light text-gray">
              Questions before you book? Message us on WhatsApp at{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green underline underline-offset-4"
              >
                +233 55 154 2355
              </a>
              , or{" "}
              <Link href="/rooms" className="text-green underline underline-offset-4">
                see the villa
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      <ContactCTA />
    </>
  );
}
